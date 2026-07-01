import { Injectable } from '@nestjs/common';
import { SecretService } from '../workspace/secret.service';

export interface DiagnosticIssue {
  severity: 'ERROR' | 'WARNING' | 'INFO';
  nodeId?: string;
  message: string;
  fixHint?: string;
}

@Injectable()
export class WorkflowDoctorService {
  constructor(private readonly secretService: SecretService) {}

  async analyzeWorkflow(
    workspaceId: string,
    dagJson: any,
  ): Promise<DiagnosticIssue[]> {
    const issues: DiagnosticIssue[] = [];

    if (!dagJson || !dagJson.nodes || !Array.isArray(dagJson.nodes)) {
      issues.push({
        severity: 'ERROR',
        message: 'Invalid or missing workflow DAG structure.',
        fixHint: 'Ensure the workflow is properly initialized.',
      });
      return issues;
    }

    const nodes = dagJson.nodes;
    const edges = dagJson.edges || [];

    // Structural Checks
    const hasTrigger = nodes.some((n) => n.type === 'trigger');
    const hasAgent = nodes.some((n) => n.type === 'agent');

    if (!hasTrigger) {
      issues.push({
        severity: 'ERROR',
        message: 'Workflow has no Trigger node.',
        fixHint: 'Add a Trigger node to start the workflow.',
      });
    }

    if (!hasAgent) {
      issues.push({
        severity: 'ERROR',
        message: 'Workflow has no Agent node.',
        fixHint: 'Add at least one Agent node to process information.',
      });
    }

    // Orphaned Node Check (Node without connections that is not a single trigger)
    // If a node is a trigger, it only needs outgoing edges (or it might be an empty workflow, which we caught).
    // If a node is an agent/tool, it should ideally have incoming edges.
    nodes.forEach((node) => {
      if (node.type !== 'trigger') {
        const hasIncoming = edges.some((e) => e.target === node.id);
        if (!hasIncoming) {
          issues.push({
            severity: 'ERROR',
            nodeId: node.id,
            message: `Node "${node.data?.label || node.id}" is unreachable (no incoming connections).`,
            fixHint: 'Connect this node from a previous step in the workflow.',
          });
        }
      }
    });

    // Secret / Auth Checks
    const secretsMeta =
      await this.secretService.listSecretsMetadata(workspaceId);
    const configuredSecretNames = secretsMeta.map((s) => s.name);

    nodes.forEach((node) => {
      // Mock detection of required secrets based on node label/type.
      // In a real system, the Connector registry would define required secrets.
      if (node.data?.label?.toLowerCase().includes('zendesk')) {
        if (!configuredSecretNames.includes('ZENDESK_API_KEY')) {
          issues.push({
            severity: 'ERROR',
            nodeId: node.id,
            message: `Node "${node.data?.label || node.id}" requires missing secret: ZENDESK_API_KEY`,
            fixHint: 'Go to Secret Manager and add ZENDESK_API_KEY.',
          });
        }
      }

      if (node.data?.label?.toLowerCase().includes('pinecone')) {
        if (!configuredSecretNames.includes('PINECONE_API_KEY')) {
          issues.push({
            severity: 'ERROR',
            nodeId: node.id,
            message: `Node "${node.data?.label || node.id}" requires missing secret: PINECONE_API_KEY`,
            fixHint: 'Go to Secret Manager and add PINECONE_API_KEY.',
          });
        }
      }

      // Warning Rules (e.g. older models)
      if (node.type === 'agent' && node.data?.model === 'gpt-3.5-turbo') {
        issues.push({
          severity: 'INFO',
          nodeId: node.id,
          message: `Agent uses older model gpt-3.5-turbo.`,
          fixHint:
            'Consider upgrading to gpt-4o-mini for better performance at similar cost.',
        });
      }
    });

    return issues;
  }
}
