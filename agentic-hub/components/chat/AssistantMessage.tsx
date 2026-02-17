'use client'

import { Message } from '@/types'

interface AssistantMessageProps {
  message: Message
}

export function AssistantMessage({ message }: AssistantMessageProps) {
  return (
    <div className="flex justify-start">
      <div className="max-w-[80%] bg-gray-200 dark:bg-gray-800 px-4 py-2 rounded-lg">
        <p className="whitespace-pre-wrap text-gray-900 dark:text-gray-100">
          {message.content || (
            <span className="text-gray-400 dark:text-gray-600">
              Thinking...
            </span>
          )}
        </p>
        {message.timestamp && message.content && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {new Date(message.timestamp).toLocaleTimeString()}
          </p>
        )}
      </div>
    </div>
  )
}
