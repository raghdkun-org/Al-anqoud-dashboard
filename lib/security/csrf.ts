/**
 * CSRF Protection
 * Cross-Site Request Forgery prevention utilities
 */

import { securityConfig } from "./config";
import type { CSRFToken } from "./types";

const CSRF_COOKIE_NAME = "csrf-token";
const CSRF_HEADER_NAME = "x-csrf-token";
const CSRF_STORAGE_KEY = "csrf-token-data";

/**
 * Generate a cryptographically secure random token
 */
export function generateCSRFToken(): string {
  if (typeof window !== "undefined" && window.crypto) {
    const array = new Uint8Array(32);
    window.crypto.getRandomValues(array);
    return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join(
      ""
    );
  }
  // Fallback for server-side (should use crypto module in production)
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

/**
 * Create a new CSRF token with expiry
 */
export function createCSRFToken(): CSRFToken {
  return {
    token: generateCSRFToken(),
    expiresAt: Date.now() + securityConfig.csrfTokenExpiry,
  };
}

/**
 * Store CSRF token in client storage
 */
export function storeCSRFToken(tokenData: CSRFToken): void {
  if (typeof window === "undefined") return;

  try {
    sessionStorage.setItem(CSRF_STORAGE_KEY, JSON.stringify(tokenData));
  } catch {
    // Storage not available
  }
}

/**
 * Get stored CSRF token
 */
export function getStoredCSRFToken(): CSRFToken | null {
  if (typeof window === "undefined") return null;

  try {
    const stored = sessionStorage.getItem(CSRF_STORAGE_KEY);
    if (!stored) return null;

    const tokenData: CSRFToken = JSON.parse(stored);

    // Check if token is expired
    if (tokenData.expiresAt < Date.now()) {
      sessionStorage.removeItem(CSRF_STORAGE_KEY);
      return null;
    }

    return tokenData;
  } catch {
    return null;
  }
}

/**
 * Get or create CSRF token for requests
 */
export function getCSRFToken(): string {
  let tokenData = getStoredCSRFToken();

  if (!tokenData) {
    tokenData = createCSRFToken();
    storeCSRFToken(tokenData);
  }

  return tokenData.token;
}

/**
 * Validate CSRF token from request
 */
export function validateCSRFToken(
  requestToken: string | null,
  storedToken: string | null
): boolean {
  if (!securityConfig.csrfEnabled) return true;
  if (!requestToken || !storedToken) return false;

  // Constant-time comparison to prevent timing attacks
  if (requestToken.length !== storedToken.length) return false;

  let result = 0;
  for (let i = 0; i < requestToken.length; i++) {
    result |= requestToken.charCodeAt(i) ^ storedToken.charCodeAt(i);
  }

  return result === 0;
}

/**
 * Get CSRF header name
 */
export function getCSRFHeaderName(): string {
  return CSRF_HEADER_NAME;
}

/**
 * Get CSRF cookie name
 */
export function getCSRFCookieName(): string {
  return CSRF_COOKIE_NAME;
}

/**
 * Add CSRF token to request headers
 */
export function addCSRFHeader(
  headers: Headers | Record<string, string>
): Headers | Record<string, string> {
  const token = getCSRFToken();

  if (headers instanceof Headers) {
    headers.set(CSRF_HEADER_NAME, token);
    return headers;
  }

  return {
    ...headers,
    [CSRF_HEADER_NAME]: token,
  };
}
