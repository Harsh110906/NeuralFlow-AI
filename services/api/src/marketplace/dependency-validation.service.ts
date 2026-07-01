import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DependencyValidationService {
  // Mock current system version
  private readonly CURRENT_NEURALFLOW_VERSION = 'v1.0.0';

  constructor(private prisma: PrismaService) {}

  async validateForInstallation(
    workspaceId: string,
    templateVersionId: string,
  ) {
    const version = await this.prisma.templateVersion.findUnique({
      where: { id: templateVersionId },
      include: { template: true },
    });

    if (!version) throw new BadRequestException('Template version not found');

    const issues: string[] = [];
    const missingConnectors: string[] = [];
    const missingSecrets: string[] = [];

    // 1. Version Compatibility
    if (
      version.minNeuralFlowVersion &&
      version.minNeuralFlowVersion > this.CURRENT_NEURALFLOW_VERSION
    ) {
      issues.push(`Requires NeuralFlow >= ${version.minNeuralFlowVersion}`);
    }

    // 2. Connector Validation
    if (version.requiredConnectors && version.requiredConnectors.length > 0) {
      // In a real scenario, query the workspace's configured connectors
      // For MVP, we mock the validation or check if secrets with the connector name exist
      const secrets = await this.prisma.secret.findMany({
        where: { workspaceId },
        select: { name: true },
      });
      const secretNames = secrets.map((s) => s.name);

      for (const connector of version.requiredConnectors) {
        if (!secretNames.includes(connector)) {
          missingConnectors.push(connector);
        }
      }
    }

    // 3. Secrets Validation
    if (version.requiredSecrets && version.requiredSecrets.length > 0) {
      const secrets = await this.prisma.secret.findMany({
        where: { workspaceId },
        select: { name: true },
      });
      const secretNames = secrets.map((s) => s.name);

      for (const reqSecret of version.requiredSecrets) {
        if (!secretNames.includes(reqSecret)) {
          missingSecrets.push(reqSecret);
        }
      }
    }

    const isValid =
      issues.length === 0 &&
      missingConnectors.length === 0 &&
      missingSecrets.length === 0;

    return {
      isValid,
      issues,
      missingConnectors,
      missingSecrets,
      riskLevel: version.template.riskLevel,
    };
  }
}
