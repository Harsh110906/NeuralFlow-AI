import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from './permissions.decorator';
import { PermissionService } from './permission.service';
import { PrismaService } from '../prisma/prisma.service';
import type { Request } from 'express';
import { getAuth } from '@clerk/express';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private permissionService: PermissionService,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    const request = context.switchToHttp().getRequest<Request>();
    const auth = getAuth(request);

    if (!auth || !auth.userId) {
      throw new UnauthorizedException('Authentication required');
    }

    // JIT User Provisioning
    const user = await this.prisma.user.upsert({
      where: { clerkId: auth.userId },
      update: {},
      create: {
        clerkId: auth.userId,
        email: 'unknown@example.com', // Will be updated async or omitted
      },
    });

    (request as any).user = user;

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true; // No specific permissions required beyond auth
    }

    // Find workspaceId from request params, body, or headers
    const workspaceId =
      request.params?.workspaceId ||
      request.body?.workspaceId ||
      (request.query?.workspaceId as string) ||
      (request.headers['x-workspace-id'] as string);

    if (!workspaceId) {
      throw new ForbiddenException(
        'Workspace context is required for permission evaluation',
      );
    }

    const hasAccess = await this.permissionService.hasPermissions(
      user.id,
      workspaceId,
      requiredPermissions,
    );
    
    if (!hasAccess) {
      throw new ForbiddenException(
        'User lacks required permissions for this workspace',
      );
    }
    
    return true;
  }
}
