import { Controller, Get } from '@nestjs/common';
import { SystemHealthService } from './system-health.service';

@Controller('admin/system-health')
export class SystemHealthController {
  constructor(private healthService: SystemHealthService) {}

  @Get()
  async getHealth() {
    return this.healthService.checkAll();
  }
}
