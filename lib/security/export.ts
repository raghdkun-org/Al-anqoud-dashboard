/**
 * Security Export Utilities
 * Export security audit results and events in various formats
 */

import type { SecurityAuditResult, SecurityEvent, SecurityCheck } from "./types";

/**
 * Export audit result as JSON
 */
export function exportAuditAsJSON(result: SecurityAuditResult): string {
  return JSON.stringify(result, null, 2);
}

/**
 * Export security events as JSON
 */
export function exportEventsAsJSON(events: SecurityEvent[]): string {
  return JSON.stringify(events, null, 2);
}

/**
 * Export audit result as CSV
 */
export function exportAuditAsCSV(result: SecurityAuditResult): string {
  const headers = [
    "ID",
    "Name",
    "Category",
    "Level",
    "Status",
    "Details",
    "Recommendation",
  ];

  const rows = result.checks.map((check) => [
    check.id,
    check.name,
    check.category,
    check.level,
    check.status,
    `"${(check.details || "").replace(/"/g, '""')}"`,
    `"${(check.recommendation || "").replace(/"/g, '""')}"`,
  ]);

  return [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
}

/**
 * Export security events as CSV
 */
export function exportEventsAsCSV(events: SecurityEvent[]): string {
  const headers = ["ID", "Type", "Level", "Message", "Source", "Timestamp"];

  const rows = events.map((event) => [
    event.id,
    event.type,
    event.level,
    `"${event.message.replace(/"/g, '""')}"`,
    event.source || "",
    new Date(event.timestamp).toISOString(),
  ]);

  return [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
}

/**
 * Get status emoji for markdown
 */
function getStatusEmoji(status: string): string {
  switch (status) {
    case "pass":
      return "✅";
    case "fail":
      return "❌";
    case "warning":
      return "⚠️";
    default:
      return "❓";
  }
}

/**
 * Get level badge for markdown
 */
function getLevelBadge(level: string): string {
  switch (level) {
    case "critical":
      return "🔴 Critical";
    case "high":
      return "🟠 High";
    case "medium":
      return "🟡 Medium";
    case "low":
      return "🔵 Low";
    default:
      return "⚪ Info";
  }
}

/**
 * Export audit result as Markdown
 */
export function exportAuditAsMarkdown(result: SecurityAuditResult): string {
  const timestamp = new Date(result.timestamp).toLocaleString();
  const scoreEmoji =
    result.overallScore >= 80
      ? "🟢"
      : result.overallScore >= 60
        ? "🟡"
        : result.overallScore >= 40
          ? "🟠"
          : "🔴";

  let md = `# Security Audit Report\n\n`;
  md += `**Generated:** ${timestamp}\n\n`;
  md += `## Overall Score\n\n`;
  md += `${scoreEmoji} **${result.overallScore}/100**\n\n`;
  md += `| Status | Count |\n`;
  md += `|--------|-------|\n`;
  md += `| ✅ Passed | ${result.summary.passed} |\n`;
  md += `| ⚠️ Warnings | ${result.summary.warnings} |\n`;
  md += `| ❌ Failed | ${result.summary.failed} |\n`;
  md += `| ❓ Unknown | ${result.summary.unknown} |\n\n`;

  md += `## Security Checks\n\n`;

  // Group checks by category
  const categories = [...new Set(result.checks.map((c) => c.category))];

  for (const category of categories) {
    const categoryChecks = result.checks.filter((c) => c.category === category);
    md += `### ${category.charAt(0).toUpperCase() + category.slice(1).replace("-", " ")}\n\n`;

    for (const check of categoryChecks) {
      md += `#### ${getStatusEmoji(check.status)} ${check.name}\n\n`;
      md += `- **Level:** ${getLevelBadge(check.level)}\n`;
      md += `- **Status:** ${check.status.toUpperCase()}\n`;
      md += `- **Description:** ${check.description}\n`;
      if (check.details) {
        md += `- **Details:** ${check.details}\n`;
      }
      if (check.recommendation) {
        md += `- **Recommendation:** ${check.recommendation}\n`;
      }
      md += `\n`;
    }
  }

  return md;
}

/**
 * Export security events as Markdown
 */
export function exportEventsAsMarkdown(events: SecurityEvent[]): string {
  if (events.length === 0) {
    return `# Security Events\n\nNo security events recorded.\n`;
  }

  let md = `# Security Events\n\n`;
  md += `**Total Events:** ${events.length}\n\n`;
  md += `| Time | Level | Type | Message |\n`;
  md += `|------|-------|------|--------|\n`;

  for (const event of events) {
    const time = new Date(event.timestamp).toLocaleTimeString();
    md += `| ${time} | ${getLevelBadge(event.level)} | ${event.type} | ${event.message} |\n`;
  }

  return md;
}

/**
 * Download content as file
 */
export function downloadFile(
  content: string,
  filename: string,
  mimeType: string
): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export security audit in specified format
 */
export function exportSecurityAudit(
  result: SecurityAuditResult,
  format: "json" | "csv" | "markdown"
): void {
  const timestamp = new Date().toISOString().split("T")[0];
  let content: string;
  let filename: string;
  let mimeType: string;

  switch (format) {
    case "json":
      content = exportAuditAsJSON(result);
      filename = `security-audit-${timestamp}.json`;
      mimeType = "application/json";
      break;
    case "csv":
      content = exportAuditAsCSV(result);
      filename = `security-audit-${timestamp}.csv`;
      mimeType = "text/csv";
      break;
    case "markdown":
      content = exportAuditAsMarkdown(result);
      filename = `security-audit-${timestamp}.md`;
      mimeType = "text/markdown";
      break;
  }

  downloadFile(content, filename, mimeType);
}

/**
 * Export security events in specified format
 */
export function exportSecurityEvents(
  events: SecurityEvent[],
  format: "json" | "csv" | "markdown"
): void {
  const timestamp = new Date().toISOString().split("T")[0];
  let content: string;
  let filename: string;
  let mimeType: string;

  switch (format) {
    case "json":
      content = exportEventsAsJSON(events);
      filename = `security-events-${timestamp}.json`;
      mimeType = "application/json";
      break;
    case "csv":
      content = exportEventsAsCSV(events);
      filename = `security-events-${timestamp}.csv`;
      mimeType = "text/csv";
      break;
    case "markdown":
      content = exportEventsAsMarkdown(events);
      filename = `security-events-${timestamp}.md`;
      mimeType = "text/markdown";
      break;
  }

  downloadFile(content, filename, mimeType);
}

/**
 * Copy content to clipboard
 */
export async function copyToClipboard(content: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(content);
    return true;
  } catch {
    return false;
  }
}
