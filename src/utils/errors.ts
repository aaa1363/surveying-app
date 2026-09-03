/**
 * Error handling utility for safe error message extraction
 */
export function getErrorMessage(error: unknown, fallback: string = 'خطای غیرمنتظره رخ داده است.'): string {
  const candidate = error instanceof Error ? error.message : typeof error === 'string' ? error : '';
  const clean = candidate.trim();
  if (!clean || clean.length > 240) return fallback;
  if (/stack|trace|sql|select\s|insert\s|token|password|certificate|private.?key|api.?key|localStorage|https?:\/\/|[A-Z]:\\|node_modules/i.test(clean)) return fallback;
  return clean;
}
