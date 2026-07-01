import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PublishTemplateDto } from './dto/publish-template.dto';
import { TemplateRegistry } from './template.registry';

@Injectable()
export class TemplateService {
  private readonly logger = new Logger(TemplateService.name);

  constructor(private prisma: PrismaService) {}

  async getTemplates(workspaceId?: string, isPublic?: boolean) {
    const whereClause: any = {};
    if (workspaceId) {
      // Return workspace templates + global templates
      whereClause.OR = [{ workspaceId }, { isGlobal: true }];
    } else {
      // Return only global templates
      whereClause.isGlobal = true;
    }

    return this.prisma.template.findMany({
      where: whereClause,
      include: {
        versions: {
          orderBy: { version: 'desc' },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getTemplateDetails(id: string, version?: number) {
    const template = await this.prisma.template.findUnique({
      where: { id },
      include: {
        versions: version
          ? { where: { version } }
          : { orderBy: { version: 'desc' }, take: 1 },
      },
    });

    if (!template) {
      throw new NotFoundException('Template not found');
    }

    if (!template.versions || template.versions.length === 0) {
      throw new NotFoundException('Template version not found');
    }

    return template;
  }

  async publishTemplate(
    workspaceId: string,
    data: PublishTemplateDto,
    userId: string,
  ) {
    if (data.type !== 'WORKFLOW' && data.type !== 'AGENT') {
      throw new BadRequestException(
        'Invalid template type. Must be WORKFLOW or AGENT.',
      );
    }

    // Check if we are updating an existing template by name within the same workspace
    const existingTemplate = await this.prisma.template.findFirst({
      where: {
        workspaceId,
        name: data.name,
      },
      include: {
        versions: {
          orderBy: { version: 'desc' },
          take: 1,
        },
      },
    });

    if (existingTemplate) {
      // Create a new version
      const nextVersion =
        existingTemplate.versions.length > 0
          ? existingTemplate.versions[0].version + 1
          : 1;

      const newVersion = await this.prisma.templateVersion.create({
        data: {
          templateId: existingTemplate.id,
          version: nextVersion,
          dagJson: data.dagJson || {},
          agentJson: data.agentJson || {},
          requiredConnectors: data.requiredConnectors || [],
          requiredSecrets: data.requiredSecrets || [],
          createdBy: userId,
        },
      });

      return this.prisma.template.update({
        where: { id: existingTemplate.id },
        data: { activeVersionId: newVersion.id },
        include: { versions: true },
      });
    } else {
      // Create a new template and its first version
      const newTemplate = await this.prisma.template.create({
        data: {
          workspaceId,
          name: data.name,
          description: data.description,
          category: data.category,
          type: data.type,
          isGlobal: false,
          visibility: 'PUBLIC',
          versions: {
            create: {
              version: 1,
              dagJson: data.dagJson || {},
              agentJson: data.agentJson || {},
              requiredConnectors: data.requiredConnectors || [],
              requiredSecrets: data.requiredSecrets || [],
              createdBy: userId,
            },
          },
        },
        include: { versions: true },
      });

      return this.prisma.template.update({
        where: { id: newTemplate.id },
        data: { activeVersionId: newTemplate.versions[0].id },
        include: { versions: true },
      });
    }
  }

  async seedSystemTemplates() {
    this.logger.log('Seeding system templates...');
    const betaTemplates = TemplateRegistry.getBetaTemplates();

    // We assume the system workspace is a known ID or we create one if needed,
    // but for now, we'll use a placeholder 'system' workspace ID.
    const systemWorkspaceId = 'system';

    // Ensure system workspace exists
    const systemWorkspace = await this.prisma.workspace.findUnique({
      where: { id: systemWorkspaceId },
    });
    if (!systemWorkspace) {
      // We need a dummy user for the system workspace
      const dummyUser = await this.prisma.user.upsert({
        where: { clerkId: 'system_user' },
        update: {},
        create: {
          email: 'system@neuralflow.ai',
          clerkId: 'system_user',
          firstName: 'System',
          lastName: 'User',
        },
      });

      await this.prisma.workspace.create({
        data: {
          id: systemWorkspaceId,
          name: 'System Workspace',
          slug: 'system',
          ownerId: dummyUser.id,
        },
      });
    }

    for (const betaTemplate of betaTemplates) {
      const existing = await this.prisma.template.findFirst({
        where: { name: betaTemplate.name, workspaceId: systemWorkspaceId },
      });

      if (!existing) {
        const template = await this.prisma.template.create({
          data: {
            workspaceId: systemWorkspaceId,
            name: betaTemplate.name,
            description: betaTemplate.description,
            category: betaTemplate.category,
            type: 'WORKFLOW', // Beta templates are currently workflows
            isGlobal: true,
            visibility: 'PUBLIC',
            versions: {
              create: {
                version: 1,
                dagJson: betaTemplate.dagJson || {},
                requiredConnectors: betaTemplate.requiredConnectors || [],
                requiredSecrets: betaTemplate.requiredSecrets || [],
                createdBy: 'system',
              },
            },
          },
          include: { versions: true },
        });

        await this.prisma.template.update({
          where: { id: template.id },
          data: { activeVersionId: template.versions[0].id },
        });

        this.logger.log(`Seeded template: ${betaTemplate.name}`);
      }
    }

    this.logger.log('System templates seeding completed.');
  }

  async installTemplate(
    templateId: string,
    destWorkspaceId: string,
    userId: string,
    versionId?: string,
  ) {
    // Resolve template and version
    const template = await this.prisma.template.findUnique({
      where: { id: templateId },
      include: {
        versions: true,
      },
    });

    if (!template) throw new NotFoundException('Template not found');

    let targetVersion;
    if (versionId) {
      targetVersion = template.versions.find((v) => v.id === versionId);
    } else if (template.activeVersionId) {
      targetVersion = template.versions.find(
        (v) => v.id === template.activeVersionId,
      );
    } else if (template.versions.length > 0) {
      targetVersion = template.versions[0];
    }

    if (!targetVersion) {
      throw new NotFoundException('Template version not found');
    }

    // Security check: user must be able to see the template
    // If it's not global, they must be installing from their own workspace (for now)
    if (!template.isGlobal && template.workspaceId !== destWorkspaceId) {
      throw new BadRequestException(
        'Cannot install a private template from another workspace in Beta.',
      );
    }

    // Clone into workspace
    if (template.type === 'WORKFLOW') {
      const workflow = await this.prisma.workflow.create({
        data: {
          workspaceId: destWorkspaceId,
          name: `${template.name} (Copy)`,
          description: template.description,
          dagJson: targetVersion.dagJson || {},
          version: 1,
        },
      });
      return { type: 'WORKFLOW', item: workflow };
    } else if (template.type === 'AGENT') {
      const agentPayload = targetVersion.agentJson || {};
      const agent = await this.prisma.agent.create({
        data: {
          workspaceId: destWorkspaceId,
          name: `${template.name} (Copy)`,
          systemPrompt: agentPayload.systemPrompt || '',
          model: agentPayload.model || 'gpt-4o-mini',
          tools: agentPayload.tools || [],
        },
      });
      return { type: 'AGENT', item: agent };
    } else {
      throw new BadRequestException(
        `Unsupported template type: ${template.type}`,
      );
    }
  }
}
