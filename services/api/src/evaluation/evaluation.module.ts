import { Module, forwardRef } from '@nestjs/common';
import { AgentVersioningService } from './agent-versioning.service';
import { AssertionEngine } from './assertion.engine';
import { EvaluationDatasetService } from './evaluation-dataset.service';
import { EvaluationDatasetController } from './evaluation-dataset.controller';
import { EvaluationRunController } from './evaluation-run.controller';
import { EvaluationRunService } from './evaluation-run.service';
import { AgentRouterService } from './agent-router.service';
import { JudgeRubricLibrary } from './judge-rubric.library';
import { LLMJudgeProvider } from './llm-judge.provider';
import { PrismaModule } from '../prisma/prisma.module';
import { ExecutionModule } from '../execution/execution.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, forwardRef(() => ExecutionModule), AuthModule],
  controllers: [EvaluationDatasetController, EvaluationRunController],
  providers: [
    AgentVersioningService,
    AssertionEngine,
    EvaluationDatasetService,
    EvaluationRunService,
    AgentRouterService,
    JudgeRubricLibrary,
    LLMJudgeProvider,
  ],
  exports: [
    AgentVersioningService,
    AssertionEngine,
    EvaluationDatasetService,
    EvaluationRunService,
    AgentRouterService,
    JudgeRubricLibrary,
    LLMJudgeProvider,
  ],
})
export class EvaluationModule {}
