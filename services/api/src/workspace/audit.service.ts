import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async logAction(
    actor: string,
    action: string,
    resource: string,
    workspaceId: string,
    metadata?: any,
  ) {
    return this.prisma.auditLog.create({
      data: {
        actor,
        action,
        resource,
        workspaceId,
        metadata: metadata || {},
      },
    });
  }
}
