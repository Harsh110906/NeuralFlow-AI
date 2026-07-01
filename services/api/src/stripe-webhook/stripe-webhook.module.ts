import { Module } from '@nestjs/common';
import { StripeWebhookController } from './stripe-webhook.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [StripeWebhookController],
})
export class StripeWebhookModule {}
