import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from './permissions.decorator';
import { PermissionService } from './permission.service';
import { Request } from 'express';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private permissionService: PermissionService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true; // No specific permissions required
    }

    const request = context.switchToHttp().getRequest<Request>();

    // AuthGuard should have already populated request.user or request.serviceAccount
    const user = (request as any).user;
    const serviceAccount = (request as any).serviceAccount;

    // Find workspaceId from request params, body, or headers
    const workspaceId =
      request.params?.workspaceId ||
      request.body?.workspaceId ||
      (request.headers['x-workspace-id'] as string);

    if (!workspaceId) {
      throw new ForbiddenException(
        'Workspace context is required for permission evaluation',
      );
    }

    if (serviceAccount) {
      const hasAccess =
        await this.permissionService.serviceAccountHasPermissions(
          serviceAccount.id,
          requiredPermissions,
        );
      if (!hasAccess)
        throw new ForbiddenException(
          'Service account lacks required permissions',
        );
      return true;
    }

    if (user) {
      const hasAccess = await this.permissionService.hasPermissions(
        user.id,
        workspaceId,
        requiredPermissions,
      );
      if (!hasAccess)
        throw new ForbiddenException(
          'User lacks required permissions for this workspace',
        );
      return true;
    }

    throw new ForbiddenException('Authentication required');
  }
}
