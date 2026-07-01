import { Test, TestingModule } from '@nestjs/testing';
import { CostGuardService } from './cost-guard.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  BillingLedgerService,
  BillingEventType,
} from './billing-ledger.service';
import { HttpException, HttpStatus } from '@nestjs/common';

describe('CostGuardService', () => {
  let service: CostGuardService;
  let prismaService: jest.Mocked<Partial<PrismaService>>;

  beforeEach(async () => {
    prismaService = {
      workspaceBillingPolicy: {
        findUnique: jest.fn(),
      } as any,
      billingLedger: {
        aggregate: jest.fn(),
      } as any,
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CostGuardService,
        { provide: PrismaService, useValue: prismaService },
        { provide: BillingLedgerService, useValue: {} },
      ],
    }).compile();

    service = module.get<CostGuardService>(CostGuardService);
  });

  it('should allow execution if no policy is set', async () => {
    (
      prismaService.workspaceBillingPolicy!.findUnique as jest.Mock
    ).mockResolvedValue(null);

    const result = await service.checkBudget('ws_123', 10);
    expect(result).toBe(true);
  });

  it('should throw if execution cost exceeds per-execution limit', async () => {
    (
      prismaService.workspaceBillingPolicy!.findUnique as jest.Mock
    ).mockResolvedValue({
      workspaceId: 'ws_123',
      executionCostLimit: 5.0,
      monthlyBudget: 100,
    });

    await expect(service.checkBudget('ws_123', 10.0)).rejects.toThrow(
      HttpException,
    );
  });

  it('should allow if under monthly budget', async () => {
    (
      prismaService.workspaceBillingPolicy!.findUnique as jest.Mock
    ).mockResolvedValue({
      workspaceId: 'ws_123',
      executionCostLimit: 20.0,
      monthlyBudget: 100,
      hardCutoff: true,
    });

    (prismaService.billingLedger!.aggregate as jest.Mock).mockResolvedValue({
      _sum: { amountUsd: 50 },
    });

    const result = await service.checkBudget('ws_123', 10.0);
    expect(result).toBe(true);
  });

  it('should block if over monthly budget and hardCutoff is true', async () => {
    (
      prismaService.workspaceBillingPolicy!.findUnique as jest.Mock
    ).mockResolvedValue({
      workspaceId: 'ws_123',
      executionCostLimit: 20.0,
      monthlyBudget: 100,
      hardCutoff: true,
    });

    (prismaService.billingLedger!.aggregate as jest.Mock).mockResolvedValue({
      _sum: { amountUsd: 95 },
    });

    await expect(service.checkBudget('ws_123', 10.0)).rejects.toThrow(
      HttpException,
    );
  });
});
