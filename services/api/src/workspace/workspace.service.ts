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
}
