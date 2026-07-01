import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { TemplateService } from './template.service';
import { PublishTemplateDto } from './dto/publish-template.dto';

@Controller('templates')
export class TemplateController {
  constructor(private readonly templateService: TemplateService) {}

  @Get()
  async getTemplates(
    @Query('workspaceId') workspaceId?: string,
    @Query('isPublic') isPublic?: string,
  ) {
    const isPublicBool =
      isPublic === 'true' ? true : isPublic === 'false' ? false : undefined;
    return this.templateService.getTemplates(workspaceId, isPublicBool);
  }

  @Get(':id')
  async getTemplateDetails(
    @Param('id') id: string,
    @Query('version') version?: string,
  ) {
    const parsedVersion = version ? parseInt(version, 10) : undefined;
    return this.templateService.getTemplateDetails(id, parsedVersion);
  }

  @Post()
  async publishTemplate(@Req() req: any, @Body() data: PublishTemplateDto) {
    const workspaceId =
      req.body.workspaceId || req.user?.workspaceId || 'system';
    const userId = req.user?.id || req.user?.sub || 'unknown';
    return this.templateService.publishTemplate(workspaceId, data, userId);
  }

  @Post(':id/install')
  async installTemplate(
    @Param('id') id: string,
    @Body('workspaceId') workspaceId: string,
    @Req() req: any,
    @Body('versionId') versionId?: string,
  ) {
    if (!workspaceId) throw new Error('workspaceId is required');
    const userId = req.user?.id || req.user?.sub || 'unknown';
    return this.templateService.installTemplate(
      id,
      workspaceId,
      userId,
      versionId,
    );
  }

  @Post('seed')
  async seedSystemTemplates() {
    await this.templateService.seedSystemTemplates();
    return {
      status: 'success',
      message: 'System templates seeded successfully.',
    };
  }
}
