import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PermissionService {
  constructor(private prisma: PrismaService) {}

  /**
   * Resolves all permissions for a given Role ID, including those inherited from parent roles.
   */
  async resolvePermissionsForRole(roleId: string): Promise<Set<string>> {
    const permissions = new Set<string>();
    let currentRoleId: string | null = roleId;
    const visitedRoles = new Set<string>();

    while (currentRoleId) {
      if (visitedRoles.has(currentRoleId)) {
        throw new InternalServerErrorException(
          'Circular dependency detected in role hierarchy',
        );
      }
      visitedRoles.add(currentRoleId);

      const role = await this.prisma.role.findUnique({
        where: { id: currentRoleId },
        include: {
          permissions: {
            include: { permission: true },
          },
        },
      });

      if (!role) break;

      for (const rp of role.permissions) {
        permissions.add(rp.permission.key);
      }

      currentRoleId = role.parentRoleId;
    }

    return permissions;
  }

  /**
   * Evaluates if a user in a workspace has the required permissions.
   * If they are the workspace owner, they automatically have all permissions.
   */
  async hasPermissions(
    userId: string,
    workspaceId: string,
    requiredPermissions: string[],
  ): Promise<boolean> {
    const workspace = await this.prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: {
        members: {
          where: { userId },
        },
      },
    });

    if (!workspace) return false;

    // Owners automatically bypass permission checks
    if (workspace.ownerId === userId) {
      return true;
    }

    const member = workspace.members[0];
    if (!member) return false;

    const userPermissions = await this.resolvePermissionsForRole(member.roleId);

    // Ensure they have ALL required permissions
    return requiredPermissions.every((p) => userPermissions.has(p));
  }

  /**
   * Same check but for Service Accounts (API Keys)
   */
  async serviceAccountHasPermissions(
    serviceAccountId: string,
    requiredPermissions: string[],
  ): Promise<boolean> {
    const sa = await this.prisma.serviceAccount.findUnique({
      where: { id: serviceAccountId },
    });
    if (!sa || sa.disabledAt) return false;

    const saPermissions = await this.resolvePermissionsForRole(sa.roleId);
    return requiredPermissions.every((p) => saPermissions.has(p));
  }
}
