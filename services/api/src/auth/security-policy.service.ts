import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SecurityPolicyService {
  constructor(private prisma: PrismaService) {}

  /**
   * Evaluates the enterprise security policy for the given workspace.
   * Throws ForbiddenException if policies are violated.
   */
  async enforcePolicies(
    workspaceId: string,
    userId: string,
    authMethod: string,
    mfaVerified: boolean,
  ) {
    const policy = await this.prisma.workspaceSecurityPolicy.findUnique({
      where: { workspaceId },
    });

    if (!policy) return true; // No strict policies enforced by default

    if (policy.enforceSso && authMethod !== 'sso') {
      throw new ForbiddenException(
        'This workspace requires Single Sign-On (SSO). Please login via your Enterprise Identity Provider.',
      );
    }

    if (policy.requireMfa && !mfaVerified) {
      throw new ForbiddenException(
        'This workspace requires Multi-Factor Authentication (MFA). Please configure MFA in your account settings.',
      );
    }

    // In a full implementation, you would also check `sessionTimeoutMinutes` against the token's issue time (iat)
    // and validate the user's IP against `allowedDomains` or an IP allowlist.

    return true;
  }
}
