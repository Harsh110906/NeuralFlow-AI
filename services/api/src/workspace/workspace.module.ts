import { Module } from '@nestjs/common';
import { WorkspaceController } from './workspace.controller';
import { WorkspaceService } from './workspace.service';
import { SecretService } from './secret.service';
import { AuditService } from './audit.service';
import { SecretController } from './secret.controller';
import { KmsModule } from '../auth/kms/kms.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule, KmsModule],
  controllers: [WorkspaceController, SecretController],
  providers: [WorkspaceService, SecretService, AuditService],
  exports: [WorkspaceService, SecretService, AuditService],
})
export class WorkspaceModule {}
