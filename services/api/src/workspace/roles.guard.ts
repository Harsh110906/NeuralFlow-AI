import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true; // No roles required
    }

    const request = context.switchToHttp().getRequest();
    // In a real app with Clerk:
    // const userId = request.auth.userId;
    // For this demonstration, we assume userId is passed in headers or body, or we skip actual enforcement if not present
    const userId = request.headers['x-user-id'] || 'demo-user-id';

    // We also need workspaceId, usually from params or body
    const workspaceId =
      request.params.workspaceId || request.body.workspaceId || 'production';

    const membership = await this.prisma.workspaceMember.findUnique({
      where: { userId_workspaceId: { userId, workspaceId } },
    });

    if (!membership) {
      return false; // Not a member
    }

    return requiredRoles.includes(membership.roleId);
  }
}
