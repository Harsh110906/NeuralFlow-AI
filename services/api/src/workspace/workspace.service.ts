import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WorkspaceService {
  constructor(private prisma: PrismaService) {}

  async getWorkspaces() {
    return this.prisma.workspace.findMany();
  }

  async getWorkspaceBySlug(slug: string) {
    return this.prisma.workspace.findUnique({
      where: { slug },
      include: {
        workflows: true,
        agents: true,
        members: {
          include: { user: true },
        },
      },
    });
  }

  async bootstrapWorkspace(userId: string) {
    const existingMembership = await this.prisma.workspaceMember.findFirst({
      where: { userId },
      include: { workspace: true },
    });

    if (existingMembership) {
      return existingMembership.workspace;
    }

    // Provision new workspace
    return await this.prisma.$transaction(async (tx) => {
      const workspace = await tx.workspace.create({
        data: {
          name: 'My Workspace',
          slug: `workspace-${userId.substring(0, 8)}-${Date.now()}`,
          ownerId: userId,
        },
      });

      const adminRole = await tx.role.create({
        data: {
          workspaceId: workspace.id,
          name: 'ADMIN',
          isSystem: true,
          description: 'Administrator Role',
        },
      });

      await tx.workspaceMember.create({
        data: {
          userId,
          workspaceId: workspace.id,
          roleId: adminRole.id,
        },
      });

      return workspace;
    });
  }
}
