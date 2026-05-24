/**
 * OCTANE v5 — Utility Helpers
 */
import { nanoid } from 'nanoid';

export function generateId(prefix: string = 'id'): string {
  return `${prefix}_${nanoid(16)}`;
}

export function now(): number {
  return Date.now();
}

export function traceId(): string {
  return `trace_${nanoid(24)}`;
}

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * clamp(t, 0, 1);
}

export function formatUptime(ms: number): string {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  if (d > 0) return `${d}d ${h % 24}h ${m % 60}m`;
  if (h > 0) return `${h}h ${m % 60}m ${s % 60}s`;
  if (m > 0) return `${m}m ${s % 60}s`;
  return `${s}s`;
}

export function jsonResponse<T>(data: T, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export function errorResponse(message: string, code = 400): Response {
  return jsonResponse({ success: false, error: message, code, timestamp: now() }, code);
}

export function okResponse<T>(data: T, traceId_: string): Response {
  return jsonResponse({ success: true, data, traceId: traceId_, timestamp: now() });
}
