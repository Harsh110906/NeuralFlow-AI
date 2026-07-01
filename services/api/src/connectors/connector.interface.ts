export interface ConnectorManifest {
  id: string;
  name: string;

  permissions: string[];
  secrets: string[];

  supportedActions: string[];
  riskLevel: 'SAFE' | 'MODERATE' | 'HIGH';
}

export interface IConnector {
  manifest: ConnectorManifest;

  authenticate(credentials?: any): Promise<void>;
  execute(action: string, payload: unknown): Promise<unknown>;
  validate(): Promise<boolean>;
}

export abstract class BaseConnector implements IConnector {
  constructor(public readonly manifest: ConnectorManifest) {}

  async authenticate(credentials?: any): Promise<void> {
    // Default no-op for connectors that don't need authentication
  }

  abstract execute(action: string, payload: unknown): Promise<unknown>;

  async validate(): Promise<boolean> {
    // Default always valid
    return true;
  }
}
