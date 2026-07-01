import { Injectable, Inject } from '@nestjs/common';
import type { EventBusProvider } from '../../event-bus/event-bus.provider';

@Injectable()
export class TeamNodeExecutor {
  constructor(@Inject('EventBusProvider') private eventBus: EventBusProvider) {}

  async execute(node: any, context: any): Promise<any> {
    const teamType = node.data?.teamType || 'SEQUENTIAL';

    // Broadcast TASK_ASSIGNED to the event bus
    await this.eventBus.publish('TASK_ASSIGNED', {
      executionId: context.executionId,
      nodeId: node.id,
      data: { teamType, context },
      timestamp: new Date().toISOString(),
    });

    if (teamType === 'SEQUENTIAL') {
      return this.executeSequentialTeam(node, context);
    } else if (teamType === 'HIERARCHICAL') {
      return this.executeHierarchicalTeam(node, context);
    } else if (teamType === 'SWARM') {
      return this.executeSwarmTeam(node, context);
    }

    throw new Error(`Unknown team type: ${teamType}`);
  }

  private async executeSequentialTeam(node: any, context: any) {
    // Simulated sequential execution
    console.log(`Executing Sequential Team for node ${node.id}`);
    const agents = node.data?.agents || [];
    let state = context.initialState || {};

    for (const agent of agents) {
      await this.eventBus.publish('AGENT_STARTED', {
        executionId: context.executionId,
        agentId: agent,
        data: { state },
        timestamp: new Date().toISOString(),
      });
      // Simulate agent work
      state = { ...state, [agent]: 'completed' };
      await this.eventBus.publish('AGENT_COMPLETED', {
        executionId: context.executionId,
        agentId: agent,
        data: { state },
        timestamp: new Date().toISOString(),
      });
    }

    return { status: 'success', output: state };
  }

  private async executeHierarchicalTeam(node: any, context: any) {
    console.log(`Executing Hierarchical Team for node ${node.id}`);
    const supervisor = node.data?.supervisor;

    await this.eventBus.publish('AGENT_STARTED', {
      executionId: context.executionId,
      agentId: supervisor,
      data: { role: 'supervisor' },
      timestamp: new Date().toISOString(),
    });

    // Simulate Supervisor assigning work to workers
    const workers = node.data?.workers || [];
    await Promise.all(
      workers.map(async (worker: string) => {
        await this.eventBus.publish('AGENT_STARTED', {
          executionId: context.executionId,
          agentId: worker,
          data: { role: 'worker' },
          timestamp: new Date().toISOString(),
        });
        await this.eventBus.publish('AGENT_COMPLETED', {
          executionId: context.executionId,
          agentId: worker,
          data: { status: 'done' },
          timestamp: new Date().toISOString(),
        });
      }),
    );

    await this.eventBus.publish('SUPERVISOR_REVIEW_REQUESTED', {
      executionId: context.executionId,
      nodeId: node.id,
      data: {},
      timestamp: new Date().toISOString(),
    });
    await this.eventBus.publish('SUPERVISOR_APPROVED', {
      executionId: context.executionId,
      nodeId: node.id,
      data: {},
      timestamp: new Date().toISOString(),
    });

    return { status: 'success', output: 'Hierarchical Team Completed' };
  }

  private async executeSwarmTeam(node: any, context: any) {
    console.log(`Executing Swarm Team for node ${node.id}`);
    const swarmAgents = node.data?.agents || [];

    // Parallel consensus
    await Promise.all(
      swarmAgents.map(async (agent: string) => {
        await this.eventBus.publish('AGENT_STARTED', {
          executionId: context.executionId,
          agentId: agent,
          data: { role: 'swarm-node' },
          timestamp: new Date().toISOString(),
        });
        await this.eventBus.publish('MESSAGE_PUBLISHED', {
          executionId: context.executionId,
          agentId: agent,
          data: { message: 'My proposed solution...' },
          timestamp: new Date().toISOString(),
        });
      }),
    );

    return { status: 'success', output: 'Swarm Consensus Reached' };
  }
}
