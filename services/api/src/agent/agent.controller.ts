import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
} from '@nestjs/common';
import { AgentService } from './agent.service';
import { UpdateAgentDto } from './dto/update-agent.dto';
import { CreateAgentDto } from './dto/create-agent.dto';

@Controller('agents')
export class AgentController {
  constructor(private readonly agentService: AgentService) {}

  @Get()
  getAgents(@Query('workspaceId') workspaceId: string) {
    if (!workspaceId) return [];
    return this.agentService.getAgentsByWorkspace(workspaceId);
  }

  @Get(':id')
  getAgent(@Param('id') id: string) {
    return this.agentService.getAgent(id);
  }

  @Put(':id')
  updateAgent(@Param('id') id: string, @Body() body: UpdateAgentDto) {
    return this.agentService.updateAgent(id, body);
  }
  @Post()
  createAgent(@Body() body: CreateAgentDto) {
    return this.agentService.createAgent(body);
  }

  @Delete(':id')
  deleteAgent(@Param('id') id: string) {
    return this.agentService.deleteAgent(id);
  }

  @Post(':id/chat')
  chatWithAgent(@Param('id') id: string, @Body('message') message: string) {
    return this.agentService.runInference(id, message);
  }
}
