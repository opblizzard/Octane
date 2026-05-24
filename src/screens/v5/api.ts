import { resolveApiUrl } from '@sdk/runtime'

async function parseResponse<T>(res: Response): Promise<T> {
  const payload = await res.json().catch(() => ({})) as T | { error?: string }
  if (!res.ok) {
    const message = (payload as { error?: string }).error || `HTTP ${res.status}`
    throw new Error(message)
  }
  return payload as T
}

export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(resolveApiUrl(path))
  return parseResponse<T>(res)
}

export async function apiPost<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(resolveApiUrl(path), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  return parseResponse<T>(res)
}

export async function apiDelete<T>(path: string): Promise<T> {
  const res = await fetch(resolveApiUrl(path), { method: 'DELETE' })
  return parseResponse<T>(res)
}

export function pretty(value: unknown): string {
  return JSON.stringify(value, null, 2)
}
