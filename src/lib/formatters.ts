// AX — Output Formatters
// Format diagnostic reports for clipboard copy

import type { DiagnosticReport } from './types';

export function formatMarkdown(report: DiagnosticReport): string {
    const lines: string[] = [];

    lines.push(`# AX Diagnostic Report`);
    lines.push(`**URL:** ${report.capture.url}`);
    lines.push(`**Time:** ${new Date(report.timestamp).toLocaleString()}`);
    lines.push('');
    lines.push(report.summary);
    lines.push('');
    lines.push(`---`);
    lines.push(`*🤖 Paste this report into your AI coding agent (Cursor, Copilot, Claude) to quickly resolve these issues.*`);

    return lines.join('\n');
}

export function formatCompact(report: DiagnosticReport): string {
    const lines: string[] = [];
    lines.push(`AX Report: ${report.capture.url}`);
    lines.push(report.summary);
    lines.push('');
    lines.push(`---`);
    lines.push(`*🤖 Paste this report into your AI coding agent (Cursor, Copilot, Claude) to quickly resolve these issues.*`);

    return lines.join('\n');
}

export function formatJSON(report: DiagnosticReport): string {
    return JSON.stringify(report, null, 2);
}
