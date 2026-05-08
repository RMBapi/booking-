import {
  REFRESH_COOKIE_NAME,
  clearRefreshCookie,
  readCookie,
  setRefreshCookie,
} from './cookies';

function makeRes() {
  const headers: Record<string, string | string[]> = {};
  return {
    headers,
    setHeader(name: string, value: string | string[]) {
      headers[name] = value;
    },
    getHeader(name: string) {
      return headers[name];
    },
  } as any;
}

describe('cookies', () => {
  describe('readCookie', () => {
    it('returns the value when present', () => {
      const req = { headers: { cookie: 'a=1; cb_rt=foo; b=2' } } as any;
      expect(readCookie(req, REFRESH_COOKIE_NAME)).toBe('foo');
    });

    it('decodes URI-encoded values', () => {
      const req = { headers: { cookie: 'cb_rt=hello%2Bworld' } } as any;
      expect(readCookie(req, REFRESH_COOKIE_NAME)).toBe('hello+world');
    });

    it('returns undefined when missing', () => {
      const req = { headers: { cookie: 'a=1' } } as any;
      expect(readCookie(req, REFRESH_COOKIE_NAME)).toBeUndefined();
    });

    it('returns undefined when no cookie header at all', () => {
      const req = { headers: {} } as any;
      expect(readCookie(req, REFRESH_COOKIE_NAME)).toBeUndefined();
    });
  });

  describe('setRefreshCookie', () => {
    it('writes an HttpOnly cookie with Max-Age and SameSite=Lax', () => {
      const res = makeRes();
      setRefreshCookie(res, 'tok', { maxAgeSeconds: 60 });
      const header = String(res.getHeader('Set-Cookie'));
      expect(header).toContain('cb_rt=tok');
      expect(header).toContain('HttpOnly');
      expect(header).toContain('Max-Age=60');
      expect(header).toContain('SameSite=Lax');
    });

    it('appends a Secure flag when NODE_ENV=production', () => {
      const orig = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      try {
        const res = makeRes();
        setRefreshCookie(res, 'tok', { maxAgeSeconds: 60 });
        expect(String(res.getHeader('Set-Cookie'))).toContain('Secure');
      } finally {
        process.env.NODE_ENV = orig;
      }
    });

    it('does not clobber existing Set-Cookie headers', () => {
      const res = makeRes();
      res.setHeader('Set-Cookie', 'other=1; Path=/');
      setRefreshCookie(res, 'tok', { maxAgeSeconds: 60 });
      const header = res.getHeader('Set-Cookie');
      expect(Array.isArray(header)).toBe(true);
      expect(header).toHaveLength(2);
      expect(header[0]).toContain('other=1');
      expect(header[1]).toContain('cb_rt=tok');
    });
  });

  describe('clearRefreshCookie', () => {
    it('writes a Max-Age=0 cookie to delete', () => {
      const res = makeRes();
      clearRefreshCookie(res);
      expect(String(res.getHeader('Set-Cookie'))).toContain('cb_rt=;');
      expect(String(res.getHeader('Set-Cookie'))).toContain('Max-Age=0');
    });
  });
});
