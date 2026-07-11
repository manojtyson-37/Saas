import { Injectable, NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { TenantContext } from '../tenant-context';

/**
 * Opens an AsyncLocalStorage scope for every request so guards and services
 * can read/write the request context without passing it through arguments.
 */
@Injectable()
export class RequestContextMiddleware implements NestMiddleware {
  use(req: Request, _res: Response, next: NextFunction): void {
    TenantContext.run({ ip: req.ip }, () => next());
  }
}
