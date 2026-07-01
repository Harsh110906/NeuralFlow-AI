import { Controller, Get, Param, Req, UseGuards } from '@nestjs/common';
import { WorkspaceService } from './workspace.service';
import { PermissionsGuard } from '../auth/permissions.guard';
import type { Request } from 'express';

@Controller('workspaces')
export class WorkspaceController {
  constructor(private readonly workspaceService: WorkspaceService) {}

  @Get('bootstrap')
  @UseGuards(PermissionsGuard)
  bootstrapWorkspace(@Req() request: Request) {
    const user = (request as any).user;
    return this.workspaceService.bootstrapWorkspace(user.id);
  }

  @Get()
  getWorkspaces() {
    return this.workspaceService.getWorkspaces();
  }

  @Get(':slug')
  getWorkspace(@Param('slug') slug: string) {
    return this.workspaceService.getWorkspaceBySlug(slug);
  }
}
