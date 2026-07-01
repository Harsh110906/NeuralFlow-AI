import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { WorkspaceModule } from '../workspace/workspace.module';
import { ReliabilityModule } from '../reliability/reliability.module';
import { ExecutionController } from './execution.controller';
import { ExecutionService } from './execution.service';
import { ExecutionRunner } from './engine/execution.runner';
import { ExecutionLogger } from './engine/execution.logger';
import { ExecutionStateManager } from './engine/execution.state-manager';
import { TriggerNodeExecutor } from './executors/trigger-node.executor';
import { AgentNodeExecutor } from './executors/agent-node.executor';
import { ToolNodeExecutor } from './executors/tool-node.executor';
import { LogicNodeExecutor } from './executors/logic-node.executor';
import { TeamNodeExecutor } from './executors/team-node.executor';
import { HumanApprovalNodeExecutor } from './executors/human-approval-node.executor';
import { LiteLLMProvider } from './providers/litellm.provider';
import { MockToolProvider } from './providers/mock-tool.provider';
import { ModelRegistryService } from './llm/model-registry.service';
import { ModelRouterService } from './llm/model-router.service';
import { AgentModule } from '../agent/agent.module';
import { TemporalModule } from '../temporal/temporal.module';
import { BillingModule } from '../billing/billing.module';
import { ObservatoryModule } from '../observatory/observatory.module';

@Module({
  imports: [
    forwardRef(() => AgentModule),
    TemporalModule,
    BillingModule,
    forwardRef(() => ObservatoryModule),
    ConfigModule,
    WorkspaceModule,
    ReliabilityModule,
  ],
  controllers: [ExecutionController],
  providers: [
    ExecutionService,
    ExecutionRunner,
    ExecutionLogger,
    ExecutionStateManager,
    TriggerNodeExecutor,
    AgentNodeExecutor,
    ToolNodeExecutor,
    LogicNodeExecutor,
    TeamNodeExecutor,
    HumanApprovalNodeExecutor,
    ModelRegistryService,
    ModelRouterService,
    { provide: 'LLMProvider', useClass: LiteLLMProvider },
    { provide: 'ToolProvider', useClass: MockToolProvider },
  ],
  exports: [ExecutionService, 'LLMProvider', 'ToolProvider'],
})
export class ExecutionModule {}
