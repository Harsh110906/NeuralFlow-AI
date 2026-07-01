import { Controller, Get, Param } from '@nestjs/common';
import { WorkspaceService } from './workspace.service';

@Controller('workspaces')
export class WorkspaceController {
  constructor(private readonly workspaceService: WorkspaceService) {}

  @Get()
  getWorkspaces() {
    return this.workspaceService.getWorkspaces();
  }

  @Get(':slug')
  getWorkspace(@Param('slug') slug: string) {
    return this.workspaceService.getWorkspaceBySlug(slug);
  }
}
