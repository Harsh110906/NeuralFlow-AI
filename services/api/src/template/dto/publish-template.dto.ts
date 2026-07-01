export class PublishTemplateDto {
  name: string;
  description?: string;
  category: string;
  type: string; // WORKFLOW or AGENT
  dagJson?: any;
  agentJson?: any;
  requiredConnectors?: string[];
  requiredSecrets?: string[];
}
