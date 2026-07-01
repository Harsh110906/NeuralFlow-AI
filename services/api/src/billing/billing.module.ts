import { Module } from '@nestjs/common';
import { BillingLedgerService } from './billing-ledger.service';
import { BillingPipelineService } from './billing.pipeline.service';
import { CostGuardService } from './cost-guard.service';
import { PrismaModule } from '../prisma/prisma.module';

import { BillingService } from './billing.service';
import { BillingController } from './billing.controller';

@Module({
  imports: [PrismaModule],
  controllers: [BillingController],
  providers: [
    BillingLedgerService,
    BillingPipelineService,
    CostGuardService,
    BillingService,
  ],
  exports: [
    BillingLedgerService,
    BillingPipelineService,
    CostGuardService,
    BillingService,
  ],
})
export class BillingModule {}
