import type { Context } from "hono";
import type { ApiResponse } from "@shared/types";

export const ok = <T>(c: Context, data: T) => c.json({ success: true, data } as ApiResponse<T>);
/** Safe client error: `error` is a stable code, `message` is human-readable (localized by FE via i18n). */
export const bad = (c: Context, error: string, status: any = 400, message?: string) =>
  c.json({ success: false, error, ...(message ? { message } : {}) } as ApiResponse, status);
export const notFound = (c: Context, error = 'not found', message?: string) =>
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
