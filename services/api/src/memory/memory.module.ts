import { Module, forwardRef } from '@nestjs/common';
import { MemoryController } from './memory.controller';
import { MemoryService } from './memory.service';
import { GraphRetrievalService } from './graph-retrieval.service';
import { GraphIngestionService } from './graph-ingestion.service';
import { ExecutionModule } from '../execution/execution.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule, forwardRef(() => ExecutionModule)],
  controllers: [MemoryController],
  providers: [MemoryService, GraphRetrievalService, GraphIngestionService],
  exports: [MemoryService, GraphRetrievalService, GraphIngestionService],
})
export class MemoryModule {}
