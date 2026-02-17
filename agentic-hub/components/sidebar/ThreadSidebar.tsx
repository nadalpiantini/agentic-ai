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
    <div className="w-64 bg-gray-100 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={onNewThread}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          New Thread
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-4 text-gray-500">Loading threads...</div>
        ) : threads.length === 0 ? (
          <div className="p-4 text-gray-500">No threads yet</div>
        ) : (
          <div className="p-2 space-y-1">
            {threads.map(thread => (
              <div
                key={thread.id}
                className={`p-3 rounded-lg cursor-pointer transition-colors ${
                  currentThreadId === thread.id
                    ? 'bg-blue-100 dark:bg-blue-900'
                    : 'hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                <div
                  className="flex items-center justify-between"
                  onClick={() => onThreadSelect(thread.id)}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate text-gray-900 dark:text-gray-100">
                      {thread.title || 'New Thread'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(thread.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={e => {
                      e.stopPropagation()
                      handleDeleteThread(thread.id)
                    }}
                    className="ml-2 px-2 py-1 text-xs text-red-600 hover:bg-red-100 dark:hover:bg-red-900 rounded transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
