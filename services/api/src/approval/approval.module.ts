import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { ObservatoryModule } from '../observatory/observatory.module';
import { TemporalModule } from '../temporal/temporal.module';
import { ApprovalService } from './approval.service';
import { ApprovalController } from './approval.controller';

@Module({
  imports: [PrismaModule, ObservatoryModule, TemporalModule, AuthModule],
  providers: [ApprovalService],
  controllers: [ApprovalController],
  exports: [ApprovalService],
})
export class ApprovalModule {}
