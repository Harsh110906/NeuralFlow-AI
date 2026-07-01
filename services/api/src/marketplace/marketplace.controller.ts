import { Controller, Get, Post, Param, Body, Query } from '@nestjs/common';
import { MarketplaceService } from './marketplace.service';
import { MarketplaceBillingService } from './marketplace-billing.service';
import { DependencyValidationService } from './dependency-validation.service';

@Controller('marketplace')
export class MarketplaceController {
  constructor(
    private readonly marketplaceService: MarketplaceService,
    private readonly billingService: MarketplaceBillingService,
    private readonly dependencyValidationService: DependencyValidationService,
  ) {}

  @Get('search')
  async searchTemplates(@Query() query: any) {
    return this.marketplaceService.searchTemplates(query);
  }

  @Post('templates/:id/validate')
  async validateDependencies(
    @Param('id') id: string,
    @Body('versionId') versionId: string,
    @Body('workspaceId') workspaceId: string,
  ) {
    return this.dependencyValidationService.validateForInstallation(
      workspaceId,
      versionId,
    );
  }

  @Post('templates/:id/install')
  async installTemplate(
    @Param('id') id: string,
    @Body('versionId') versionId: string,
    @Body('workspaceId') workspaceId: string,
  ) {
    return this.marketplaceService.installTemplate(id, versionId, workspaceId);
  }

  @Post('templates/:id/buy')
  async buyTemplate(
    @Param('id') id: string,
    @Body('workspaceId') workspaceId: string,
  ) {
    return this.billingService.createCheckoutSession(workspaceId, id);
  }

  @Post('creators/onboard')
  async onboardCreator(@Body('workspaceId') workspaceId: string) {
    return this.billingService.createConnectAccount(workspaceId);
  }
}
