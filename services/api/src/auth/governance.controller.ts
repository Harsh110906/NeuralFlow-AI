import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Res,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PermissionsGuard } from './permissions.guard';
import { RequirePermissions } from './permissions.decorator';
import type { Response } from 'express';
import { ApiKeyService } from './api-key.service';

@Controller('governance')
export class GovernanceController {
  constructor(
    private prisma: PrismaService,
    private apiKeyService: ApiKeyService,
  ) {}

  @Get('audit/:workspaceId')
  @UseGuards(PermissionsGuard)
  @RequirePermissions('audit:read')
  async getAuditLogs(
    @Param('workspaceId') workspaceId: string,
    @Query('limit') limit = 50,
    @Query('offset') offset = 0,
  ) {
    return this.prisma.auditLog.findMany({
      where: { workspaceId },
      orderBy: { timestamp: 'desc' },
      take: Number(limit),
      skip: Number(offset),
    });
  }

  @Get('audit/:workspaceId/export')
  @UseGuards(PermissionsGuard)
  @RequirePermissions('audit:export')
  async exportAuditLogs(
    @Param('workspaceId') workspaceId: string,
    @Res() res: Response,
  ) {
    const logs = await this.prisma.auditLog.findMany({
      where: { workspaceId },
      orderBy: { timestamp: 'desc' },
    });

    const csvLines = logs.map(
      (l) =>
        `${l.id},${l.timestamp.toISOString()},${l.actor},${l.action},${l.resource},${l.severity},${l.category},${l.hash || ''}`,
    );
    const csvContent = [
      'id,timestamp,actor,action,resource,severity,category,hash',
      ...csvLines,
    ].join('\n');

    res.header('Content-Type', 'text/csv');
    res.attachment(`audit_logs_${workspaceId}.csv`);
    return res.send(csvContent);
  }

  @Post('service-accounts')
  @UseGuards(PermissionsGuard)
  @RequirePermissions('service-accounts:manage')
  async createServiceAccount(@Body() body: any) {
    return this.prisma.serviceAccount.create({
      data: {
        workspaceId: body.workspaceId,
        name: body.name,
        description: body.description,
        roleId: body.roleId,
        createdBy: body.userId,
      },
    });
  }

  @Post('api-keys')
  @UseGuards(PermissionsGuard)
  @RequirePermissions('service-accounts:manage')
  async createApiKey(@Body() body: any) {
    return this.apiKeyService.createApiKey(
      body.serviceAccountId,
      body.scopes,
      body.userId,
    );
  }

  @Post('roles')
  @UseGuards(PermissionsGuard)
  @RequirePermissions('roles:manage')
  async createRole(@Body() body: any) {
    return this.prisma.role.create({
      data: {
        workspaceId: body.workspaceId,
        name: body.name,
        description: body.description,
      },
    });
  }
}
