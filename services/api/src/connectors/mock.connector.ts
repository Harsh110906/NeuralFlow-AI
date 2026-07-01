import { Injectable, Logger } from '@nestjs/common';
import { BaseConnector } from './connector.interface';

@Injectable()
export class MockConnector extends BaseConnector {
  private readonly logger = new Logger(MockConnector.name);

  constructor() {
    super({
      id: 'mock-connector',
      name: 'Mock Generic Connector',
      permissions: ['MOCK_READ', 'MOCK_WRITE'],
      secrets: ['MOCK_API_KEY'],
      supportedActions: ['echo', 'generate-data', 'fail'],
      riskLevel: 'SAFE',
    });
  }

  async execute(action: string, payload: any): Promise<unknown> {
    this.logger.log(
      `Executing MockConnector action [${action}] with payload:`,
      payload,
    );

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    switch (action) {
      case 'echo':
        return { action, payload, timestamp: new Date().toISOString() };
      case 'generate-data':
        return {
          action,
          data: [
            { id: 1, name: 'Sample Item A' },
            { id: 2, name: 'Sample Item B' },
          ],
        };
      case 'fail':
        throw new Error('MockConnector simulated failure');
      default:
        throw new Error(`Unsupported action: ${action}`);
    }
  }
}
