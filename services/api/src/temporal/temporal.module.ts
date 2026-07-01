import { Module, Global } from '@nestjs/common';
import { Client, Connection } from '@temporalio/client';

@Global()
@Module({
  providers: [
    {
      provide: 'TEMPORAL_CLIENT',
      useFactory: async () => {
        const connection = await Connection.connect({
          address: 'localhost:7233',
        });
        return new Client({ connection });
      },
    },
  ],
  exports: ['TEMPORAL_CLIENT'],
})
export class TemporalModule {}
