import { Controller, Post, Req, Res, Headers } from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import type { Request, Response } from 'express';
import { PrismaService } from '../prisma/prisma.service';
// import Stripe from 'stripe';

@Controller('webhooks/stripe')
export class StripeWebhookController {
  constructor(private readonly prisma: PrismaService) {}

  @Post()
  async handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
    @Res() res: Response,
  ) {
    // In production:
    // const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    // const event = stripe.webhooks.constructEvent(req.rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET);

    const event: any = req.body; // Mock event extraction

    try {
      switch (event.type) {
        case 'customer.subscription.updated':
        case 'customer.subscription.deleted':
          const subscription = event.data.object;
          // Crucial reconciliation check using the metadata injected at checkout
          const workspaceId = subscription.metadata?.workspaceId;
          const planId = subscription.metadata?.planId;

          if (workspaceId) {
            await this.prisma.workspace.update({
              where: { id: workspaceId },
              data: {
                stripeId: subscription.id,
                plan: planId || subscription.plan.id,
                updatedAt: new Date(),
              },
            });
          }
          break;
        default:
          console.log(`Unhandled event type ${event.type}`);
      }
      return res.status(200).send({ received: true });
    } catch (err) {
      console.error(`Webhook Error: ${err.message}`);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }
  }
}
