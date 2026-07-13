import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';

/**
 * Normalizes every error to the documented envelope:
 * { statusCode, error, message, details?, traceId }
 */
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const traceId = randomTraceId();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const body = exception.getResponse();
      const normalized =
        typeof body === 'string'
          ? { message: body }
          : (body as Record<string, unknown>);

      response.status(status).json({
        statusCode: status,
        error: normalized.error ?? exception.name,
        message: normalized.message ?? exception.message,
        code: normalized.code,
        details: normalized.details,
        traceId,
      });
      return;
    }

    this.logger.error(
      `Unhandled exception [${traceId}]: ${exception instanceof Error ? exception.stack : String(exception)}`,
    );
    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      error: 'InternalServerError',
      message: 'Something went wrong. The error has been logged.',
      traceId,
    });
  }
}

function randomTraceId(): string {
  return Math.random().toString(16).slice(2, 10) + Date.now().toString(16);
}
