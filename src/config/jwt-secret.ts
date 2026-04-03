/** Throws at startup if signing/verifying JWTs would use a weak or missing secret. */
export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET?.trim();
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is required');
  }
  return secret;
}
