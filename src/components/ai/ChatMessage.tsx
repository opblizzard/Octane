import React from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { clsx } from 'clsx'
import type { ChatMessage as ChatMsg } from '@state/ai'

export interface ChatMessageProps {
  message: ChatMsg
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user'
  const isSystem = message.role === 'system'
  if (isSystem) return null

  return (
    <div className={clsx('flex gap-2.5 w-full', isUser ? 'flex-row-reverse' : 'flex-row')}>
      {/* Avatar */}
      <div
        className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-[11px] font-bold mt-0.5"
        style={{
          background: isUser ? 'var(--oct-accent-cyan)22' : 'var(--oct-accent-violet)22',
          border:     isUser ? '1px solid var(--oct-accent-cyan)44' : '1px solid var(--oct-accent-violet)44',
          color:      isUser ? 'var(--oct-accent-cyan)' : 'var(--oct-accent-violet)',
        }}
      >
        {isUser ? 'U' : 'AI'}
      </div>

      {/* Bubble */}
      <div
        className={clsx(
          'max-w-[82%] rounded-lg px-3 py-2 text-[12px] leading-relaxed',
          message.streaming && 'animate-pulse',
          message.error && 'border-[var(--oct-status-crit)]',
        )}
        style={{
          background: isUser ? 'var(--oct-accent-cyan)14' : 'var(--oct-surface-raised)',
          border:     isUser ? '1px solid var(--oct-accent-cyan)30' : '1px solid var(--oct-border-subtle)',
          color:      'var(--oct-text-primary)',
        }}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap">{message.content}</p>
        ) : (
          <div className="prose prose-invert prose-sm max-w-none oct-chat-md">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                code({ className, children, ...props }) {
                  const isBlock = className?.startsWith('language-')
                  if (isBlock) {
                    return (
                      <pre className="rounded-md p-3 overflow-x-auto text-[11px]"
                        style={{ background: 'var(--oct-surface-base)', border: '1px solid var(--oct-border-subtle)' }}>
                        <code {...props} className={className}>
                          {children}
                        </code>
                      </pre>
                    )
                  }
                  return (
                    <code {...props}
                      className="rounded px-1 py-0.5 text-[11px]"
                      style={{ background: 'var(--oct-surface-overlay)', color: 'var(--oct-accent-cyan)' }}>
                      {children}
                    </code>
                  )
                },
                a: ({ children, href }) => (
                  <a href={href} target="_blank" rel="noopener noreferrer"
                    style={{ color: 'var(--oct-accent-cyan)' }}>
                    {children}
                  </a>
                ),
                table: ({ children }) => (
                  <div className="overflow-x-auto">
                    <table className="w-full text-[11px]" style={{ borderCollapse: 'collapse' }}>
                      {children}
                    </table>
                  </div>
                ),
                th: ({ children }) => (
                  <th className="px-2 py-1 text-left text-[10px] uppercase tracking-wide"
                    style={{ borderBottom: '1px solid var(--oct-border-strong)', color: 'var(--oct-text-muted)' }}>
                    {children}
                  </th>
                ),
                td: ({ children }) => (
                  <td className="px-2 py-1" style={{ borderBottom: '1px solid var(--oct-border-subtle)', color: 'var(--oct-text-secondary)' }}>
                    {children}
                  </td>
                ),
              }}
            >
              {message.content || (message.streaming ? '▌' : '')}
            </ReactMarkdown>
          </div>
        )}
        <p className="text-[9px] mt-1 text-right" style={{ color: 'var(--oct-text-muted)' }}>
          {new Date(message.ts ?? message.timestamp ?? Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          {message.streaming && ' · streaming…'}
        </p>
      </div>
    </div>
  )
}
