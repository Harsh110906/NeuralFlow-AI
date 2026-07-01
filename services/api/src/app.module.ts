import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HealthModule } from './health/health.module';
import { WorkspaceModule } from './workspace/workspace.module';
import { WorkflowModule } from './workflow/workflow.module';
import { AgentModule } from './agent/agent.module';
import { StripeWebhookModule } from './stripe-webhook/stripe-webhook.module';
import { PrismaModule } from './prisma/prisma.module';
import { ExecutionModule } from './execution/execution.module';
import { MemoryModule } from './memory/memory.module';
import { CopilotModule } from './copilot/copilot.module';
import { SimulatorModule } from './simulator/simulator.module';
import { DeveloperModule } from './developer/developer.module';
import { ObservatoryModule } from './observatory/observatory.module';
import { MarketplaceModule } from './marketplace/marketplace.module';
import { EventBusModule } from './event-bus/event-bus.module';
import { AuthModule } from './auth/auth.module';
import { EvaluationModule } from './evaluation/evaluation.module';
import { BillingModule } from './billing/billing.module';
import { FeatureFlagModule } from './feature-flags/feature-flag.module';
import { ConnectorsModule } from './connectors/connectors.module';
import { ReliabilityModule } from './reliability/reliability.module';
import { BullModule } from '@nestjs/bullmq';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AppConfigModule } from './config/config.module';
import { OutboxModule } from './outbox/outbox.module';
import { TemplateModule } from './template/template.module';
import { ApprovalModule } from './approval/approval.module';

@Module({
  imports: [
    EventBusModule,
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 1000, // accommodate legitimate burst traffic
      },
    ]),
    BullModule.forRootAsync({
      useFactory: () => {
        if (process.env.REDIS_URL) {
          const url = new URL(process.env.REDIS_URL);
          return {
            connection: {
              host: url.hostname,
              port: parseInt(url.port, 10),
              password: url.password || undefined,
              username: url.username || undefined,
              tls: url.protocol === 'rediss:' ? {} : undefined,
            },
          };
        }
        return {
          connection: {
            host: 'localhost',
            port: 6379,
          },
        };
      },
    }),
    AppConfigModule,
    OutboxModule,
    HealthModule,
    WorkspaceModule,
    WorkflowModule,
    AgentModule,
    ExecutionModule,
    MemoryModule,
    CopilotModule,
    SimulatorModule,
    ObservatoryModule,
    MarketplaceModule,
    StripeWebhookModule,
    PrismaModule,
    AuthModule,
    EvaluationModule,
    BillingModule,
    FeatureFlagModule,
    ConnectorsModule,
    ReliabilityModule,
    TemplateModule,
    ApprovalModule,
    DeveloperModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
