import type { Context } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import type { ApiResponse } from "@shared/types";

export type NotAllowedAsBadStatus = 404;
export type ClientErrorStatusCode = Exclude<ContentfulStatusCode | number, NotAllowedAsBadStatus>;

export const ok = <T>(c: Context, data: T, status: ContentfulStatusCode = 200) =>
  c.json({ success: true, data } as ApiResponse<T>, status);
/**
 * Safe client error: `error` is a stable code, `message` is human-readable (localized by FE via i18n).
 * 404 is intentionally excluded: use `notFound(c, code, message)` for missing resources.
 */
export const bad = (
  c: Context,
  error: string,
  status: ClientErrorStatusCode = 400,
  message?: string
) => {
  if ((status as number) === 404) {
    throw new AppError('INVALID_BAD_CALL_WITH_404', 'Use notFound instead of bad with 404', 500);
  }
  return c.json({ success: false, error, ...(message ? { message } : {}) } as ApiResponse, status as ContentfulStatusCode);
};
export const notFound = (c: Context, error = 'NOT_FOUND', message?: string) =>
  c.json({ success: false, error, ...(message ? { message } : {}) } as ApiResponse, 404);

/** Typed application error carrying safe HTTP status + stable code. Thrown by services, mapped by onError. */
export class AppError extends Error {
  readonly status: number;
  readonly code: string;
  constructor(code: string, message: string, status = 400) {
    super(message);
    this.code = code;
    this.status = status;
  }
}
export const SIMULATION_NOT_FOUND = 'SIMULATION_NOT_FOUND';
export const isStr = (s: unknown): s is string => typeof s === 'string' && s.length > 0;
