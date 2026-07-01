import {
  Injectable,
  RequestTimeoutException,
  ForbiddenException,
} from '@nestjs/common';
import { IConnector } from './connector.interface';

@Injectable()
export class SandboxExecutorService {
  private readonly DEFAULT_TIMEOUT_MS = 10000; // 10 seconds

  async validate(
    connector: IConnector,
    requiredPermissions: string[],
  ): Promise<void> {
    const isSafe = await connector.validate();
    if (!isSafe) {
      throw new ForbiddenException(
        `Connector ${connector.manifest.name} failed internal validation.`,
      );
    }

    const hasPermissions = requiredPermissions.every((p) =>
      connector.manifest.permissions.includes(p),
    );
    if (!hasPermissions) {
      throw new ForbiddenException(
        `Connector lacks required permissions: ${requiredPermissions.join(', ')}`,
      );
    }

    if (connector.manifest.riskLevel === 'HIGH') {
      // Future logic: enforce stricter network allowlists, specific VPCs, etc.
    }
  }

  async execute(
    connector: IConnector,
    action: string,
    payload: unknown,
    timeoutMs = this.DEFAULT_TIMEOUT_MS,
  ): Promise<unknown> {
    // Phase 10: In-memory Sandbox Abstraction
    // In the future, this abstraction will wrap a Firecracker microVM or isolated container execution

    return Promise.race([
      connector.execute(action, payload),
      new Promise((_, reject) =>
        setTimeout(
          () =>
            reject(
              new RequestTimeoutException(
                `Connector execution timed out after ${timeoutMs}ms`,
              ),
            ),
          timeoutMs,
        ),
      ),
    ]);
  }
}
