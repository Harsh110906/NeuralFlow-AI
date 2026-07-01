import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ConnectorService, CreateConnectorDto } from './connector.service';
import { ConnectorSecretService } from './secret.service';
import { OutboundRequestService } from './outbound-request.service';

@Controller('workspaces/:workspaceId/connectors')
export class ConnectorController {
  constructor(
    private readonly connectorService: ConnectorService,
    private readonly secretService: ConnectorSecretService,
    private readonly outboundService: OutboundRequestService,
  ) {}

  @Get()
  async listConnectors(@Param('workspaceId') workspaceId: string) {
    const connectors = await this.connectorService.listConnectors(workspaceId);
    // Ensure secrets are never exposed
    return connectors;
  }

  @Get(':id')
  async getConnector(
    @Param('workspaceId') workspaceId: string,
    @Param('id') id: string,
  ) {
    return this.connectorService.getConnector(workspaceId, id);
  }

  @Post()
  async createConnector(
    @Param('workspaceId') workspaceId: string,
    @Body() dto: CreateConnectorDto,
  ) {
    return this.connectorService.createConnector(workspaceId, dto);
  }

  @Put(':id')
  async updateConnector(
    @Param('workspaceId') workspaceId: string,
    @Param('id') id: string,
    @Body() dto: Partial<CreateConnectorDto>,
  ) {
    return this.connectorService.updateConnector(workspaceId, id, dto);
  }

  @Post(':id/secrets')
  async setSecret(
    @Param('workspaceId') workspaceId: string,
    @Param('id') id: string,
    @Body() body: { keyName: string; value: string },
  ) {
    await this.connectorService.setSecret(
      workspaceId,
      id,
      body.keyName,
      body.value,
    );
    return { success: true };
  }

  @Post(':id/publish')
  async publishConnector(
    @Param('workspaceId') workspaceId: string,
    @Param('id') id: string,
  ) {
    return this.connectorService.publishConnector(workspaceId, id);
  }

  @Post(':id/sandbox')
  async sandboxTest(
    @Param('workspaceId') workspaceId: string,
    @Param('id') id: string,
    @Body()
    sandboxConfig: { url: string; method: string; body: any; headers: any },
  ) {
    const connector = await this.connectorService.getConnector(workspaceId, id);

    // Inject secrets safely based on authType
    const injectedHeaders = { ...sandboxConfig.headers };

    if (connector.authType === 'API_KEY') {
      // In a real flow, the manifest would tell us the name of the secret and whether it goes in headers or query.
      // For this mock beta, we assume the user set an 'apiKey' secret and we inject it as a Bearer or x-api-key header.
      try {
        const secretVal = await this.secretService.getSecretValue(
          workspaceId,
          id,
          'apiKey',
        );
        injectedHeaders['Authorization'] = `Bearer ${secretVal}`;
      } catch (e) {
        // If no secret found, we proceed without it, let the API fail
      }
    }

    const result = await this.outboundService.executeSafeRequest(
      workspaceId,
      sandboxConfig.url,
      sandboxConfig.method || 'GET',
      injectedHeaders,
      sandboxConfig.body,
      this.secretService,
      id,
    );

    // Simple redaction logic for echoes (if the API echos our exact token back)
    try {
      const secretVal = await this.secretService.getSecretValue(
        workspaceId,
        id,
        'apiKey',
      );
      if (secretVal && secretVal.length > 5) {
        const strResult = JSON.stringify(result);
        if (strResult.includes(secretVal)) {
          return JSON.parse(strResult.split(secretVal).join('***REDACTED***'));
        }
      }
    } catch (e) {}

    return result;
  }
}
