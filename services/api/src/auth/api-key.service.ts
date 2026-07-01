import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as crypto from 'crypto';

@Injectable()
export class ApiKeyService {
  constructor(private prisma: PrismaService) {}

  async createApiKey(
    serviceAccountId: string,
    scopes: string[],
    createdBy: string,
  ) {
    const rawKey = crypto.randomBytes(32).toString('hex');
    const prefix = `nf_live_${rawKey.substring(0, 8)}`;
    const fullKey = `${prefix}_${rawKey}`;

    const keyHash = this.hashKey(fullKey);

    const apiKey = await this.prisma.apiKey.create({
      data: {
        serviceAccountId,
        keyHash,
        prefix,
        createdBy,
        scopes: {
          create: scopes.map((scope) => ({ scope })),
        },
      },
    });

    // We only ever return the plaintext key once, immediately after creation.
    return { apiKey: fullKey, id: apiKey.id };
  }

  async rotateApiKey(apiKeyId: string, createdBy: string) {
    const existingKey = await this.prisma.apiKey.findUnique({
      where: { id: apiKeyId },
    });
    if (!existingKey) throw new BadRequestException('API Key not found');

    // Revoke old key
    await this.prisma.apiKey.update({
      where: { id: apiKeyId },
      data: {
        revokedAt: new Date(),
        lastRotatedAt: new Date(),
        revokedReason: 'ROTATED',
      },
    });

    const scopes = await this.prisma.apiKeyScope.findMany({
      where: { apiKeyId },
    });

    // Create new key
    return this.createApiKey(
      existingKey.serviceAccountId,
      scopes.map((s) => s.scope),
      createdBy,
    );
  }

  async revokeApiKey(apiKeyId: string, reason: string) {
    return this.prisma.apiKey.update({
      where: { id: apiKeyId },
      data: {
        revokedAt: new Date(),
        revokedReason: reason,
      },
    });
  }

  async validateApiKey(key: string) {
    const keyHash = this.hashKey(key);
    const apiKey = await this.prisma.apiKey.findUnique({
      where: { keyHash },
      include: { serviceAccount: true, scopes: true },
    });

    if (!apiKey) return null;
    if (apiKey.revokedAt) return null;
    if (apiKey.expiresAt && apiKey.expiresAt < new Date()) return null;
    if (apiKey.serviceAccount.disabledAt) return null;

    // Update lastUsedAt asynchronously
    this.prisma.apiKey
      .update({
        where: { id: apiKey.id },
        data: { lastUsedAt: new Date() },
      })
      .catch(() => {});

    return apiKey;
  }

  hashKey(key: string): string {
    return crypto.createHash('sha256').update(key).digest('hex');
  }
}
