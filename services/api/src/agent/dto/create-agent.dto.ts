export class CreateAgentDto {
  workspaceId: string;
  name: string;
  systemPrompt: string;
  model?: string;
  tools?: any;
}
