import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * SCIM (System for Cross-domain Identity Management) API v2 preparation layer.
 * Future integration point for Okta, Azure AD, etc.
 */
@Controller('scim/v2')
export class ScimController {
  constructor(private prisma: PrismaService) {}

  @Get('Users')
  async listUsers(@Query() query: any) {
    // SCIM List Users Stub
    return {
      schemas: ['urn:ietf:params:scim:api:messages:2.0:ListResponse'],
      totalResults: 0,
      Resources: [],
    };
  }

  @Get('Users/:id')
  async getUser(@Param('id') id: string) {
    return { id, active: true };
  }

  @Post('Users')
  @HttpCode(HttpStatus.CREATED)
  async provisionUser(@Body() body: any) {
    // Stub: Automatically create or map user via SCIM
    return {
      schemas: ['urn:ietf:params:scim:schemas:core:2.0:User'],
      id: 'scim-user-123',
    };
  }

  @Patch('Users/:id')
  async patchUser(@Param('id') id: string, @Body() body: any) {
    return { id, active: true };
  }

  @Delete('Users/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deprovisionUser(@Param('id') id: string) {
    // SCIM users are typically suspended rather than deleted
    // Here we would mark provisioningStatus = 'DEPROVISIONED'
    return;
  }
}
