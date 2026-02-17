'use client'

import { Message } from '@/types'

interface AssistantMessageProps {
  message: Message
}

export function AssistantMessage({ message }: AssistantMessageProps) {
  return (
    <div className="flex justify-start gap-3">
      <div className="shrink-0 w-7 h-7 rounded-lg bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center mt-0.5 shadow-sm shadow-brand-500/20">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" />
        </svg>
      </div>
      <div className="max-w-[80%] min-w-0">
        <div className="bg-surface-2 px-4 py-3 rounded-2xl rounded-tl-md border border-white/5">
          {message.content ? (
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-text-primary">
              {message.content}
            </p>
          ) : (
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse-glow" />
              <div className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse-glow" style={{ animationDelay: '0.3s' }} />
              <div className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse-glow" style={{ animationDelay: '0.6s' }} />
            </div>
          )}
        </div>
        {message.timestamp && message.content && (
          <p className="text-[10px] text-text-muted mt-1 ml-1">
            {new Date(message.timestamp).toLocaleTimeString(undefined, {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        )}
      </div>
    </div>
  )
}
