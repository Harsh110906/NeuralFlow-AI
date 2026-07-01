import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateAgentDto } from './dto/update-agent.dto';
import type { LLMProvider } from '../execution/interfaces/llm.provider';
import { CreateAgentDto } from './dto/create-agent.dto';
import { MemoryService } from '../memory/memory.service';

@Injectable()
export class AgentService {
  constructor(
    private prisma: PrismaService,
    @Inject('LLMProvider') private readonly llmProvider: LLMProvider,
    private memoryService: MemoryService,
  ) {}

  async getAgentsByWorkspace(workspaceId: string) {
    return this.prisma.agent.findMany({
      where: { workspaceId },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async createAgent(dto: CreateAgentDto) {
    return this.prisma.agent.create({
      data: {
        workspaceId: dto.workspaceId,
        name: dto.name,
        systemPrompt: dto.systemPrompt,
        model: dto.model || 'gpt-4o-mini',
        tools: dto.tools || [],
      },
    });
  }

  async deleteAgent(id: string) {
    return this.prisma.agent.delete({
      where: { id },
    });
  }

  async getAgent(id: string) {
    const agent = await this.prisma.agent.findUnique({
      where: { id },
    });
    if (!agent) throw new NotFoundException('Agent not found');
    return agent;
  }

  async updateAgent(id: string, dto: UpdateAgentDto) {
    return this.prisma.agent.update({
      where: { id },
      data: {
        name: dto.name,
        systemPrompt: dto.systemPrompt,
        model: dto.model,
        tools: dto.tools,
      },
    });
  }

  async runInference(
    id: string,
    input: string,
  ): Promise<
    import('../execution/interfaces/llm.provider').LLMGenerationResult
  > {
    const agent = await this.getAgent(id);

    // Step 2: Retrieve relevant memories
    const similarMemories = await this.memoryService.retrieveSimilar({
      workspaceId: agent.workspaceId,
      agentId: agent.id,
      query: input,
      topK: 3,
    });

    // Step 3: Build augmented context
    let augmentedPrompt = input;
    if (similarMemories && similarMemories.length > 0) {
      const memoryContext = similarMemories
        .map((m) => m.content)
        .join('\n---\n');
      augmentedPrompt = `Relevant Context:\n${memoryContext}\n\nUser Input:\n${input}`;
    }

    // Step 4: Call LLM Provider
    const result = await this.llmProvider.generate(
      augmentedPrompt,
      agent.systemPrompt || undefined,
    );

    // Step 5: Store useful outputs as memory
    await this.memoryService.storeMemory({
      workspaceId: agent.workspaceId,
      agentId: agent.id,
      sourceType: 'WORKFLOW_OUTPUT',
      content: result.content,
    });

    return result;
  }
}
