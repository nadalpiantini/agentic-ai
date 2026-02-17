'use client'

import { useEffect, useRef } from 'react'
import { Message } from '@/types'
import { UserMessage } from './UserMessage'
import { AssistantMessage } from './AssistantMessage'

interface MessageListProps {
  messages: Message[]
  isLoading?: boolean
}

export function MessageList({ messages, isLoading }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-3xl mx-auto px-8 py-8 space-y-8">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
            <div className="w-16 h-16 rounded-2xl bg-brand-600/10 flex items-center justify-center mb-6">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-brand-400">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <p className="text-xl font-medium text-text-secondary mb-2">Start a conversation</p>
            <p className="text-base text-text-muted">Ask anything. The agent will use tools when needed.</p>
          </div>
        ) : (
          messages.map((message) => (
            <div key={message.id} className="animate-fade-in">
              {message.role === 'user' ? (
                <UserMessage message={message} />
              ) : (
                <AssistantMessage message={message} />
              )}
            </div>
          ))
        )}
        {isLoading && messages.length > 0 && messages[messages.length - 1]?.content === '' && (
          <div className="flex items-center gap-1.5 px-1 py-2">
            <div className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse-glow" />
            <div className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse-glow" style={{ animationDelay: '0.3s' }} />
            <div className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse-glow" style={{ animationDelay: '0.6s' }} />
          </div>
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  )
}
