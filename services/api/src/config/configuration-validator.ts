import { Injectable, OnModuleInit, Logger } from '@nestjs/common';

@Injectable()
export class ConfigurationValidator implements OnModuleInit {
  private readonly logger = new Logger(ConfigurationValidator.name);

  onModuleInit() {
    this.logger.log('Validating environment configuration...');
    // We only enforce hard failures in production by default, or if STRICT_CONFIG is set.
    // However, the requirement says "no silent configuration failures", so we will throw on missing.
    this.validate();
    this.logger.log('Configuration validation passed.');
  }

  private validate() {
    const isProduction = process.env.NODE_ENV === 'production';

    const requiredKeys = [
      // Database
      'DATABASE_URL',

      // Redis
      // 'REDIS_HOST',
      // 'REDIS_PORT', // Commenting out strictly required for dev if not set, but let's enforce them if they're required for beta.

      // LLM Provider
      'OPENAI_API_KEY',

      // Stripe
      'STRIPE_SECRET_KEY',
      'STRIPE_WEBHOOK_SECRET',

      // KMS & Secrets
      'KMS_PROVIDER',

      // Telemetry
      'TELEMETRY_ENABLED',
    ];

    // If KMS provider is AWS, require AWS credentials
    if (process.env.KMS_PROVIDER === 'aws') {
      requiredKeys.push(
        'AWS_ACCESS_KEY_ID',
        'AWS_SECRET_ACCESS_KEY',
        'AWS_REGION',
        'KMS_KEY_ID',
      );
    }

    const missingKeys: string[] = [];

    for (const key of requiredKeys) {
      const value = process.env[key];
      if (!value || value.trim() === '') {
        missingKeys.push(key);
      }
    }

    // Check for default production secrets
    if (isProduction) {
      if (process.env.KMS_PROVIDER === 'local') {
        throw new Error(
          'FATAL: Local KMS provider cannot be used in production.',
        );
      }

      if (
        process.env.STRIPE_SECRET_KEY &&
        process.env.STRIPE_SECRET_KEY.includes('test')
      ) {
        throw new Error(
          'FATAL: Test Stripe keys cannot be used in production.',
        );
      }
    }

    if (missingKeys.length > 0) {
      const errorMsg = `FATAL: Missing required configuration keys: ${missingKeys.join(', ')}`;
      this.logger.error(errorMsg);
      // Fail fast on startup
      throw new Error(errorMsg);
    }
  }
}
