import { Injectable } from '@nestjs/common';
import { ToolProvider } from '../interfaces/tool.provider';

@Injectable()
export class MockToolProvider implements ToolProvider {
  async execute(toolId: string, parameters: any): Promise<any> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          status: 'success',
          toolId,
          simulatedOutput: `Mock execution of ${toolId} completed`,
          parametersReceived: parameters,
        });
      }, 500);
    });
  }
}
