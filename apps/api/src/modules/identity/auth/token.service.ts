import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { createHash, randomBytes } from 'node:crypto';
import { PrismaService } from '../../../common/prisma.service';
import type { AccessTokenPayload } from '../../../common/guards/jwt-auth.guard';

export interface IssuedTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number; // access token TTL in seconds
}

interface TokenSubject {
  userId: string;
  tenantId: string;
  email: string;
  isTenantOwner: boolean;
  terminalId?: string;
}

/**
 * Access tokens are short-lived JWTs. Refresh tokens are opaque random
 * secrets stored hashed (sha256) per device session and rotated on use;
 * reuse of a rotated token revokes the whole session (theft signal).
 */
@Injectable()
export class TokenService {
  private readonly accessTtlSeconds: number;
  private readonly refreshTtlMs: number;

  constructor(
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
    config: ConfigService,
  ) {
    this.accessTtlSeconds = parseTtlSeconds(config.get('JWT_ACCESS_TTL', '600s'));
    this.refreshTtlMs = parseTtlSeconds(config.get('JWT_REFRESH_TTL', '30d')) * 1000;
  }

  async issue(subject: TokenSubject, meta?: { userAgent?: string; ip?: string }): Promise<IssuedTokens> {
    const payload: AccessTokenPayload = {
      sub: subject.userId,
      tid: subject.tenantId,
      email: subject.email,
      own: subject.isTenantOwner,
      ...(subject.terminalId ? { trm: subject.terminalId } : {}),
    };
    const accessToken = await this.jwt.signAsync(payload, {
      expiresIn: this.accessTtlSeconds,
    });

    const refreshToken = randomBytes(48).toString('base64url');
    await this.prisma.refreshSession.create({
      data: {
        tenantId: subject.tenantId,
        userId: subject.userId,
        tokenHash: sha256(refreshToken),
        userAgent: meta?.userAgent?.slice(0, 400),
        ip: meta?.ip,
        terminalId: subject.terminalId,
        expiresAt: new Date(Date.now() + this.refreshTtlMs),
      },
    });

    return { accessToken, refreshToken, expiresIn: this.accessTtlSeconds };
  }

  /** Rotates the refresh token: validates, revokes the old session, issues new tokens. */
  async rotate(refreshToken: string, meta?: { userAgent?: string; ip?: string }): Promise<IssuedTokens> {
    const session = await this.prisma.refreshSession.findUnique({
      where: { tokenHash: sha256(refreshToken) },
      include: { user: true },
    });

    if (!session || session.revokedAt || session.expiresAt < new Date()) {
      // Reuse of a rotated/expired token: revoke everything for that user
      // if we can attribute it — conservative response to possible theft.
      if (session?.revokedAt) {
        await this.prisma.refreshSession.updateMany({
          where: { userId: session.userId, revokedAt: null },
          data: { revokedAt: new Date() },
        });
      }
      throw new UnauthorizedException('Invalid refresh token');
    }
    if (session.user.status !== 'ACTIVE' || session.user.deletedAt) {
      throw new UnauthorizedException('Account is not active');
    }

    await this.prisma.refreshSession.update({
      where: { id: session.id },
      data: { revokedAt: new Date() },
    });

    return this.issue(
      {
        userId: session.user.id,
        tenantId: session.user.tenantId,
        email: session.user.email,
        isTenantOwner: session.user.isTenantOwner,
        terminalId: session.terminalId ?? undefined,
      },
      meta,
    );
  }

  async revoke(refreshToken: string): Promise<void> {
    await this.prisma.refreshSession.updateMany({
      where: { tokenHash: sha256(refreshToken), revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
}

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

function parseTtlSeconds(ttl: string): number {
  const match = /^(\d+)([smhd])?$/.exec(ttl.trim());
  if (!match) throw new Error(`Invalid TTL: ${ttl}`);
  const value = Number(match[1]);
  const unit = match[2] ?? 's';
  const multiplier = { s: 1, m: 60, h: 3600, d: 86400 }[unit as 's' | 'm' | 'h' | 'd'];
  return value * multiplier;
}
