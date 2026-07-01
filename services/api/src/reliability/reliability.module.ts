import { Module, Global } from '@nestjs/common';
import { CircuitBreakerService } from './circuit-breaker.service';
import { IdempotencyService } from './idempotency.service';
import { PrismaModule } from '../prisma/prisma.module';

@Global()
@Module({
  imports: [PrismaModule],
  providers: [CircuitBreakerService, IdempotencyService],
  exports: [CircuitBreakerService, IdempotencyService],
})
export class ReliabilityModule {}
