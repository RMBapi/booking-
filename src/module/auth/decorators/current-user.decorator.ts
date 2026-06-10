import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Shape of `req.user` after JwtStrategy.validate(). Mirrors the projection
 * in jwt.strategy.ts — keep them in sync.
 */
export interface JwtUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  isActive: boolean;
  systemRole: string;
  /** Present on customer sessions — scopes data to one business. */
  businessId?: string;
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): JwtUser | undefined => {
    const request = ctx.switchToHttp().getRequest<{ user?: JwtUser }>();
    return request.user;
  },
);
