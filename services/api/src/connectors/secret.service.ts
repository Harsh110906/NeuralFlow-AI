import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as crypto from 'crypto';

@Injectable()
export class ConnectorSecretService {
  private readonly algorithm = 'aes-256-gcm';
  // In a real application, this should be pulled securely from env variables
  // and be exactly 32 bytes long.
  private readonly secretKey =
    process.env.ENCRYPTION_KEY || '12345678901234567890123456789012';

  constructor(private prisma: PrismaService) {}

  encrypt(text: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(
      this.algorithm,
      Buffer.from(this.secretKey),
      iv,
    );
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');
    return `${iv.toString('hex')}:${encrypted}:${authTag}`;
  }

  decrypt(encryptedData: string): string {
    const parts = encryptedData.split(':');
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted data format');
    }
    const iv = Buffer.from(parts[0], 'hex');
    const encryptedText = parts[1];
    const authTag = Buffer.from(parts[2], 'hex');

    const decipher = crypto.createDecipheriv(
      this.algorithm,
      Buffer.from(this.secretKey),
      iv,
    );
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  async storeSecret(
    workspaceId: string,
    connectorId: string,
    keyName: string,
    value: string,
  ) {
    const encryptedValue = this.encrypt(value);

    return this.prisma.connectorSecret.upsert({
      where: {
        workspaceId_connectorId_keyName: {
          workspaceId,
          connectorId,
          keyName,
        },
      },
      update: {
        encryptedValue,
      },
      create: {
        workspaceId,
        connectorId,
        keyName,
        encryptedValue,
      },
    });
  }

  async getSecretValue(
    workspaceId: string,
    connectorId: string,
    keyName: string,
  ): Promise<string> {
    const secret = await this.prisma.connectorSecret.findUnique({
      where: {
        workspaceId_connectorId_keyName: {
          workspaceId,
          connectorId,
          keyName,
        },
      },
    });

    if (!secret) {
      throw new Error(`Secret not found for key ${keyName}`);
    }

    return this.decrypt(secret.encryptedValue);
  }
}
