import {
  Injectable,
  Inject,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from './audit.service';
import type { IKmsProvider } from '../auth/kms/kms.provider.interface';
import * as crypto from 'crypto';
import { SecretMetadataDto } from './dto/secret.dto';

@Injectable()
export class SecretService {
  private readonly algorithm = 'aes-256-gcm';

  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
    @Inject('KMSProvider') private kmsProvider: IKmsProvider,
  ) {}

  async setSecret(
    workspaceId: string,
    name: string,
    value: string,
    description?: string,
  ) {
    const existing = await this.prisma.secret.findUnique({
      where: { workspaceId_name: { workspaceId, name } },
    });

    if (existing) {
      await this.auditService.logAction(
        'SYSTEM',
        'SECRET_ACCESS_DENIED',
        `secret:${name}`,
        workspaceId,
        { reason: 'Secret already exists. Use rotate endpoint.' },
      );
      throw new ConflictException(
        `Secret ${name} already exists. Please use the rotation flow.`,
      );
    }

    const { encryptedValue, kmsProviderName } = await this.encryptValue(
      workspaceId,
      name,
      value,
    );

    const secret = await this.prisma.secret.create({
      data: {
        workspaceId,
        name,
        encryptedValue,
        description,
        version: 1,
        kmsProvider: kmsProviderName,
      },
    });

    await this.auditService.logAction(
      'SYSTEM',
      'SECRET_CREATED',
      `secret:${name}`,
      workspaceId,
    );

    return secret;
  }

  async rotateSecret(workspaceId: string, name: string, newValue: string) {
    const existing = await this.prisma.secret.findUnique({
      where: { workspaceId_name: { workspaceId, name } },
    });

    if (!existing) {
      throw new NotFoundException(`Secret ${name} not found.`);
    }

    const { encryptedValue, kmsProviderName } = await this.encryptValue(
      workspaceId,
      name,
      newValue,
    );

    const secret = await this.prisma.secret.update({
      where: { workspaceId_name: { workspaceId, name } },
      data: {
        encryptedValue,
        version: { increment: 1 },
        lastRotatedAt: new Date(),
        kmsProvider: kmsProviderName,
      },
    });

    await this.auditService.logAction(
      'SYSTEM',
      'SECRET_ROTATED',
      `secret:${name}`,
      workspaceId,
      { previousVersion: existing.version, newVersion: secret.version },
    );

    return secret;
  }

  async deleteSecret(workspaceId: string, name: string) {
    const existing = await this.prisma.secret.findUnique({
      where: { workspaceId_name: { workspaceId, name } },
    });

    if (!existing) {
      throw new NotFoundException(`Secret ${name} not found.`);
    }

    await this.prisma.secret.delete({
      where: { workspaceId_name: { workspaceId, name } },
    });

    await this.auditService.logAction(
      'SYSTEM',
      'SECRET_DELETED',
      `secret:${name}`,
      workspaceId,
    );

    return { success: true };
  }

  async listSecretsMetadata(workspaceId: string): Promise<SecretMetadataDto[]> {
    const secrets = await this.prisma.secret.findMany({
      where: { workspaceId },
      select: {
        name: true,
        createdAt: true,
        lastRotatedAt: true,
        description: true,
        // Mocking inUseByConnectors as 0 for now until connector service is fully integrated
      },
    });

    return secrets.map((s) => ({
      ...s,
      description: s.description || undefined,
      inUseByConnectors: 0,
    }));
  }

  private async encryptValue(workspaceId: string, name: string, value: string) {
    const dek = crypto.randomBytes(32);
    const iv = crypto.randomBytes(16);

    const cipher = crypto.createCipheriv(this.algorithm, dek, iv);
    let encryptedSecret = cipher.update(value, 'utf8', 'hex');
    encryptedSecret += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');

    const encryptedDek = await this.kmsProvider.encrypt(dek.toString('hex'), {
      workspaceId,
      name,
    });
    const encryptedValue = `${encryptedDek}:${iv.toString('hex')}:${authTag}:${encryptedSecret}`;
    const kmsProviderName = this.kmsProvider.getProviderName();

    return { encryptedValue, kmsProviderName };
  }

  async getSecret(workspaceId: string, name: string): Promise<string | null> {
    const secret = await this.prisma.secret.findUnique({
      where: { workspaceId_name: { workspaceId, name } },
    });

    if (!secret) {
      await this.auditService.logAction(
        'SYSTEM',
        'SECRET_ACCESS_DENIED',
        `secret:${name}`,
        workspaceId,
        { reason: 'Secret not found during execution' },
      );
      return null;
    }

    // Explicitly audit runtime injection. This MUST ONLY happen server-side!
    await this.auditService.logAction(
      'SYSTEM',
      'SECRET_RUNTIME_INJECTED',
      `secret:${name}`,
      workspaceId,
    );

    const parts = secret.encryptedValue.split(':');

    if (parts.length === 4) {
      const [encryptedDek, ivHex, authTagHex, encryptedText] = parts;

      const dekHex = await this.kmsProvider.decrypt(encryptedDek, {
        workspaceId,
        name,
      });
      const dek = Buffer.from(dekHex, 'hex');

      const iv = Buffer.from(ivHex, 'hex');
      const authTag = Buffer.from(authTagHex, 'hex');

      const decipher = crypto.createDecipheriv(this.algorithm, dek, iv);
      decipher.setAuthTag(authTag);

      let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } else if (parts.length === 3) {
      const [ivHex, authTagHex, encryptedText] = parts;

      const secretKey =
        process.env.ENCRYPTION_KEY || '12345678901234567890123456789012';
      const legacyKey = crypto.scryptSync(secretKey, 'salt', 32);

      const iv = Buffer.from(ivHex, 'hex');
      const authTag = Buffer.from(authTagHex, 'hex');

      const decipher = crypto.createDecipheriv(this.algorithm, legacyKey, iv);
      decipher.setAuthTag(authTag);

      let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    }

    throw new Error('Unrecognized secret format');
  }
}
