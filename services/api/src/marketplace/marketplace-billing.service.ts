import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import Stripe from 'stripe';

@Injectable()
export class MarketplaceBillingService {
  private stripe: Stripe;

  constructor(private prisma: PrismaService) {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_mock', {
      apiVersion: '2023-10-16' as any,
    });
  }

  // 1. Stripe Connect Onboarding
  async createConnectAccount(workspaceId: string) {
    const workspace = await this.prisma.workspace.findUnique({
      where: { id: workspaceId },
    });
    if (!workspace) throw new NotFoundException('Workspace not found');

    if (workspace.stripeConnectAccountId) {
      // Already has an account, return a login link
      const loginLink = await this.stripe.accounts.createLoginLink(
        workspace.stripeConnectAccountId,
      );
      return { url: loginLink.url };
    }

    // Create a new connected account
    const account = await this.stripe.accounts.create({
      type: 'express',
      metadata: { workspaceId },
    });

    await this.prisma.workspace.update({
      where: { id: workspaceId },
      data: { stripeConnectAccountId: account.id },
    });

    const accountLink = await this.stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/creator/onboard/refresh`,
      return_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/creator/onboard/success`,
      type: 'account_onboarding',
    });

    return { url: accountLink.url };
  }

  // 2. Checkout Session (Buy Template)
  async createCheckoutSession(buyerWorkspaceId: string, templateId: string) {
    const template = await this.prisma.template.findUnique({
      where: { id: templateId },
      include: { workspace: true },
    });

    if (!template) throw new NotFoundException('Template not found');
    if (template.pricingType === 'FREE')
      throw new Error('Cannot buy a free template');

    const config = await this.prisma.marketplaceConfig.findUnique({
      where: { id: 'default' },
    });
    const platformFeePercent = config?.defaultPlatformFeePercent || 15;
    const applicationFeeAmount = Math.round(
      template.priceCents * (platformFeePercent / 100),
    );

    const connectedAccountId = template.workspace.stripeConnectAccountId;
    if (!connectedAccountId) {
      throw new InternalServerErrorException('Creator has not set up payouts');
    }

    const sessionData: Stripe.Checkout.SessionCreateParams = {
      payment_method_types: ['card'],
      mode:
        template.pricingType === 'SUBSCRIPTION' ? 'subscription' : 'payment',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: template.name,
              description: template.description || '',
            },
            unit_amount: template.priceCents,
            recurring:
              template.pricingType === 'SUBSCRIPTION'
                ? { interval: (template.billingInterval as any) || 'month' }
                : undefined,
          },
          quantity: 1,
        },
      ],
      payment_intent_data:
        template.pricingType === 'ONE_TIME'
          ? {
              application_fee_amount: applicationFeeAmount,
              transfer_data: { destination: connectedAccountId },
            }
          : undefined,
      subscription_data:
        template.pricingType === 'SUBSCRIPTION'
          ? {
              transfer_data: {
                destination: connectedAccountId,
                amount_percent: 100 - platformFeePercent,
              },
            }
          : undefined,
      success_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/marketplace/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/marketplace/template/${template.id}`,
      metadata: {
        templateId,
        buyerWorkspaceId,
      },
    };

    const session = await this.stripe.checkout.sessions.create(sessionData);
    return { url: session.url };
  }

  // 3. Usage-Based Metered Billing Reporting
  async reportUsage(subscriptionItemId: string, usageQuantity: number) {
    return (this.stripe.subscriptionItems as any).createUsageRecord(
      subscriptionItemId,
      {
        quantity: usageQuantity,
        timestamp: Math.floor(Date.now() / 1000),
        action: 'increment',
      },
    );
  }
}
