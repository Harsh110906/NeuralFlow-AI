import { Module, Global } from '@nestjs/common';
import { PermissionService } from './permission.service';
import { PermissionsGuard } from './permissions.guard';
import { ApiKeyService } from './api-key.service';
import { AuditService } from './audit.service';
import { SecurityPolicyService } from './security-policy.service';
import { GovernanceController } from './governance.controller';
import { ScimController } from './scim.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Global()
@Module({
  imports: [PrismaModule],
  controllers: [GovernanceController, ScimController],
  providers: [
    PermissionService,
    PermissionsGuard,
    ApiKeyService,
    AuditService,
    SecurityPolicyService,
  ],
  exports: [
    PermissionService,
    PermissionsGuard,
    ApiKeyService,
    AuditService,
    SecurityPolicyService,
  ],
})
export class AuthModule {}
