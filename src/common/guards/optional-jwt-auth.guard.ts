import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Like JwtAuthGuard, but never rejects the request. If a valid Bearer token
 * is present, `req.user` is populated; otherwise the handler runs with no
 * user. Used by the public Contact-Us submit endpoints so a single route can
 * serve both logged-out guests (who supply name/email/phone) and logged-in
 * users (whose profile is read from the token).
 *
 * Apply at the route level with `@UseGuards(OptionalJwtAuthGuard)` together
 * with `@Public()` so the global JwtAuthGuard skips its mandatory check.
 */
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  // Swallow the "no/invalid token" error instead of throwing 401.
  handleRequest<TUser = unknown>(_err: unknown, user: TUser): TUser {
    return (user || undefined) as TUser;
  }

  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }
}
