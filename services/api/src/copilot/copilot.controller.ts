import { Controller, Post, Body, Res } from '@nestjs/common';
import type { Response } from 'express';
import { CopilotService } from './copilot.service';

@Controller('copilot')
export class CopilotController {
  constructor(private readonly copilotService: CopilotService) {}

  @Post('chat')
  async chat(
    @Body() body: { message: string; history?: any[] },
    @Res() res: Response,
  ) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    try {
      const stream = await this.copilotService.chatStream(
        body.message,
        body.history,
      );

      for await (const chunk of stream) {
        res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
      }

      res.write(`data: [DONE]\n\n`);
      res.end();
    } catch (err) {
      console.error('Copilot stream error:', err);
      res.write(
        `data: ${JSON.stringify({ error: 'Internal Server Error' })}\n\n`,
      );
      res.end();
    }
  }

  @Post('generate-workflow')
  async generateWorkflow(
    @Body() body: { prompt: string; workspaceId: string; currentDagJson?: any },
  ) {
    // Step 1: Generate Spec
    const spec = await this.copilotService.generateWorkflowSpec(body.prompt, body.currentDagJson);
    // Step 2: Compile DAG
    const compiled = await this.copilotService.compileWorkflowDAG(
      body.workspaceId || 'production',
      spec,
      body.currentDagJson
    );
    return compiled;
  }
}
