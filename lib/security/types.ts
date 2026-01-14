/**
 * Security Types
 * Type definitions for the security module
 */

export type SecurityLevel = "critical" | "high" | "medium" | "low" | "info";

export interface SecurityCheck {
  id: string;
  name: string;
  description: string;
  category: SecurityCategory;
  status: "pass" | "fail" | "warning" | "unknown";
  level: SecurityLevel;
  details?: string;
  recommendation?: string;
  timestamp: number;
}

export type SecurityCategory =
  | "authentication"
  | "authorization"
  | "headers"
  | "input-validation"
  | "csrf"
  | "xss"
  | "configuration"
  | "dependencies"
  | "cookies"
  | "storage";

export interface SecurityAuditResult {
  timestamp: number;
  overallScore: number;
  checks: SecurityCheck[];
  summary: {
    passed: number;
    failed: number;
    warnings: number;
    unknown: number;
  };
}

export interface CSRFToken {
  token: string;
  expiresAt: number;
}

export interface SecurityConfig {
  csrfEnabled: boolean;
  csrfTokenExpiry: number; // milliseconds
  sanitizeInputs: boolean;
  logSecurityEvents: boolean;
  allowedOrigins: string[];
  maxRequestSize: number;
  rateLimiting: {
    enabled: boolean;
    maxRequests: number;
    windowMs: number;
  };
}

export interface SecurityEvent {
  id: string;
  type: SecurityEventType;
  level: SecurityLevel;
  message: string;
  details?: Record<string, unknown>;
  timestamp: number;
  source?: string;
}

export type SecurityEventType =
  | "auth_success"
  | "auth_failure"
  | "csrf_violation"
  | "xss_attempt"
  | "rate_limit"
  | "invalid_input"
  | "unauthorized_access"
  | "suspicious_activity"
  | "config_change";

export interface ContentSecurityPolicy {
  "default-src": string[];
  "script-src": string[];
  "style-src": string[];
  "img-src": string[];
  "font-src": string[];
  "connect-src": string[];
  "frame-src": string[];
  "object-src": string[];
  "base-uri": string[];
  "form-action": string[];
  "frame-ancestors": string[];
  "upgrade-insecure-requests"?: boolean;
}
