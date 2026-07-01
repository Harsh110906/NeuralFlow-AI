import { Injectable } from '@nestjs/common';
import { IKmsProvider } from './kms.provider.interface';

@Injectable()
export class AWSKMSProvider implements IKmsProvider {
  // private client = new KMSClient({ region: process.env.AWS_REGION });
  private keyId = process.env.AWS_KMS_KEY_ID || 'alias/neuralflow-secrets';

  async encrypt(
    plaintext: string,
    context?: Record<string, string>,
  ): Promise<string> {
    // Stub implementation for Phase 10 MVP
    console.warn(
      '[AWSKMSProvider] Encrypt stub called. Install @aws-sdk/client-kms for prod.',
    );
    return `aws-kms-stub-encrypted-${plaintext}`;
  }

  async decrypt(
    ciphertext: string,
    context?: Record<string, string>,
  ): Promise<string> {
    console.warn('[AWSKMSProvider] Decrypt stub called.');
    return ciphertext.replace('aws-kms-stub-encrypted-', '');
  }

  getProviderName(): string {
    return 'AWS';
  }
}
