import type { MapValidationResult } from '@domain/types/MapValidation';

export function formatValidationReport(result: MapValidationResult): string {
  const lines: string[] = [];

  for (const file of result.files) {
    const symbol = file.passed ? '✓' : '✗';
    lines.push(`${symbol} ${file.fileName}`);

    for (const issue of file.issues) {
      const label = issue.level === 'error' ? 'ERROR' : 'WARNING';
      lines.push(`  ${label}: ${issue.message}`);
    }
  }

  const globalIssues = result.issues.filter(
    (issue) => !result.files.some((file) => file.issues.includes(issue)),
  );

  for (const issue of globalIssues) {
    const label = issue.level === 'error' ? 'ERROR' : 'WARNING';
    lines.push(`  ${label} [${issue.roomId}]: ${issue.message}`);
  }

  const passedCount = result.files.filter((file) => file.passed).length;
  const failedCount = result.files.length - passedCount;

  lines.push('');
  lines.push(
    `Validated ${result.files.length} maps: ${passedCount} passed, ${failedCount} failed (${result.errorCount} error${result.errorCount === 1 ? '' : 's'}, ${result.warningCount} warning${result.warningCount === 1 ? '' : 's'})`,
  );

  return lines.join('\n');
}

export function hasValidationErrors(result: MapValidationResult): boolean {
  return result.errorCount > 0;
}
