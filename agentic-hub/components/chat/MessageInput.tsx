'use client'

import { useState, FormEvent, KeyboardEvent, useRef, useEffect } from 'react'

interface MessageInputProps {
  onSend: (content: string) => void
  onClear: () => void
  disabled?: boolean
}

export function MessageInput({ onSend, onClear, disabled }: MessageInputProps) {
  const [input, setInput] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current
    if (el) {
      el.style.height = 'auto'
      el.style.height = Math.min(el.scrollHeight, 160) + 'px'
    }
  }, [input])

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (input.trim() && !disabled) {
      onSend(input)
      setInput('')
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  return (
    <div className="p-5">
      <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
        <div className="relative flex items-end gap-3 bg-surface-2 rounded-2xl border border-white/5 focus-within:border-brand-500/30 transition-colors p-3">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message Sephirot..."
            disabled={disabled}
            className="flex-1 bg-transparent text-base text-text-primary placeholder:text-text-muted px-3 py-2.5 resize-none focus:outline-none min-h-[48px] max-h-[160px] disabled:opacity-50 leading-relaxed"
            rows={1}
          />
          <div className="flex items-center gap-2 shrink-0 pb-0.5">
            <button
              type="button"
              onClick={onClear}
              disabled={disabled}
              className="p-3 rounded-xl text-text-muted hover:text-red-400 hover:bg-red-500/10 disabled:opacity-30 transition-colors"
              title="Clear chat"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
            </button>
            <button
              type="submit"
              disabled={!input.trim() || disabled}
              className="p-3.5 rounded-xl bg-brand-600 text-white hover:bg-brand-500 disabled:bg-surface-4 disabled:text-text-muted transition-all active:scale-95"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </div>
        </div>
        <p className="text-xs text-text-muted text-center mt-3">
          Enter to send · Shift+Enter for new line
        </p>
      </form>
    </div>
  )
}
