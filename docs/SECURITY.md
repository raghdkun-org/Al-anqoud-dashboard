# Security Implementation

## Overview

This document describes the security measures implemented in the B-Dashboard project to protect against common web vulnerabilities.

---

## 1. Security Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Next.js Config                          │
│  - Security Headers (CSP, HSTS, X-Frame-Options, etc.)      │
│  - Powered-by header disabled                                │
├─────────────────────────────────────────────────────────────┤
│                      Proxy Layer                             │
│  - Locale routing and detection                              │
│  - Request validation (future: auth checks)                  │
├─────────────────────────────────────────────────────────────┤
│                   API Layer (axios-client)                   │
│  - CSRF token injection                                      │
│  - Auth token management                                     │
│  - Security event logging                                    │
├─────────────────────────────────────────────────────────────┤
│                   Security Module (lib/security)             │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────────┐│
│  │   Config    │ │    CSRF     │ │      Sanitization       ││
│  │   Headers   │ │  Protection │ │        XSS Prev.        ││
│  └─────────────┘ └─────────────┘ └─────────────────────────┘│
│  ┌─────────────────────────────────────────────────────────┐│
│  │                   Security Audit                         ││
│  │   Runtime checks, Event logging, Score calculation       ││
│  └─────────────────────────────────────────────────────────┘│
├─────────────────────────────────────────────────────────────┤
│               Security Monitor (Dev Tool)                    │
│  - Visual security audit dashboard                           │
│  - Real-time security event monitoring                       │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Security Headers

All responses include the following security headers (configured in `next.config.ts`):

| Header | Value | Purpose |
|--------|-------|---------|
| `X-Frame-Options` | `SAMEORIGIN` | Prevents clickjacking attacks |
| `X-Content-Type-Options` | `nosniff` | Prevents MIME type sniffing |
| `X-XSS-Protection` | `1; mode=block` | Enables browser XSS filter |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Controls referrer information |
| `Permissions-Policy` | Restrictive | Disables unused browser features |
| `Strict-Transport-Security` | `max-age=31536000` | Enforces HTTPS (production only) |
| `Content-Security-Policy` | See below | Prevents XSS and injection attacks |

### Content Security Policy (CSP)

```
default-src 'self';
script-src 'self' 'unsafe-inline' [+ 'unsafe-eval' in dev];
style-src 'self' 'unsafe-inline';
img-src 'self' data: blob: https:;
font-src 'self' data:;
connect-src 'self' [+ ws://localhost:3000 in dev];
frame-src 'self';
object-src 'none';
base-uri 'self';
form-action 'self';
frame-ancestors 'self';
upgrade-insecure-requests [production only]
```

---

## 3. CSRF Protection

### How It Works

1. **Token Generation**: Cryptographically secure tokens are generated using `crypto.getRandomValues()`
2. **Token Storage**: Tokens are stored in `sessionStorage` with expiration
3. **Request Injection**: CSRF tokens are automatically added to mutating requests (POST, PUT, PATCH, DELETE)
4. **Validation**: Server-side validation using constant-time comparison

### Usage

```typescript
import { getCSRFToken, getCSRFHeaderName } from "@/lib/security/csrf";

// Token is automatically added by axios interceptor
// For custom fetch requests:
fetch("/api/endpoint", {
  method: "POST",
  headers: {
    [getCSRFHeaderName()]: getCSRFToken(),
  },
});
```

---

## 4. Input Sanitization

### Available Functions

```typescript
import {
  sanitizeString,     // Remove XSS patterns
  sanitizeObject,     // Recursively sanitize objects
  escapeHtml,         // Escape HTML entities
  stripHtml,          // Remove HTML tags
  detectXSSPatterns,  // Check for XSS attempts
  isValidRedirectUrl, // Prevent open redirects
} from "@/lib/security/sanitize";
```

### Example

```typescript
// Sanitize user input
const cleanInput = sanitizeString(userInput);

// Validate redirect URLs
if (isValidRedirectUrl(redirectUrl)) {
  router.push(redirectUrl);
} else {
  router.push("/dashboard");
}
```

---

## 5. Authentication Security

### Current Implementation

- **Token Storage**: localStorage with Zustand persist (see recommendation below)
- **Token Injection**: Axios request interceptor adds Bearer token
- **401 Handling**: Automatic logout and locale-aware redirect
- **CSRF**: All mutating requests include CSRF token

### Recommended Production Improvements

1. **HttpOnly Cookies**: Store tokens in HttpOnly cookies set by the server
2. **Token Refresh**: Implement token refresh before expiration
3. **Secure Flag**: Ensure cookies have Secure flag in production

---

## 6. Security Audit System

### Running Audits

```typescript
import { runSecurityAudit } from "@/lib/security/audit";

const result = runSecurityAudit();
console.log(result.overallScore); // 0-100
console.log(result.checks);       // Array of security checks
```

### Security Checks Performed

| Check | Category | Level | Description |
|-------|----------|-------|-------------|
| HTTPS Enabled | Configuration | Critical | Verifies HTTPS in production |
| Secure Cookies | Cookies | High | Checks HttpOnly flag on sensitive cookies |
| localStorage Security | Storage | High | Detects tokens in localStorage |
| CSP Configuration | Headers | High | Validates CSP settings |
| Security Headers | Headers | Medium | Verifies essential headers |
| CSRF Protection | CSRF | High | Confirms CSRF is enabled |
| Rate Limiting | Configuration | Medium | Checks rate limit config |
| Input Sanitization | Validation | High | Verifies sanitization is enabled |
| Token Storage | Authentication | High | Reviews token storage method |
| Console Exposure | Configuration | Low | Checks for debug logging |

### Event Logging

```typescript
import { logSecurityEvent, getSecurityEvents } from "@/lib/security/audit";

// Log a security event
logSecurityEvent("auth_failure", "medium", "Invalid login attempt", {
  email: "user@example.com",
  ip: request.ip,
});

// Retrieve events
const events = getSecurityEvents(50);
```

---

## 7. Security Monitor Dev Tool

Access the security monitor at: `/{locale}/dashboard/dev-tools/security`

### Features

- **Security Score**: Overall security posture rating (0-100)
- **Check Results**: Detailed pass/fail status for each security check
- **Recommendations**: Actionable fixes for failed checks
- **Event Log**: Real-time security event monitoring
- **Auto-refresh**: Live updates every 5 seconds (optional)

### Screenshot
The security monitor displays:
- Overall security score with visual indicator
- Summary of passed, failed, and warning checks
- Detailed cards for each security check
- Expandable event log with filtering

---

## 8. File Structure

```
lib/security/
├── index.ts         # Barrel exports
├── types.ts         # TypeScript interfaces
├── config.ts        # Security configuration
├── headers.ts       # Header utilities
├── csrf.ts          # CSRF protection
├── sanitize.ts      # Input sanitization
└── audit.ts         # Security auditing

components/security/
├── index.ts
└── security-monitor.tsx  # Dev tool component

app/[locale]/(dashboard)/dashboard/dev-tools/security/
├── page.tsx
└── dashboard-content.tsx
```

---

## 9. Security Checklist

### Development

- [x] Security headers configured
- [x] CSP policy defined
- [x] CSRF protection implemented
- [x] Input sanitization utilities
- [x] Security audit system
- [x] Security monitor dev tool
- [x] Security event logging

### Production Recommendations

- [ ] Enable HttpOnly cookie token storage
- [ ] Implement server-side CSRF validation
- [ ] Add rate limiting middleware
- [ ] Configure security monitoring/alerting
- [ ] Implement IP-based blocking
- [ ] Add audit logging to external service
- [ ] Regular dependency security audits

---

## 10. Dependencies

No additional dependencies required. The security module uses:
- Native Web Crypto API for token generation
- Next.js built-in headers configuration
- Axios interceptors for request/response handling

---

## 11. Related Documentation

- [ADR-0002: API Layer](./ADR/0002-api-layer.md)
- [Backend Integration](./BACKEND-INTEGRATION.md)
- [Developer Guide](./DEVELOPER-GUIDE.md)
