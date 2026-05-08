import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class LoggingMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(req: Request, res: Response, next: NextFunction) {
    const { method, originalUrl, ip } = req;
    const userAgent = req.get('user-agent') || '';
    const startTime = Date.now();

    // Log request
    this.logger.log(
      `→ ${method} ${originalUrl} - IP: ${ip} - User-Agent: ${userAgent}`,
    );

    // Log request body (excluding sensitive data)
    if (req.body && Object.keys(req.body).length > 0) {
      const sanitizedBody = this.sanitizeBody(req.body);
      this.logger.debug(`Request Body: ${JSON.stringify(sanitizedBody)}`);
    }

    // Log response
    res.on('finish', () => {
      const { statusCode } = res;
      const contentLength = res.get('content-length');
      const duration = Date.now() - startTime;

      const logMessage = `← ${method} ${originalUrl} ${statusCode} - ${duration}ms - ${contentLength || 0}b`;

      if (statusCode >= 500) {
        this.logger.error(logMessage);
      } else if (statusCode >= 400) {
        this.logger.warn(logMessage);
      } else {
        this.logger.log(logMessage);
      }
    });

    next();
  }

  private sanitizeBody(body: any): any {
    const sensitiveFields = [
      'password',
      'passwordHash',
      'token',
      'accessToken',
      'refreshToken',
    ];
    const sanitized = { ...body };

    for (const field of sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = '***REDACTED***';
      }
    }

    return sanitized;
  }
}
