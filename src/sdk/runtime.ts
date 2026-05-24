function getConfiguredBase(): string {
  const configured = (((import.meta as unknown as { env?: Record<string, string | undefined> }).env?.VITE_API_BASE_URL) ?? '').trim()
  return configured.replace(/\/$/, '')
}

function isLocalHost(host: string): boolean {
  return host === 'localhost' || host === '127.0.0.1'
}

export function getAPIBaseUrl(): string {
  const configured = getConfiguredBase()
  if (configured) return configured

  if (typeof window === 'undefined') return 'http://localhost:8787'

  const host = window.location.hostname.toLowerCase()
  if (isLocalHost(host) || host.endsWith('.workers.dev')) return ''

  // Default to same-origin for production custom domains.
  return ''
}

export function resolveApiUrl(path: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${getAPIBaseUrl()}${normalizedPath}`
}

export function resolveWsUrl(path: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  const base = getAPIBaseUrl()

  if (base) return `${base.replace(/^http/, 'ws')}${normalizedPath}`

  if (typeof window === 'undefined') return `ws://localhost:8787${normalizedPath}`

  const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws'
  return `${protocol}://${window.location.host}${normalizedPath}`
}