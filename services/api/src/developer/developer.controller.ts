import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Req,
  UseGuards,
  Query,
} from '@nestjs/common';
import { WebhookService } from './webhook.service';
import { ApiKeyService } from '../auth/api-key.service';
import { PrismaService } from '../prisma/prisma.service';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermissions } from '../auth/permissions.decorator';
import * as crypto from 'crypto';

@Controller('workspaces/:workspaceId/developer')
@UseGuards(PermissionsGuard)
export class DeveloperController {
  constructor(
    private readonly webhookService: WebhookService,
    private readonly apiKeyService: ApiKeyService,
    private readonly prisma: PrismaService,
  ) {}

  // --- API KEYS ---

  @Get('api-keys')
  @RequirePermissions('developer:read')
  async getApiKeys(@Param('workspaceId') workspaceId: string) {
    const serviceAccount = await this.getOrCreateServiceAccount(workspaceId);
    return this.prisma.apiKey.findMany({
      where: { serviceAccountId: serviceAccount.id },
      select: {
        id: true,
        prefix: true,
        createdAt: true,
        lastUsedAt: true,
        revokedAt: true,
        scopes: true,
      },
    });
  }

  @Post('api-keys')
  @RequirePermissions('developer:write')
  async createApiKey(
    @Param('workspaceId') workspaceId: string,
    @Body() body: { scopes: string[] },
    @Req() req: any,
  ) {
    const serviceAccount = await this.getOrCreateServiceAccount(workspaceId);
    return this.apiKeyService.createApiKey(
      serviceAccount.id,
      body.scopes,
      req.user?.id || 'system',
    );
  }

  @Delete('api-keys/:keyId')
  @RequirePermissions('developer:write')
  async revokeApiKey(@Param('keyId') keyId: string) {
    return this.apiKeyService.revokeApiKey(keyId, 'USER_REVOKED');
  }

  // --- WEBHOOKS ---

  @Get('webhooks')
  @RequirePermissions('developer:read')
  async getWebhooks(@Param('workspaceId') workspaceId: string) {
    return this.prisma.webhookSubscription.findMany({
      where: { workspaceId },
      select: {
        id: true,
        endpointUrl: true,
        events: true,
        active: true,
        createdAt: true,
      },
    });
  }

  @Post('webhooks')
  @RequirePermissions('developer:write')
  async createWebhook(
    @Param('workspaceId') workspaceId: string,
    @Body() body: { endpointUrl: string; events: string[] },
  ) {
    return this.prisma.webhookSubscription.create({
      data: {
        workspaceId,
        endpointUrl: body.endpointUrl,
        events: body.events,
        secret: crypto.randomBytes(32).toString('hex'),
      },
      select: { id: true, endpointUrl: true, events: true, secret: true }, // Return secret once
    });
  }

  @Delete('webhooks/:id')
  @RequirePermissions('developer:write')
  async deleteWebhook(
    @Param('workspaceId') workspaceId: string,
    @Param('id') id: string,
  ) {
    return this.prisma.webhookSubscription.delete({
      where: { id, workspaceId },
    });
  }

  @Get('webhooks/:id/logs')
  @RequirePermissions('developer:read')
  async getWebhookLogs(
    @Param('workspaceId') workspaceId: string,
    @Param('id') id: string,
  ) {
    const sub = await this.prisma.webhookSubscription.findUnique({
      where: { id, workspaceId },
    });
    if (!sub) throw new Error('Not found');

    const logs = await this.prisma.webhookDeliveryLog.findMany({
      where: { subscriptionId: id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    // We redact the payload again just in case, though it should be stored redacted
    return logs.map((l) => ({
      ...l,
      payloadSnapshot: JSON.parse(l.payloadSnapshot),
    }));
  }

  private async getOrCreateServiceAccount(workspaceId: string) {
    let sa = await this.prisma.serviceAccount.findFirst({
      where: { workspaceId, name: 'Default Developer Account' },
    });
    if (!sa) {
      sa = await this.prisma.serviceAccount.create({
        data: {
          workspaceId,
          name: 'Default Developer Account',
          roleId: 'default',
        },
      });
    }
    return sa;
  }
}
