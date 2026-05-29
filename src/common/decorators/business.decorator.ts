import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const BusinessId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest<{
      businessId?: string;
      headers?: Record<string, string | string[] | undefined>;
    }>();
    const header = request.headers?.['x-business-id'];
    const fromHeader = Array.isArray(header) ? header[0] : header;
    return request.businessId ?? fromHeader ?? '';
  },
);
