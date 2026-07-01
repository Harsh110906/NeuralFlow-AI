import { Module } from '@nestjs/common';
import { MarketplaceController } from './marketplace.controller';
import { MarketplaceService } from './marketplace.service';
import { MarketplaceBillingService } from './marketplace-billing.service';
import { SecurityScanService } from './security-scan.service';
import { DependencyValidationService } from './dependency-validation.service';
import { PostgresSearchProvider } from './search/postgres-search.provider';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [MarketplaceController],
  providers: [
    MarketplaceService,
    MarketplaceBillingService,
    SecurityScanService,
    DependencyValidationService,
    { provide: 'SearchProvider', useClass: PostgresSearchProvider },
  ],
  exports: [
    MarketplaceService,
    MarketplaceBillingService,
    SecurityScanService,
    DependencyValidationService,
    'SearchProvider',
  ],
})
export class MarketplaceModule {}
