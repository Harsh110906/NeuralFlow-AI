import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create test user
  const user = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      email: 'test@example.com',
      clerkId: 'user_2m1234567890', // Fake clerk ID for testing
      firstName: 'Test',
      lastName: 'User',
    },
  });

  // Create test workspace
  const workspace = await prisma.workspace.upsert({
    where: { slug: 'test-org' },
    update: {},
    create: {
      name: 'Test Organization',
      slug: 'test-org',
      plan: 'PRO',
      members: {
        create: {
          userId: user.id,
          role: 'ADMIN',
        },
      },
    },
  });

  // Create test agent
  await prisma.agent.create({
    data: {
      workspaceId: workspace.id,
      name: 'Support Bot',
      systemPrompt: 'You are a helpful customer support bot.',
      model: 'gpt-4o-mini',
      tools: ['search_kb', 'ticket_create'],
    },
  });

  // Create test workflow
  await prisma.workflow.create({
    data: {
      workspaceId: workspace.id,
      name: 'New Ticket Triage',
      description: 'Auto-categorizes new support tickets',
      dagJson: {
        nodes: [
          {
            id: '1',
            type: 'trigger',
            position: { x: 250, y: 50 },
            data: { label: 'Webhook Trigger' },
          },
          {
            id: '2',
            type: 'agent',
            position: { x: 250, y: 200 },
            data: { label: 'Categorization Agent' },
          },
        ],
        edges: [
          { id: 'e1-2', source: '1', target: '2' },
        ],
      },
    },
  });

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
