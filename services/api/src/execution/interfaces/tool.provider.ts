export interface ToolProvider {
  execute(toolId: string, parameters: any): Promise<any>;
}
