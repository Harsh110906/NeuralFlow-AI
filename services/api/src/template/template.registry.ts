export interface TemplateBetaConfig {
  id: string;
  name: string;
  description: string;
  category: string;
  dagJson: any; // React Flow nodes/edges
  requiredSecrets: string[];
  requiredConnectors: string[];
  suggestedInputs: Record<string, any>;
  previewMetadata: { image?: string; estimatedCost?: number };
  betaEnabled: boolean;
}

const customerSupportDag = {
  schemaVersion: 1,
  nodes: [
    {
      id: 'trigger-1',
      type: 'trigger',
      position: { x: 250, y: 50 },
      data: { label: 'Zendesk Webhook', status: 'COMPLETED' },
    },
    {
      id: 'agent-1',
      type: 'agent',
      position: { x: 250, y: 200 },
      data: { label: 'Triage Agent', model: 'gpt-4o-mini', status: 'IDLE' },
    },
    {
      id: 'tool-1',
      type: 'tool',
      position: { x: 250, y: 350 },
      data: { label: 'Knowledge Base Search', status: 'IDLE' },
    },
  ],
  edges: [
    { id: 'e1-2', source: 'trigger-1', target: 'agent-1', animated: true },
    { id: 'e2-3', source: 'agent-1', target: 'tool-1' },
  ],
  viewport: { x: 0, y: 0, zoom: 1 },
};

const webScraperDag = {
  schemaVersion: 1,
  nodes: [
    {
      id: 'trigger-1',
      type: 'trigger',
      position: { x: 250, y: 50 },
      data: { label: 'Manual Trigger', status: 'COMPLETED' },
    },
    {
      id: 'agent-1',
      type: 'agent',
      position: { x: 250, y: 200 },
      data: { label: 'Extraction Agent', model: 'gpt-4o', status: 'IDLE' },
    },
    {
      id: 'tool-1',
      type: 'tool',
      position: { x: 250, y: 350 },
      data: { label: 'Browser Tool', status: 'IDLE' },
    },
  ],
  edges: [
    { id: 'e1-2', source: 'trigger-1', target: 'agent-1', animated: true },
    { id: 'e2-3', source: 'agent-1', target: 'tool-1' },
  ],
  viewport: { x: 0, y: 0, zoom: 1 },
};

export class TemplateRegistry {
  private static templates: TemplateBetaConfig[] = [
    {
      id: 'tpl-customer-support',
      name: 'Customer Support Triage',
      description:
        'Automatically classify and draft responses for incoming support tickets using a knowledge base.',
      category: 'Support',
      dagJson: customerSupportDag,
      requiredSecrets: ['ZENDESK_API_KEY'],
      requiredConnectors: ['zendesk', 'pinecone'],
      suggestedInputs: { ticketId: '12345' },
      previewMetadata: { estimatedCost: 0.05 },
      betaEnabled: true,
    },
    {
      id: 'tpl-web-scraper',
      name: 'Deep Web Scraper',
      description:
        'Extract structured data from multiple web pages and output it into a unified format.',
      category: 'Data Extraction',
      dagJson: webScraperDag,
      requiredSecrets: [],
      requiredConnectors: ['browserless'],
      suggestedInputs: { startUrl: 'https://news.ycombinator.com' },
      previewMetadata: { estimatedCost: 0.02 },
      betaEnabled: true,
    },
  ];

  static getBetaTemplates(): TemplateBetaConfig[] {
    return this.templates.filter((t) => t.betaEnabled);
  }

  static getTemplate(id: string): TemplateBetaConfig | undefined {
    return this.templates.find((t) => t.id === id);
  }
}
