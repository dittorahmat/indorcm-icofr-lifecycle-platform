import type { Context } from "hono";
import type { ApiResponse } from "@shared/types";

export const ok = <T>(c: Context, data: T) => c.json({ success: true, data } as ApiResponse<T>);
export const bad = (c: Context, error: string, status: any = 400) => c.json({ success: false, error } as ApiResponse, status);
export const notFound = (c: Context, error = 'not found') => c.json({ success: false, error } as ApiResponse, 404);
export const isStr = (s: unknown): s is string => typeof s === 'string' && s.length > 0;
