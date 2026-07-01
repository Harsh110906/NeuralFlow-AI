import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SecurityScanService {
  private readonly logger = new Logger(SecurityScanService.name);

  constructor(private prisma: PrismaService) {}

  async scanTemplate(templateId: string, versionId: string) {
    const template = await this.prisma.template.findUnique({
      where: { id: templateId },
    });

    const version = await this.prisma.templateVersion.findUnique({
      where: { id: versionId },
    });

    if (!template || !version) throw new Error('Template or version not found');

    // Create pending scan
    const scan = await this.prisma.templateSecurityScan.create({
      data: {
        templateId,
        status: 'PENDING',
        severity: 'LOW',
      },
    });

    // Simulate scanning logic
    const findings: string[] = [];
    let severity = 'LOW';
    let status = 'PASSED';

    const dag = version.dagJson as any;
    // Example scan logic
    if (dag && dag.nodes) {
      for (const node of dag.nodes) {
        if (
          node.data?.type === 'custom_api_call' &&
          !node.data?.url?.startsWith('https://')
        ) {
          findings.push(`Node ${node.id} uses insecure HTTP endpoint`);
          severity = 'HIGH';
          status = 'FAILED';
        }
        // Detect hardcoded secrets
        const prompt = JSON.stringify(node.data || {});
        if (prompt.includes('sk-') || prompt.includes('xoxb-')) {
          findings.push(`Node ${node.id} contains hardcoded API key`);
          severity = 'CRITICAL';
          status = 'FAILED';
        }
      }
    }

    // Generate Permissions Manifest
    const manifest = this.generatePermissionsManifest(version);

    await this.prisma.$transaction(async (tx) => {
      // 1. Update Scan Result
      await tx.templateSecurityScan.update({
        where: { id: scan.id },
        data: {
          status,
          severity,
          findings,
        },
      });

      // 2. Generate Manifest
      await tx.templatePermissionsManifest.upsert({
        where: { templateId },
        create: {
          templateId,
          permissions: manifest as any,
        },
        update: {
          permissions: manifest as any,
        },
      });

      // 3. Update Template Badges and Status
      if (status === 'PASSED') {
        const badges = Array.from(
          new Set([...(template.badges || []), 'VERIFIED_SECURE']),
        );
        await tx.template.update({
          where: { id: templateId },
          data: {
            badges,
            status: 'PUBLISHED',
          },
        });
      }
    });

    return { status, severity, findings };
  }

  private generatePermissionsManifest(version: any) {
    // Extract exact permissions required
    return {
      connectors: version.requiredConnectors || [],
      secrets: version.requiredSecrets || [],
      actions: [], // E.g., 'send_email'
      externalDomains: [],
    };
  }
}
