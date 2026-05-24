import { useEffect, useRef, useCallback } from 'react'

export interface UseWebSocketOptions {
  onMessage:   (data: unknown) => void
  onOpen?:     () => void
  onClose?:    () => void
  reconnect?:  boolean
  reconnectMs?: number
}

export function useWebSocket(url: string | null, opts: UseWebSocketOptions) {
  const wsRef   = useRef<WebSocket | null>(null)
  const timerRef= useRef<ReturnType<typeof setTimeout> | null>(null)
  const optsRef = useRef(opts)
  optsRef.current = opts

  const connect = useCallback(() => {
    if (!url) return
    try {
      const ws = new WebSocket(url)
      wsRef.current = ws

      ws.onopen = () => optsRef.current.onOpen?.()
      ws.onclose= () => {
        optsRef.current.onClose?.()
        if (optsRef.current.reconnect !== false) {
          timerRef.current = setTimeout(connect, optsRef.current.reconnectMs ?? 3000)
        }
      }
      ws.onerror= () => ws.close()
      ws.onmessage = (ev) => {
        try {
          optsRef.current.onMessage(JSON.parse(ev.data))
        } catch {
          optsRef.current.onMessage(ev.data)
        }
      }
    } catch {}
  }, [url])

  useEffect(() => {
    connect()
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      wsRef.current?.close()
    }
  }, [connect])

  const send = useCallback((data: unknown) => {
    const ws = wsRef.current
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(typeof data === 'string' ? data : JSON.stringify(data))
    }
  }, [])

  return { send }
}
