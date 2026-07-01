import { Injectable } from '@nestjs/common';
import { IKmsProvider } from './kms.provider.interface';
import * as crypto from 'crypto';

@Injectable()
export class LocalDevelopmentKMSProvider implements IKmsProvider {
  // In a real environment, this would be an env var
  private readonly MASTER_KEY = Buffer.from('12345678901234567890123456789012');

  async encrypt(plaintext: string): Promise<string> {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-gcm', this.MASTER_KEY, iv);

    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');

    return `${iv.toString('hex')}:${authTag}:${encrypted}`;
  }

  async decrypt(ciphertext: string): Promise<string> {
    const parts = ciphertext.split(':');
    if (parts.length !== 3) throw new Error('Invalid ciphertext format');

    const [ivHex, authTagHex, encryptedHex] = parts;
    const decipher = crypto.createDecipheriv(
      'aes-256-gcm',
      this.MASTER_KEY,
      Buffer.from(ivHex, 'hex'),
    );
    decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));

    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  getProviderName(): string {
    return 'LOCAL';
  }
}
