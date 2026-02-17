'use client'

import { useState } from 'react'
import { Message } from '@/types'
import { MessageList } from './MessageList'
import { MessageInput } from './MessageInput'

interface ChatInterfaceProps {
  threadId: string | null
  onNewThread?: () => void
}

export function ChatInterface({ threadId, onNewThread }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([])

  const handleSendMessage = async (content: string) => {
    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content,
      timestamp: new Date().toISOString(),
    }

    setMessages(prev => [...prev, userMessage])

    // Add assistant placeholder
    const assistantMessage: Message = {
      id: `msg-${Date.now() + 1}`,
      role: 'assistant',
      content: '',
      timestamp: new Date().toISOString(),
    }

    setMessages(prev => [...prev, assistantMessage])

    try {
      const endpoint = threadId
        ? `/api/agent/stream?thread_id=${threadId}`
        : '/api/agent/stream'

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: content }),
      })

      if (!response.ok) throw new Error('Failed to send message')

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) throw new Error('No reader available')

      let fullContent = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = JSON.parse(line.slice(6))
            if (data.content) {
              fullContent += data.content
              setMessages(prev =>
                prev.map(msg =>
                  msg.id === assistantMessage.id
                    ? { ...msg, content: fullContent }
                    : msg
                )
              )
            }
          }
        }
      }
    } catch (error) {
      console.error('Error sending message:', error)
      setMessages(prev =>
        prev.map(msg =>
          msg.id === assistantMessage.id
            ? {
                ...msg,
                content: 'Error: Failed to get response. Please try again.',
              }
            : msg
        )
      )
    }
  }

  const handleClearChat = () => {
    setMessages([])
  }

  return (
    <div className="flex flex-col h-screen">
      <div className="flex-1 overflow-hidden">
        <MessageList messages={messages} />
      </div>
      <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
        <MessageInput
          onSend={handleSendMessage}
          onClear={handleClearChat}
          disabled={messages.length === 0}
        />
      </div>
    </div>
  )
}
