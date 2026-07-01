import { Module, Global } from '@nestjs/common';
import { RedisEventBusProvider } from './redis-event-bus.provider';

@Global()
@Module({
  providers: [
    {
      provide: 'EventBusProvider',
      useClass: RedisEventBusProvider,
    },
  ],
  exports: ['EventBusProvider'],
})
export class EventBusModule {}
