import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const BusinessId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    // This should be extracted from the request (e.g., from headers, JWT token, etc.)
    // For now, returning a placeholder - you'll need to implement the actual logic
    // based on your authentication/authorization setup
    return request.businessId || request.headers['x-business-id'] || '';
  },
);
