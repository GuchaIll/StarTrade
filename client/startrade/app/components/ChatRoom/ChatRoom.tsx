"use client"
import React, { useState, useRef, useEffect } from 'react'
import MessageEntry from './MessageEntry'
import { tradingAPI } from '../../hooks/api'
import { useTheme } from '../ThemeContext'

const ChatRoom: React.FC = () => {
  const [messages, setMessages] = useState<any[]>([
    { role: 'agent', author: 'Agent', message: 'Welcome — I can help with research and updates.', notifications: ['Model updated'], links: [{ url: 'https://example.com', title: 'Research note' }], timestamp: '10:12' },
    { role: 'user', author: 'You', message: 'Show me the latest on AAPL', notifications: [], links: [], timestamp: '10:13' },
  ])
  const [draft, setDraft] = useState('')
  const { mode } = useTheme()

  const send = () => {
    if (!draft.trim()) return
    const userMsg = { role: 'user', author: 'You', message: draft, notifications: [], links: [], timestamp: new Date().toLocaleTimeString() }
    setMessages(prev => [...prev, userMsg])
    setDraft('')
    // Append a loading message for the agent
    const loadingMsg = { role: 'agent', author: 'Agent', message: '...', notifications: [], links: [], timestamp: new Date().toLocaleTimeString(), loading: true, serverActivity: 'analyzing portfolio' }
    setMessages(prev => [...prev, loadingMsg])

    // Call the backend chat API
    ;(async () => {
      try {
        // conversationId can be added/managed here if you want to keep context across messages
        const payload = {
          message: draft,
          portfolio: [],
          // conversation_id: conversationId // if you implement a conversation state
        }

        const response = await tradingAPI.chat(payload)

        // Try to extract meaningful text from the response
        let replyText = ''
        if (!response) replyText = 'No response from server.'
        else if (typeof response === 'string') replyText = response
        else if (response.message) replyText = response.message
        else if (response.answer) replyText = response.answer
        else if (response.text) replyText = response.text
        else replyText = JSON.stringify(response)

        setMessages(prev => {
          // remove the loading message
          const withoutLoading = prev.filter(m => !(m.loading && m.role === 'agent'))
          return [...withoutLoading, { role: 'agent', author: 'Agent', message: replyText, notifications: [], links: [], timestamp: new Date().toLocaleTimeString() }]
        })
      } catch (err: any) {
        const errMsg = err?.message || 'Request failed'
        setMessages(prev => {
          const withoutLoading = prev.filter(m => !(m.loading && m.role === 'agent'))
          return [...withoutLoading, { role: 'agent', author: 'Agent', message: `Error: ${errMsg}`, notifications: [], links: [], timestamp: new Date().toLocaleTimeString() }]
        })
      }
    })()
  }

  const containerRef = useRef<HTMLDivElement | null>(null)

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    const el = containerRef.current
    if (el) {
      el.scrollTop = el.scrollHeight
    }
  }, [messages.length])

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div ref={containerRef} className="p-4 h-[480px] overflow-y-auto">
        {messages.map((m, i) => (
          <MessageEntry
            key={i}
            role={m.role as any}
            author={m.author}
            message={m.message}
            notifications={m.notifications}
            links={m.links}
            timestamp={m.timestamp}
            loading={m.loading}
            serverActivity={m.serverActivity}
          />
        ))}
      </div>

      <div className={`p-4 border-t ${mode === 'dark' ? 'border-neutral-800' : 'border-neutral-200'}`}>
        <textarea
          data-gramm="false"
          data-gramm_editor="false"
          data-enable-grammarly="false"
          spellCheck={true}
          className={`w-full p-2 rounded resize-none outline-none transition-colors ${mode === 'dark' ? 'bg-neutral-900 text-white border border-neutral-700 placeholder:text-neutral-400' : 'bg-white text-gray-900 border border-gray-300 placeholder:text-gray-500'}`}
          rows={3}
          value={draft}
          onChange={e => setDraft(e.target.value)}
        />
        <div className="flex justify-end mt-2">
          <button
            className={`px-4 py-2 rounded ${mode === 'dark' ? 'bg-gray-500 text-white' : 'bg-gray-200 text-gray-900'} disabled:opacity-60`}
            onClick={send}
            disabled={!draft.trim()}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  )
}

export default ChatRoom
