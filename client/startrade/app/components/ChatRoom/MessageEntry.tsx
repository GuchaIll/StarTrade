"use client"
import React from 'react'
import { useTheme } from '../ThemeContext'

type Role = 'agent' | 'user' | 'system'

interface LinkItem {
  title?: string
  url: string
}

interface MessageEntryProps {
  role?: Role
  author?: string
  message: string
  notifications?: string[] // small badges or update lines
  links?: LinkItem[]
  timestamp?: string
  loading?: boolean
  serverActivity?: string
  onSendMessage?: (message: string) => void
}

const MessageEntry: React.FC<MessageEntryProps> = ({
  role = 'agent',
  author,
  message,
  notifications = [],
  links = [],
  timestamp,
  loading = false,
  serverActivity,
  onSendMessage,
}) => {
  const isUser = role === 'user'
  const { mode } = useTheme()

  const containerClasses = isUser ? 'justify-end' : 'justify-start'
  const bubbleBase = 'max-w-[80%] px-4 py-2 rounded-2xl break-words shadow-sm'
    const agentBubble = mode === 'dark'
      ? 'bg-neutral-800 text-white'
      : 'bg-gray-100 text-gray-800'

    // Use a light yellow for user messages in light mode and a warm darker yellow in dark mode
    const userBubble = mode === 'dark'
      ? 'bg-yellow-500 text-neutral-900' // warm yellow on dark background
      : 'bg-yellow-100 text-gray-800' // pale yellow with darker text for readability

    const bubbleClasses = isUser
      ? `${bubbleBase} ${userBubble} rounded-bl-2xl rounded-tl-2xl rounded-tr-2xl`
      : `${bubbleBase} ${agentBubble} rounded-br-2xl rounded-tr-2xl rounded-tl-2xl`

  return (
    <div className={`w-full flex ${containerClasses} mb-4`}>
      {/* Avatar / side spacer */}
      {!isUser && (
        <div className="mr-3 flex-shrink-0">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${mode === 'dark' ? 'bg-neutral-600 text-white' : 'bg-gray-200 text-gray-800'}`}>{author ? author.charAt(0) : 'A'}</div>
        </div>
      )}

      <div className="flex flex-col">
        {/* Notifications / updates */}
        {notifications.length > 0 && (
          <div className="mb-2">
            {notifications.map((note, i) => (
                <div key={i} className={`inline-block px-2 py-1 text-xs rounded mr-2 mb-1 ${mode === 'dark' ? 'bg-yellow-500/20 text-yellow-300' : 'bg-yellow-100 text-yellow-800'}`}>
                {note}
              </div>
            ))}
          </div>
        )}

        {/* Message bubble */}
        <div className={bubbleClasses}>
          {/* Loading / server activity (shown for agent messages while model is responding) */}
          {loading && serverActivity && (
            <div className="mb-2 text-xs text-neutral-400 flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-neutral-400 animate-pulse" />
              <span>Loading... {serverActivity}</span>
            </div>
          )}

          <div className="text-sm">
            {author && <div className={`${mode === 'dark' ? 'text-neutral-400' : 'text-neutral-600'} text-xs mb-1`}>{author}</div>}
            <div className={`${mode === 'dark' ? 'text-neutral-200' : 'text-gray-800'} whitespace-pre-wrap`}>{message}</div>
          </div>
          {timestamp && <div className={`${mode === 'dark' ? 'text-neutral-500' : 'text-neutral-600'} text-xs mt-1 text-right`}>{timestamp}</div>}
        </div>

        {/* Links / resources */}
        {links.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {links.map((l, idx) => (
              <a
                key={idx}
                href={l.url}
                target="_blank"
                rel="noopener noreferrer"
                  className={`text-xs underline px-2 py-1 rounded ${mode === 'dark' ? 'text-blue-300 bg-white/5' : 'text-blue-700 bg-gray-100'}`}
              >
                {l.title ?? l.url}
              </a>
            ))}
          </div>
        )}
      </div>

      {/* Avatar / side spacer for user */}
      {isUser && (
        <div className="ml-3 flex-shrink-0">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${mode === 'dark' ? 'bg-blue-600 text-white' : 'bg-blue-200 text-blue-800'}`}>{author ? author.charAt(0) : 'U'}</div>
        </div>
      )}
    </div>
  )
}

export default MessageEntry


