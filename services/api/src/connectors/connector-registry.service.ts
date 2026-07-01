import { Injectable, NotFoundException } from '@nestjs/common';
import { IConnector } from './connector.interface';

@Injectable()
export class ConnectorRegistryService {
  private registry = new Map<string, IConnector>();

  register(connector: IConnector) {
    const id = connector.manifest.id;
    if (this.registry.has(id)) {
      throw new Error(`Connector with ID ${id} is already registered.`);
    }
    this.registry.set(id, connector);
  }

  getConnector(id: string): IConnector {
    const connector = this.registry.get(id);
    if (!connector) {
      throw new NotFoundException(`Connector ${id} not found.`);
    }
    return connector;
  }

  getAllManifests() {
    return Array.from(this.registry.values()).map((c) => c.manifest);
  }
}
