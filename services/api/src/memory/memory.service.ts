import { Injectable, Inject } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { LLMProvider } from '../execution/interfaces/llm.provider';

@Injectable()
export class MemoryService {
  constructor(
    private prisma: PrismaService,
    @Inject('LLMProvider') private readonly llmProvider: LLMProvider,
  ) {}

  async storeMemory(data: {
    workspaceId: string;
    agentId?: string;
    sourceType: string;
    content: string;
    metadata?: any;
  }) {
    // 1. Generate embedding
    const embedding = await this.llmProvider.embed(data.content);

    // 2. Format embedding array for pgvector string representation: '[1,2,3...]'
    const vectorString = `[${embedding.join(',')}]`;

    // 3. Store using raw SQL to support pgvector Unsupported type
    const result = await this.prisma.$executeRaw`
      INSERT INTO "Memory" ("id", "workspaceId", "agentId", "sourceType", "content", "metadata", "embedding", "createdAt")
      VALUES (
        gen_random_uuid(),
        ${data.workspaceId},
        ${data.agentId || null},
        ${data.sourceType},
        ${data.content},
        ${data.metadata ? JSON.stringify(data.metadata) : null}::jsonb,
        ${vectorString}::vector,
        now()
      )
    `;

    return result;
  }

  async retrieveSimilar(data: {
    workspaceId: string;
    agentId?: string;
    query: string;
    topK?: number;
    threshold?: number;
  }) {
    const topK = data.topK || 5;
    // We could use threshold in the WHERE clause: <=> < threshold (cosine distance)

    const queryEmbedding = await this.llmProvider.embed(data.query);
    const vectorString = `[${queryEmbedding.join(',')}]`;

    // Retrieve using raw SQL and cosine similarity
    let results: any[];
    if (data.agentId) {
      results = await this.prisma.$queryRaw`
        SELECT "id", "workspaceId", "agentId", "sourceType", "content", "metadata", "createdAt",
               1 - ("embedding" <=> ${vectorString}::vector) as similarity
        FROM "Memory"
        WHERE "workspaceId" = ${data.workspaceId} AND "agentId" = ${data.agentId}
        ORDER BY "embedding" <=> ${vectorString}::vector
        LIMIT ${topK}
      `;
    } else {
      results = await this.prisma.$queryRaw`
        SELECT "id", "workspaceId", "agentId", "sourceType", "content", "metadata", "createdAt",
               1 - ("embedding" <=> ${vectorString}::vector) as similarity
        FROM "Memory"
        WHERE "workspaceId" = ${data.workspaceId}
        ORDER BY "embedding" <=> ${vectorString}::vector
        LIMIT ${topK}
      `;
    }

    return results;
  }

  async deleteMemory(id: string) {
    return this.prisma.memory.delete({
      where: { id },
    });
  }

  async getTeamMemory(workspaceId: string, teamId: string) {
    return this.prisma.$queryRaw`
        SELECT "content", "metadata", "createdAt"
        FROM "Memory"
        WHERE "workspaceId" = ${workspaceId} 
          AND "sourceType" = 'TEAM_MEMORY' 
          AND "metadata"->>'teamId' = ${teamId}
        ORDER BY "createdAt" ASC
      `;
  }

  async getExecutionMemory(workspaceId: string, executionId: string) {
    return this.prisma.$queryRaw`
        SELECT "content", "metadata", "createdAt"
        FROM "Memory"
        WHERE "workspaceId" = ${workspaceId} 
          AND "sourceType" = 'EXECUTION_MEMORY' 
          AND "metadata"->>'executionId' = ${executionId}
        ORDER BY "createdAt" ASC
      `;
  }
}
