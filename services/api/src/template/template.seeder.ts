import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TemplateSeeder implements OnModuleInit {
  constructor(private prisma: PrismaService) {}

  async onModuleInit() {
    await this.seedTemplates();
  }

  private async seedTemplates() {
    const systemTemplates = [
      {
        id: 'sys-wf-customer-onboarding',
        type: 'WORKFLOW',
        name: 'Customer Onboarding Journey',
        description:
          'A standard 3-step workflow for welcoming new customers and provisioning accounts.',
        category: 'Customer Success',
        isGlobal: true,
        tags: ['onboarding', 'customer', 'automated'],
        payload: {
          nodes: [
            { id: '1', type: 'trigger', data: { event: 'user.created' } },
            { id: '2', type: 'agent', data: { role: 'Welcome Email Sender' } },
            { id: '3', type: 'tool', data: { action: 'provision_account' } },
          ],
          edges: [
            { source: '1', target: '2' },
            { source: '2', target: '3' },
          ],
        },
      },
      {
        id: 'sys-agent-support-bot',
        type: 'AGENT',
        name: 'L1 Support Responder',
        description:
          'An AI agent pre-configured with Zendesk tools to answer basic L1 support queries.',
        category: 'Support',
        isGlobal: true,
        tags: ['support', 'zendesk', 'ai'],
        payload: {
          systemPrompt:
            'You are an L1 support agent. You use Zendesk to search for knowledge base articles and reply to customers.',
          model: 'gpt-4o-mini',
          tools: ['zendesk.search', 'zendesk.reply'],
        },
      },
    ];

    for (const tmpl of systemTemplates) {
      const existing = await this.prisma.template.findUnique({
        where: { id: tmpl.id },
      });
      if (!existing) {
        console.log(`[TemplateSeeder] Seeding template ${tmpl.name}`);
        const template = await this.prisma.template.create({
          data: {
            id: tmpl.id,
            workspaceId: 'system',
            type: tmpl.type,
            name: tmpl.name,
            description: tmpl.description,
            category: tmpl.category,
            isGlobal: tmpl.isGlobal,
            tags: tmpl.tags,
            status: 'PUBLISHED',
          },
        });

        const version = await this.prisma.templateVersion.create({
          data: {
            templateId: template.id,
            version: 1,
            dagJson: tmpl.type === 'WORKFLOW' ? tmpl.payload : undefined,
            agentJson: tmpl.type === 'AGENT' ? tmpl.payload : undefined,
            createdBy: 'system',
          },
        });

        await this.prisma.template.update({
          where: { id: template.id },
          data: { activeVersionId: version.id },
        });
      }
    }
  }
}
