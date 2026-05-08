import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';

const SENSITIVE_FIELDS = new Set([
  'password',
  'passwordHash',
  'token',
  'accessToken',
  'refreshToken',
  'authorization',
]);

interface ErrorDetails {
  name?: string;
  stack?: string;
  message?: string | string[];
  [key: string]: unknown;
}

interface ErrorResponseBody {
  statusCode: number;
  timestamp: string;
  path: string;
  method: string;
  message: string | string[];
  error?: ErrorDetails;
}

function redactBody(body: unknown): unknown {
  if (!body || typeof body !== 'object') return body;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(body as Record<string, unknown>)) {
    out[k] = SENSITIVE_FIELDS.has(k) ? '***REDACTED***' : v;
  }
  return out;
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const isProd = process.env.NODE_ENV === 'production';

    let status: number = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Internal server error';
    let errorDetails: ErrorDetails | null = null;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (exceptionResponse && typeof exceptionResponse === 'object') {
        const r = exceptionResponse as ErrorDetails;
        if (r.message !== undefined) message = r.message;
        errorDetails = r;
      }
    } else if (exception instanceof Error) {
      // 5xx: return a generic message to the client; full detail is logged.
      message = isProd ? 'Internal server error' : exception.message;
      errorDetails = isProd
        ? null
        : { name: exception.name, stack: exception.stack };
    }

    const errorResponse: ErrorResponseBody = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message,
      ...(errorDetails && Object.keys(errorDetails).length > 0
        ? { error: errorDetails }
        : {}),
    };

    const userId =
      (request as { user?: { id?: string } }).user?.id ?? 'anonymous';
    const logMessage = `${request.method} ${request.url} - ${status} - ${
      Array.isArray(message) ? message.join(', ') : message
    }`;

    if (status >= 500) {
      this.logger.error(
        logMessage,
        exception instanceof Error ? exception.stack : undefined,
        {
          url: request.url,
          method: request.method,
          status,
          body: redactBody(request.body),
          query: request.query,
          params: request.params,
          user: userId,
        },
      );
    } else if (status >= 400) {
      this.logger.warn(logMessage, {
        url: request.url,
        method: request.method,
        status,
        user: userId,
      });
    }

    response.status(status).json(errorResponse);
  }
}
