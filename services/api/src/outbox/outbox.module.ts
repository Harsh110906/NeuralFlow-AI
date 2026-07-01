import { Module, Global } from '@nestjs/common';
import { OutboxService } from './outbox.service';
import { PrismaModule } from '../prisma/prisma.module';

@Global()
@Module({
  imports: [PrismaModule],
  providers: [OutboxService],
  exports: [OutboxService],
})
export class OutboxModule {}
