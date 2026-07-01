import {
  Injectable,
  NotFoundException,
  Inject,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type {
  SearchProvider,
  SearchQueryParams,
} from './search/search.provider';

@Injectable()
export class MarketplaceService {
  constructor(
    private prisma: PrismaService,
    @Inject('SearchProvider') private searchProvider: SearchProvider,
  ) {}

  async searchTemplates(params: SearchQueryParams) {
    return this.searchProvider.search(params);
  }

  async installTemplate(
    templateId: string,
    versionId: string,
    workspaceId: string,
  ) {
    const template = await this.prisma.template.findUnique({
      where: { id: templateId },
    });
    if (!template) throw new NotFoundException('Template not found');

    const version = await this.prisma.templateVersion.findUnique({
      where: { id: versionId },
    });
    if (!version) throw new NotFoundException('Version not found');

    if (version.deprecationStatus === 'END_OF_LIFE') {
      throw new BadRequestException(
        'Cannot install END_OF_LIFE templates. Please choose a newer version.',
      );
    }

    // Increment installs
    await this.prisma.template.update({
      where: { id: templateId },
      data: { installs: { increment: 1 } },
    });

    // Create TemplateInstallation
    await this.prisma.templateInstallation.create({
      data: {
        templateId,
        versionId,
        workspaceId,
        currentVersion: version.version,
      },
    });

    // We can handle WORKFLOW, AGENT, or BUNDLE
    if (template.type === 'WORKFLOW' || template.type === 'BUNDLE') {
      await this.prisma.workflow.create({
        data: {
          workspaceId,
          name: `${template.name} (Cloned v${version.version})`,
          description: template.description,
          dagJson: version.dagJson || {},
        },
      });
    }

    if (template.type === 'AGENT' || template.type === 'BUNDLE') {
      const agents = Array.isArray(version.agentJson)
        ? version.agentJson
        : [version.agentJson];
      for (const a of agents as any[]) {
        if (a) {
          await this.prisma.agent.create({
            data: {
              workspaceId,
              name: `${a.name} (Cloned)`,
              systemPrompt: a.systemPrompt,
              model: a.model || 'gpt-4o-mini',
              tools: a.tools || [],
            },
          });
        }
      }
    }

    return { success: true };
  }
}
