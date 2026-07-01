import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as crypto from 'crypto';

@Injectable()
export class AgentVersioningService {
  constructor(private prisma: PrismaService) {}

  /**
   * Retrieves an existing immutable AgentVersion if identical configuration exists.
   * Otherwise, creates a new AgentVersion with an incremented version number.
   */
  async getOrCreateVersion(
    agentId: string,
    systemPrompt: string,
    model: string,
    temperature: number,
    tools: any,
    createdBy: string,
  ) {
    const dataString = JSON.stringify({
      systemPrompt,
      model,
      temperature,
      tools,
    });
    const checksum = crypto
      .createHash('sha256')
      .update(dataString)
      .digest('hex');

    const existing = await this.prisma.agentVersion.findFirst({
      where: { agentId, checksum },
    });

    if (existing) {
      return existing;
    }

    const lastVersion = await this.prisma.agentVersion.findFirst({
      where: { agentId },
      orderBy: { version: 'desc' },
    });

    const versionNum = lastVersion ? lastVersion.version + 1 : 1;

    return this.prisma.agentVersion.create({
      data: {
        agentId,
        version: versionNum,
        systemPrompt,
        model,
        temperature,
        tools: tools ? JSON.parse(JSON.stringify(tools)) : null,
        checksum,
        createdBy,
      },
    });
  }
}
