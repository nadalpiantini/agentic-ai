'use client'

import { Message } from '@/types'

interface UserMessageProps {
  message: Message
}

export function UserMessage({ message }: UserMessageProps) {
  return (
    <div className="flex justify-end">
      <div className="max-w-[75%] bg-brand-600 text-white px-5 py-3.5 rounded-2xl rounded-br-md shadow-sm">
        <p className="whitespace-pre-wrap text-[15px] leading-relaxed">{message.content}</p>
        {message.timestamp && (
          <p className="text-[10px] text-brand-200/60 mt-1.5 text-right">
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
