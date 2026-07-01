import { Module } from '@nestjs/common';
import { LocalDevelopmentKMSProvider } from './local-development.kms.provider';
import { AWSKMSProvider } from './aws.kms.provider';

@Module({
  providers: [
    LocalDevelopmentKMSProvider,
    AWSKMSProvider,
    {
      provide: 'KMSProvider',
      useFactory: (local, aws) => {
        // Select provider based on environment variables
        const providerName = process.env.KMS_PROVIDER || 'LOCAL';
        if (providerName === 'AWS') return aws;
        return local;
      },
      inject: [LocalDevelopmentKMSProvider, AWSKMSProvider],
    },
  ],
  exports: ['KMSProvider'],
})
export class KmsModule {}
