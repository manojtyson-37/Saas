import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { TenantContext } from '../tenant-context';

export interface AccessTokenPayload {
  sub: string; // user id
  tid: string; // tenant id
  email: string;
  own: boolean; // isTenantOwner
  trm?: string; // terminal id, for POS sessions
}

/**
 * Global authentication guard. Verifies the bearer token, attaches the
 * principal to the request and populates TenantContext for the handler.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<Request>();
    const header = request.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing bearer token');
    }

    let payload: AccessTokenPayload;
    try {
      payload = await this.jwt.verifyAsync<AccessTokenPayload>(header.slice(7));
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }

    (request as Request & { user: unknown }).user = {
      userId: payload.sub,
      tenantId: payload.tid,
      email: payload.email,
      isTenantOwner: payload.own,
    };

    const ctx = TenantContext.get();
    if (ctx) {
      ctx.tenantId = payload.tid;
      ctx.userId = payload.sub;
      ctx.terminalId = payload.trm;
      ctx.ip = request.ip;
    }

    return true;
  }
}
