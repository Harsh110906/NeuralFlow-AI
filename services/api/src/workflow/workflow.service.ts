import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateWorkflowDto } from './dto/update-workflow.dto';
import { CreateWorkflowDto } from './dto/create-workflow.dto';
import { TemplateService } from '../template/template.service';

@Injectable()
export class WorkflowService {
  constructor(
    private prisma: PrismaService,
    private templateService: TemplateService,
  ) {}

  async getWorkflowsByWorkspace(workspaceId: string) {
    return this.prisma.workflow.findMany({
      where: { workspaceId },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async getWorkflow(id: string) {
    const workflow = await this.prisma.workflow.findUnique({
      where: { id },
    });
    if (!workflow) throw new NotFoundException('Workflow not found');
    return workflow;
  }

  async createWorkflow(dto: CreateWorkflowDto) {
    let initialDagJson: any = null;

    if (dto.templateId) {
      const template = await this.templateService.getTemplateDetails(
        dto.templateId,
      );
      if (!template || !template.versions || template.versions.length === 0) {
        throw new BadRequestException('Invalid template ID provided.');
      }
      initialDagJson = template.versions[0].dagJson;
    }

    return this.prisma.workflow.create({
      data: {
        workspaceId: dto.workspaceId,
        name: dto.name,
        description: dto.description || '',
        dagJson: initialDagJson || {},
        version: 1,
        isPublished: false,
      },
    });
  }

  async updateWorkflow(id: string, dto: UpdateWorkflowDto) {
    if (dto.dagJson) {
      const { nodes, edges } = dto.dagJson;
      if (nodes && !Array.isArray(nodes))
        throw new BadRequestException('nodes must be an array');
      if (edges && !Array.isArray(edges))
        throw new BadRequestException('edges must be an array');

      if (nodes) {
        for (const node of nodes) {
          if (!node.id || typeof node.id !== 'string')
            throw new BadRequestException('invalid node id');
        }
      }

      if (edges) {
        for (const edge of edges) {
          if (!edge.id || !edge.source || !edge.target)
            throw new BadRequestException(
              'invalid edge structure: missing id, source, or target',
            );
        }
      }
    }

    return this.prisma.workflow.update({
      where: { id },
      data: {
        dagJson: dto.dagJson,
        name: dto.name,
        description: dto.description,
      },
    });
  }
}
