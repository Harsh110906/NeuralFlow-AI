import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConnectorRegistryService } from './connector-registry.service';

@Injectable()
export class ConnectorExecutorService {
  private readonly logger = new Logger(ConnectorExecutorService.name);

  constructor(
    private readonly connectorRegistry: ConnectorRegistryService,
    // private readonly secretService: SecretService // Will be injected when SecretService is available
  ) {}

  async executeAction(
    workspaceId: string,
    connectorId: string,
    action: string,
    payload: any,
  ): Promise<any> {
    this.logger.log(
      `Executing connector action. Workspace: ${workspaceId}, Connector: ${connectorId}, Action: ${action}`,
    );

    const connector = this.connectorRegistry.getConnector(connectorId);
    if (!connector) {
      throw new NotFoundException(
        `Connector ${connectorId} not found in registry`,
      );
    }

    // Check if connector requires secrets
    if (connector.manifest.secrets && connector.manifest.secrets.length > 0) {
      // In a real implementation, we would fetch the secrets for this workspace
      // const credentials = await this.secretService.getCredentials(workspaceId, connectorId);
      // await connector.authenticate(credentials);
      this.logger.debug(
        `Mocking authentication for ${connectorId} (requires ${connector.manifest.secrets.join(', ')})`,
      );
      await connector.authenticate(); // Using default mock authentication
    }

    // Execute the action
    const startTime = Date.now();
    try {
      const result = await connector.execute(action, payload);
      const executionTime = Date.now() - startTime;
      this.logger.log(
        `Connector action completed successfully in ${executionTime}ms`,
      );
      return { success: true, result, executionTime };
    } catch (error: any) {
      const executionTime = Date.now() - startTime;
      this.logger.error(
        `Connector action failed after ${executionTime}ms: ${error.message}`,
      );
      throw error;
    }
  }
}
