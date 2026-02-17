'use client'

import { useEffect, useState } from 'react'
import { Thread } from '@/types'

interface ThreadSidebarProps {
  currentThreadId: string | null
  onThreadSelect: (threadId: string) => void
  onNewThread: () => void
}

export function ThreadSidebar({
  currentThreadId,
  onThreadSelect,
  onNewThread,
}: ThreadSidebarProps) {
  const [threads, setThreads] = useState<Thread[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadThreads()
  }, [])

  const loadThreads = async () => {
    try {
      const response = await fetch('/api/threads')
      if (!response.ok) throw new Error('Failed to load threads')
      const data = await response.json()
      setThreads(data)
    } catch (error) {
      console.error('Error loading threads:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteThread = async (threadId: string) => {
    try {
      await fetch(`/api/threads/${threadId}`, { method: 'DELETE' })
      setThreads(prev => prev.filter(t => t.id !== threadId))
      if (currentThreadId === threadId) {
        onNewThread()
      }
    } catch (error) {
      console.error('Error deleting thread:', error)
    }
  }

  return (
    <div className="w-72 h-full bg-surface-1 flex flex-col">
      {/* Header */}
      <div className="p-5">
        <button
          onClick={onNewThread}
          className="w-full flex items-center justify-center gap-2.5 px-5 py-3.5 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 text-white text-sm font-medium transition-all hover:shadow-lg hover:shadow-brand-500/20 active:scale-[0.98]"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          New Thread
        </button>
      </div>

      {/* Thread list */}
      <div className="flex-1 overflow-y-auto px-3 pb-3">
        {loading ? (
          <div className="px-3 py-8 text-center">
            <div className="w-5 h-5 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs text-text-muted">Loading...</p>
          </div>
        ) : threads.length === 0 ? (
          <div className="px-3 py-8 text-center">
            <p className="text-xs text-text-muted">No threads yet</p>
            <p className="text-xs text-text-muted mt-1">Start a conversation</p>
          </div>
        ) : (
          <div className="space-y-1">
            {threads.map(thread => (
              <div
                key={thread.id}
                onClick={() => onThreadSelect(thread.id)}
                className={`group flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all duration-150 ${
                  currentThreadId === thread.id
                    ? 'bg-brand-600/15 text-text-primary'
                    : 'text-text-secondary hover:bg-white/5 hover:text-text-primary'
                }`}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 opacity-40">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate">
                    {thread.title || 'New Thread'}
                  </p>
                  <p className="text-[11px] text-text-muted mt-1">
                    {new Date(thread.created_at).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
                <button
                  onClick={e => {
                    e.stopPropagation()
                    handleDeleteThread(thread.id)
                  }}
                  className="opacity-0 group-hover:opacity-100 p-2 rounded-lg text-text-muted hover:text-red-400 hover:bg-red-500/10 transition-all"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
