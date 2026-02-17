'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Message } from '@/types'
import { MessageList } from './MessageList'
import { MessageInput } from './MessageInput'
import { ModelSelector } from './ModelSelector'

interface ChatInterfaceProps {
  threadId: string | null
  onNewThread?: () => void
  onThreadCreated?: (threadId: string) => void
}

interface MessageDB {
  id: string
  thread_id: string
  role: string
  content: string
  model_used?: string
  created_at: string
}

export function ChatInterface({ threadId, onNewThread, onThreadCreated }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedModel, setSelectedModel] = useState<'claude' | 'deepseek' | 'ollama'>('claude')
  const [activeThreadId, setActiveThreadId] = useState<string | null>(threadId)
  const isSendingRef = useRef(false)

  useEffect(() => {
    setActiveThreadId(threadId)
  }, [threadId])

  useEffect(() => {
    // Skip loading from DB when we just created the thread during send —
    // the in-memory messages (user + streaming assistant) are the source of truth
    if (isSendingRef.current) return
    if (activeThreadId) {
      loadMessages(activeThreadId)
    } else {
      setMessages([])
    }
  }, [activeThreadId])

  const loadMessages = async (tid: string) => {
    try {
      const res = await fetch(`/api/threads/${tid}/messages`)
      if (!res.ok) return
      const data = await res.json()
      setMessages(data.map((m: MessageDB) => ({
        id: m.id,
        thread_id: m.thread_id,
        role: m.role as 'user' | 'assistant' | 'system',
        content: m.content,
        model_used: m.model_used,
        timestamp: m.created_at,
      })))
    } catch (err) {
      console.error('Failed to load messages:', err)
    }
  }

  const createThread = useCallback(async (firstMessage: string): Promise<string | null> => {
    try {
      const title = firstMessage.slice(0, 80) + (firstMessage.length > 80 ? '...' : '')
      const res = await fetch('/api/threads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      })
      if (!res.ok) throw new Error('Failed to create thread')
      const thread = await res.json()
      setActiveThreadId(thread.id)
      onThreadCreated?.(thread.id)
      return thread.id
    } catch (err) {
      console.error('Failed to create thread:', err)
      return null
    }
  }, [onThreadCreated])

  const saveMessage = async (tid: string, role: string, content: string) => {
    try {
      await fetch(`/api/threads/${tid}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, content }),
      })
    } catch (err) {
      console.error('Failed to save message:', err)
    }
  }

  const handleSendMessage = useCallback(async (content: string) => {
    if (isLoading) return
    setIsLoading(true)
    isSendingRef.current = true

    let tid = activeThreadId
    if (!tid) {
      tid = await createThread(content)
      if (!tid) {
        setIsLoading(false)
        isSendingRef.current = false
        return
      }
    }

    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content,
      timestamp: new Date().toISOString(),
    }
    setMessages(prev => [...prev, userMessage])
    saveMessage(tid!, 'user', content)

    const assistantId = `msg-${Date.now() + 1}`
    const assistantMessage: Message = {
      id: assistantId,
      role: 'assistant',
      content: '',
      timestamp: new Date().toISOString(),
    }
    setMessages(prev => [...prev, assistantMessage])

    try {
      const allMessages = [...messages, userMessage].map(m => ({
        role: m.role,
        content: m.content,
      }))

      const response = await fetch('/api/agent/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          threadId: tid,
          messages: allMessages,
          selectedModel,
        }),
      })

      if (!response.ok) throw new Error('Failed to send message')

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) throw new Error('No reader available')

      let fullContent = ''
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          try {
            const data = JSON.parse(line.slice(6))

            switch (data.type) {
              case 'token':
                fullContent += data.content
                setMessages(prev =>
                  prev.map(msg =>
                    msg.id === assistantId
                      ? { ...msg, content: fullContent }
                      : msg
                  )
                )
                break

              case 'tool_start':
                fullContent += `\n[Using tool: ${data.tool}...]\n`
                setMessages(prev =>
                  prev.map(msg =>
                    msg.id === assistantId
                      ? { ...msg, content: fullContent }
                      : msg
                  )
                )
                break

              case 'tool_end':
                fullContent = fullContent.replace(
                  `\n[Using tool: ${data.tool}...]\n`,
                  `\n[Tool ${data.tool} completed]\n`
                )
                setMessages(prev =>
                  prev.map(msg =>
                    msg.id === assistantId
                      ? { ...msg, content: fullContent }
                      : msg
                  )
                )
                break

              case 'message':
                if (data.role === 'ai' || data.role === 'assistant') {
                  fullContent = typeof data.content === 'string'
                    ? data.content
                    : fullContent
                  setMessages(prev =>
                    prev.map(msg =>
                      msg.id === assistantId
                        ? { ...msg, content: fullContent }
                        : msg
                    )
                  )
                }
                break

              case 'done':
                // Model info available in data.selectedModel if needed
                break

              case 'error':
                throw new Error(data.error)
            }
          } catch {
            // Skip unparseable lines
          }
        }
      }

      if (fullContent) {
        saveMessage(tid!, 'assistant', fullContent)
      }
    } catch (error) {
      console.error('Error sending message:', error)
      const errMsg = error instanceof Error ? error.message : 'Unknown error'
      setMessages(prev =>
        prev.map(msg =>
          msg.id === assistantId
            ? { ...msg, content: `Error: ${errMsg}. Please try again.` }
            : msg
        )
      )
    } finally {
      setIsLoading(false)
      isSendingRef.current = false
    }
  }, [activeThreadId, messages, selectedModel, isLoading, createThread])

  const handleClearChat = () => {
    setMessages([])
    setActiveThreadId(null)
    onNewThread?.()
  }

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-surface-0">
      {/* Model selector bar */}
      <div className="shrink-0 flex items-center justify-center px-6 py-4 border-b border-white/5">
        <ModelSelector value={selectedModel} onChange={setSelectedModel} />
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-hidden">
        <MessageList messages={messages} isLoading={isLoading} />
      </div>

      {/* Input */}
      <div className="shrink-0 border-t border-white/5">
        <MessageInput
          onSend={handleSendMessage}
          onClear={handleClearChat}
          disabled={isLoading}
        />
      </div>
    </div>
  )
}
