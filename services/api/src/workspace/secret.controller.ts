import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { SecretService } from './secret.service';
import {
  SecretMetadataDto,
  SetSecretDto,
  RotateSecretDto,
} from './dto/secret.dto';
// Mocks for guards
// import { RolesGuard, Roles } from './roles.guard';
// import { WorkspaceGuard } from './workspace.guard';

@Controller('workspaces/:workspaceId/secrets')
// @UseGuards(WorkspaceGuard, RolesGuard)
export class SecretController {
  constructor(private readonly secretService: SecretService) {}

  @Get()
  // @Roles('ADMIN', 'MEMBER')
  async listSecrets(
    @Param('workspaceId') workspaceId: string,
  ): Promise<SecretMetadataDto[]> {
    return this.secretService.listSecretsMetadata(workspaceId);
  }

  @Post()
  // @Roles('ADMIN')
  async createSecret(
    @Param('workspaceId') workspaceId: string,
    @Body() dto: SetSecretDto,
  ) {
    // We only return success to the frontend, never the encrypted/decrypted value
    await this.secretService.setSecret(
      workspaceId,
      dto.name,
      dto.value,
      dto.description,
    );
    return { success: true };
  }

  @Post(':name/rotate')
  // @Roles('ADMIN')
  async rotateSecret(
    @Param('workspaceId') workspaceId: string,
    @Param('name') name: string,
    @Body() dto: RotateSecretDto,
  ) {
    await this.secretService.rotateSecret(workspaceId, name, dto.newValue);
    return { success: true };
  }

  @Delete(':name')
  // @Roles('ADMIN')
  async deleteSecret(
    @Param('workspaceId') workspaceId: string,
    @Param('name') name: string,
  ) {
    return this.secretService.deleteSecret(workspaceId, name);
  }
}
