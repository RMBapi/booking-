import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let errorDetails: any = null;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      
      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object') {
        message = (exceptionResponse as any).message || message;
        errorDetails = exceptionResponse;
      }
    } else if (exception instanceof Error) {
      message = exception.message;
      errorDetails = {
        name: exception.name,
        stack: process.env.NODE_ENV !== 'production' ? exception.stack : undefined,
      };
    }

    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message,
      ...(errorDetails && Object.keys(errorDetails).length > 0 && { error: errorDetails }),
    };

    // Log error with context
    const logMessage = `${request.method} ${request.url} - ${status} - ${message}`;
    
    if (status >= 500) {
      this.logger.error(
        logMessage,
        exception instanceof Error ? exception.stack : undefined,
        {
          url: request.url,
          method: request.method,
          status,
          body: request.body,
          query: request.query,
          params: request.params,
          user: (request as any).user?.id || 'anonymous',
        },
      );
    } else if (status >= 400) {
      this.logger.warn(logMessage, {
        url: request.url,
        method: request.method,
        status,
        user: (request as any).user?.id || 'anonymous',
      });
    }

    response.status(status).json(errorResponse);
  }
}
