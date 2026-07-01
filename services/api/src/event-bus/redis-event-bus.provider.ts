import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import {
  EventBusProvider,
  AgentEvent,
  EventPayload,
} from './event-bus.provider';
import Redis from 'ioredis';

@Injectable()
export class RedisEventBusProvider
  implements EventBusProvider, OnModuleInit, OnModuleDestroy
{
  private pubClient: Redis;
  private subClient: Redis;
  private handlers = new Map<
    AgentEvent,
    Array<(payload: EventPayload) => void>
  >();

  onModuleInit() {
    this.pubClient = new Redis({ host: 'localhost', port: 6379 });
    this.subClient = new Redis({ host: 'localhost', port: 6379 });

    this.subClient.on('message', (channel, message) => {
      const event = channel as AgentEvent;
      const parsed = JSON.parse(message) as EventPayload;
      const eventHandlers = this.handlers.get(event) || [];
      for (const handler of eventHandlers) {
        handler(parsed);
      }
    });
  }

  onModuleDestroy() {
    this.pubClient.disconnect();
    this.subClient.disconnect();
  }

  async publish(event: AgentEvent, payload: EventPayload): Promise<void> {
    await this.pubClient.publish(event, JSON.stringify(payload));
  }

  async subscribe(
    event: AgentEvent,
    handler: (payload: EventPayload) => void,
  ): Promise<void> {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, []);
      await this.subClient.subscribe(event);
    }
    this.handlers.get(event)?.push(handler);
  }

  async unsubscribe(event: AgentEvent): Promise<void> {
    this.handlers.delete(event);
    await this.subClient.unsubscribe(event);
  }
}
