import { Module, Global } from '@nestjs/common';
import { Client, Connection } from '@temporalio/client';

@Global()
@Module({
  providers: [
    {
      provide: 'TEMPORAL_CLIENT',
      useFactory: async () => {
        try {
          const connection = await Connection.connect({
            address: process.env.TEMPORAL_ADDRESS || 'localhost:7233',
          });
          return new Client({ connection });
        } catch (e) {
          console.warn(
            '⚠️ Could not connect to Temporal cluster. Workflow execution will be disabled.',
          );
          // Return a mock client so the server doesn't crash on boot
          return {
            workflow: {
              start: async () => {
                throw new Error('Temporal is not connected');
              },
              getHandle: () => ({ signal: async () => {} }),
            },
          };
        }
      },
    },
  ],
  exports: ['TEMPORAL_CLIENT'],
})
export class TemporalModule {}
