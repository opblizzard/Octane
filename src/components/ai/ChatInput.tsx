import React, { useState, useRef, useCallback } from 'react'
import { Send, Square, Mic } from 'lucide-react'
import { clsx } from 'clsx'

interface ChatInputProps {
  onSend:       (msg: string) => void
  onStop?:      () => void
  isStreaming?: boolean
  placeholder?: string
  disabled?:    boolean
}

export function ChatInput({ onSend, onStop, isStreaming = false, placeholder = 'Message Ion AI…', disabled }: ChatInputProps) {
  const [text, setText] = useState('')
  const taRef = useRef<HTMLTextAreaElement>(null)

  const submit = useCallback(() => {
    const msg = text.trim()
    if (!msg || isStreaming) return
    onSend(msg)
    setText('')
    if (taRef.current) {
      taRef.current.style.height = 'auto'
    }
  }, [text, isStreaming, onSend])

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
  }

  const onInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value)
    const el = e.target
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 140)}px`
  }

  return (
    <div
      className="flex items-end gap-2 rounded-lg px-3 py-2"
      style={{
        background: 'var(--oct-surface-raised)',
        border:     '1px solid var(--oct-border-strong)',
      }}
    >
      <textarea
        ref={taRef}
        rows={1}
        value={text}
        onChange={onInput}
        onKeyDown={onKeyDown}
        disabled={disabled || isStreaming}
        placeholder={isStreaming ? 'Ion AI is responding…' : placeholder}
        className="flex-1 bg-transparent resize-none outline-none text-sm leading-relaxed min-w-0"
        style={{
          color:       'var(--oct-text-primary)',
          caretColor:  'var(--oct-accent-cyan)',
          maxHeight:   140,
          overflowY:   'auto',
        }}
        spellCheck={false}
      />

      {isStreaming ? (
        <button
          onClick={onStop}
          className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-opacity hover:opacity-70"
          style={{ background: 'var(--oct-status-crit)22', border: '1px solid var(--oct-status-crit)44', color: 'var(--oct-status-crit)' }}
          title="Stop generation"
        >
          <Square size={13} fill="currentColor" />
        </button>
      ) : (
        <button
          onClick={submit}
          disabled={!text.trim() || disabled}
          className={clsx(
            'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all',
            text.trim() ? 'opacity-100 hover:opacity-80' : 'opacity-30',
          )}
          style={{
            background: 'var(--oct-accent-cyan)',
            color:      'var(--oct-surface-base)',
          }}
          title="Send (Enter)"
        >
          <Send size={13} />
        </button>
      )}
    </div>
  )
}
