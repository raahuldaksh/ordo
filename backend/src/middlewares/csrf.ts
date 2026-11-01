import { Request, Response, NextFunction } from 'express';
import { generateCsrfToken } from '../utils/crypto.js';
import { sendError } from '../utils/response.js';
import { config } from '../config/env.js';

const SAFE_METHODS = ['GET', 'HEAD', 'OPTIONS'];

export function csrfProtection(req: Request, res: Response, next: NextFunction): void {
  // Ensure a CSRF token cookie exists
  let csrfToken = req.cookies.ordo_csrf_token;
  if (!csrfToken) {
    csrfToken = generateCsrfToken();
    res.cookie('ordo_csrf_token', csrfToken, {
      httpOnly: false, // Must be readable by client JavaScript to set X-CSRF-Token header
      secure: config.env === 'production' || config.cookieSameSite === 'none',
      sameSite: config.cookieSameSite,
      path: '/'
    });
  }

  // Safe HTTP read methods do not need CSRF mutation check
  if (SAFE_METHODS.includes(req.method)) {
    return next();
  }

  // If request has cookie authentication, enforce CSRF & Origin validation
  const hasCookieAuth = !!(req.cookies && req.cookies.ordo_access_token);
  if (hasCookieAuth) {
    // 1. Origin / Referer validation (PRD §7)
    const origin = req.headers.origin || req.headers.referer;
    if (origin) {
      try {
        const originUrl = new URL(origin);
        let configuredHost = '';
        try { configuredHost = new URL(config.frontendUrl).host; } catch {}
        const allowedHosts = [
          configuredHost,
          'ordo-dusky.vercel.app',
          'localhost:3000',
          '127.0.0.1:3000',
          ...config.allowedOrigins.map(u => {
            try { return new URL(u).host; } catch { return u; }
          })
        ].filter(Boolean);

        const isAllowed = allowedHosts.includes(originUrl.host) || (originUrl.host.endsWith('.vercel.app') && originUrl.host.includes('ordo'));

        if (!isAllowed) {
          sendError(res, 'CSRF_INVALID_ORIGIN', 'Origin validation failed for state-changing request', 403);
          return;
        }
      } catch {
        sendError(res, 'CSRF_MALFORMED_ORIGIN', 'Malformed Origin or Referer header', 403);
        return;
      }
    }

    // 2. Token header check
    const headerToken = req.headers['x-csrf-token'] as string;
    if (!headerToken || headerToken !== csrfToken) {
      sendError(res, 'CSRF_TOKEN_MISMATCH', 'Invalid or missing CSRF token. Request rejected.', 403);
      return;
    }
  }

  next();
}

