import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as crypto from 'crypto';

export interface AuditLogDto {
  workspaceId: string;
  actor: string;
  action: string;
  resource: string;
  severity?: string;
  category?: string;
  correlationId?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: any;
}

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async log(dto: AuditLogDto) {
    // We must serialize the transaction or lock to ensure strict chaining,
    // but for MVP we will use a simple query.
    return this.prisma.$transaction(async (tx) => {
      // 1. Get previous hash for the workspace
      const lastLog = await tx.auditLog.findFirst({
        where: { workspaceId: dto.workspaceId },
        orderBy: { timestamp: 'desc' },
      });

      const previousHash = lastLog?.hash || null;
      const timestamp = new Date();

      // 2. Compute current hash (Immutable integrity)
      // Format: previousHash + actor + action + resource + timestamp
      const dataToHash = `${previousHash || 'genesis'}|${dto.actor}|${dto.action}|${dto.resource}|${timestamp.toISOString()}`;
      const hash = crypto.createHash('sha256').update(dataToHash).digest('hex');

      // 3. Save
      return tx.auditLog.create({
        data: {
          workspaceId: dto.workspaceId,
          actor: dto.actor,
          action: dto.action,
          resource: dto.resource,
          severity: dto.severity || 'INFO',
          category: dto.category || 'GENERAL',
          correlationId: dto.correlationId,
          ipAddress: dto.ipAddress,
          userAgent: dto.userAgent,
          metadata: dto.metadata || {},
          previousHash,
          hash,
          timestamp,
        },
      });
    });
  }
}
