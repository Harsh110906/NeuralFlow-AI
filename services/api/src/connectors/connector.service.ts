import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConnectorSecretService } from './secret.service';

export class CreateConnectorDto {
  name: string;
  description?: string;
  authType: string;
  manifest: any; // Using 'any' for now, should be validated against a schema
}

@Injectable()
export class ConnectorService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly secretService: ConnectorSecretService,
  ) {}

  async listConnectors(workspaceId: string) {
    const connectors = await this.prisma.customConnector.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'desc' },
    });
    return connectors;
  }

  async getConnector(workspaceId: string, id: string) {
    const connector = await this.prisma.customConnector.findUnique({
      where: { id },
    });

    if (!connector || connector.workspaceId !== workspaceId) {
      throw new NotFoundException('Connector not found');
    }

    return connector;
  }

  async createConnector(workspaceId: string, data: CreateConnectorDto) {
    return this.prisma.customConnector.create({
      data: {
        workspaceId,
        name: data.name,
        description: data.description,
        authType: data.authType,
        manifest: data.manifest,
        status: 'DRAFT',
        version: 1,
      },
    });
  }

  async updateConnector(
    workspaceId: string,
    id: string,
    data: Partial<CreateConnectorDto>,
  ) {
    const connector = await this.getConnector(workspaceId, id);

    if (connector.status === 'PUBLISHED') {
      throw new BadRequestException(
        'Cannot modify a published connector. Create a new version instead.',
      );
    }

    return this.prisma.customConnector.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        authType: data.authType,
        manifest: data.manifest,
      },
    });
  }

  async publishConnector(workspaceId: string, id: string) {
    const connector = await this.getConnector(workspaceId, id);

    if (connector.status === 'PUBLISHED') {
      return connector; // Already published
    }

    // Here we might validate the manifest against strict rules before allowing publish.

    return this.prisma.customConnector.update({
      where: { id },
      data: {
        status: 'PUBLISHED',
        version: { increment: 1 },
      },
    });
  }

  async setSecret(
    workspaceId: string,
    connectorId: string,
    keyName: string,
    value: string,
  ) {
    // Ensure the connector exists and belongs to workspace
    await this.getConnector(workspaceId, connectorId);

    return this.secretService.storeSecret(
      workspaceId,
      connectorId,
      keyName,
      value,
    );
  }
}
