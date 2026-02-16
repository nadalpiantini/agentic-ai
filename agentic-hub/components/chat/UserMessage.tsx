'use client'

import { Message } from '@/types'

interface UserMessageProps {
  message: Message
}

export function UserMessage({ message }: UserMessageProps) {
  return (
    <div className="flex justify-end">
      <div className="max-w-[80%] bg-blue-600 text-white px-4 py-2 rounded-lg">
        <p className="whitespace-pre-wrap">{message.content}</p>
        {message.timestamp && (
          <p className="text-xs text-blue-200 mt-1">
            {new Date(message.timestamp).toLocaleTimeString()}
          </p>
        )}
      </div>
    </div>
  )
}
