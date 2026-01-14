/**
 * Security Headers Utility
 * Functions for applying security headers to responses
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSecurityHeaders, securityConfig } from "./config";

/**
 * Apply security headers to a NextResponse
 */
export function applySecurityHeaders(response: NextResponse): NextResponse {
  const headers = getSecurityHeaders();

  for (const [key, value] of Object.entries(headers)) {
    response.headers.set(key, value);
  }

  return response;
}

/**
 * Check if origin is allowed (CORS)
 */
export function isOriginAllowed(origin: string | null): boolean {
  if (!origin) return true; // Same-origin requests don't have origin header

  return securityConfig.allowedOrigins.some(
    (allowed) => allowed === origin || allowed === "*"
  );
}

/**
 * Get CORS headers for API responses
 */
export function getCORSHeaders(request: NextRequest): Record<string, string> {
  const origin = request.headers.get("origin");

  if (!origin || !isOriginAllowed(origin)) {
    return {};
  }

  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-CSRF-Token",
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Max-Age": "86400", // 24 hours
  };
}

/**
 * Create a secure response with all security headers
 */
export function createSecureResponse(
  body: unknown,
  init?: ResponseInit
): NextResponse {
  const response = NextResponse.json(body, init);
  return applySecurityHeaders(response);
}

/**
 * Handle preflight OPTIONS requests
 */
export function handlePreflight(request: NextRequest): NextResponse {
  const corsHeaders = getCORSHeaders(request);
  const response = new NextResponse(null, { status: 204 });

  for (const [key, value] of Object.entries(corsHeaders)) {
    response.headers.set(key, value);
  }

  return response;
}
