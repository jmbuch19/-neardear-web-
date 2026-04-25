'use client'

import { useState, useRef, useEffect, useCallback } from 'react'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

const STARTERS = [
  'How does NearDear work?',
  'What services do you offer?',
  'How are companions verified?',
  'How much does a session cost?',
]

export default function NearDearGuide() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [hasGreeted, setHasGreeted] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    function openFromEvent() {
      setOpen(true)
    }
    window.addEventListener('open-neardear-guide', openFromEvent)
    return () => window.removeEventListener('open-neardear-guide', openFromEvent)
  }, [])

  useEffect(() => {
    if (open && !hasGreeted) {
      setMessages([
        {
          role: 'assistant',
          content:
            'Namaste! I\'m the NearDear Guide. I can help you understand our services, how companions are verified, pricing, or anything else about the platform. What would you like to know?',
        },
      ])
      setHasGreeted(true)
    }
  }, [open, hasGreeted])

  useEffect(() => {
    if (open) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
      inputRef.current?.focus()
    }
  }, [messages, open])

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim()
      if (!trimmed || loading) return

      const updated: Message[] = [...messages, { role: 'user', content: trimmed }]
      setMessages(updated)
      setInput('')
      setLoading(true)

      try {
        const res = await fetch('/api/guide', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: updated }),
        })
        const data = await res.json()
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: data.reply ?? 'Sorry, I couldn\'t get a response. Please try again.' },
        ])
      } catch {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: 'Something went wrong. Please try again in a moment.' },
        ])
      } finally {
        setLoading(false)
      }
    },
    [messages, loading]
  )

  const handleKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send(input)
    }
  }

  return (
    <>
      {/* Floating bubble */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? 'Close NearDear Guide' : 'Open NearDear Guide'}
        style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          width: 56,
          height: 56,
          borderRadius: '50%',
          background: open ? '#1A6B7A' : '#E07B2F',
          border: 'none',
          cursor: 'pointer',
          boxShadow: '0 4px 16px rgba(0,0,0,0.18)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          transition: 'background 0.2s ease',
        }}
      >
        {open ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        )}
      </button>

      {/* Chat panel */}
      <div
        style={{
          position: 'fixed',
          bottom: 92,
          right: 24,
          width: 360,
          maxWidth: 'calc(100vw - 48px)',
          height: 520,
          maxHeight: 'calc(100vh - 120px)',
          background: '#FFFFFF',
          borderRadius: 20,
          boxShadow: '0 8px 40px rgba(0,0,0,0.16)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 9998,
          overflow: 'hidden',
          opacity: open ? 1 : 0,
          pointerEvents: open ? 'auto' : 'none',
          transform: open ? 'translateY(0) scale(1)' : 'translateY(16px) scale(0.97)',
          transition: 'opacity 0.22s ease, transform 0.22s ease',
          transformOrigin: 'bottom right',
        }}
      >
        {/* Header */}
        <div
          style={{
            background: '#1A6B7A',
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            flexShrink: 0,
          }}
        >
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </div>
          <div>
            <p style={{ color: '#FFFFFF', fontWeight: 700, fontSize: 15, margin: 0, lineHeight: 1 }}>NearDear Guide</p>
            <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 12, margin: '3px 0 0', lineHeight: 1 }}>Always here to help</p>
          </div>
        </div>

        {/* Messages */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '16px 16px 8px',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}
        >
          {messages.map((m, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start',
              }}
            >
              <div
                style={{
                  maxWidth: '85%',
                  background: m.role === 'user' ? '#E07B2F' : '#F3F4F6',
                  color: m.role === 'user' ? '#FFFFFF' : '#1C2B3A',
                  borderRadius: m.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                  padding: '10px 14px',
                  fontSize: 14,
                  lineHeight: 1.55,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}
              >
                {m.content}
              </div>
            </div>
          ))}

          {loading && (
            <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
              <div
                style={{
                  background: '#F3F4F6',
                  borderRadius: '16px 16px 16px 4px',
                  padding: '12px 16px',
                  display: 'flex',
                  gap: 5,
                  alignItems: 'center',
                }}
              >
                {[0, 1, 2].map((n) => (
                  <span
                    key={n}
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: '50%',
                      background: '#9CA3AF',
                      display: 'inline-block',
                      animation: `nd-bounce 1.2s ease-in-out ${n * 0.2}s infinite`,
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Starter prompts — show only at start */}
          {messages.length === 1 && !loading && (
            <div style={{ marginTop: 4, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {STARTERS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  style={{
                    background: '#FEF8F0',
                    border: '1px solid #E8E0D8',
                    borderRadius: 10,
                    padding: '8px 12px',
                    fontSize: 13,
                    color: '#1A6B7A',
                    fontWeight: 500,
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div
          style={{
            padding: '10px 12px',
            borderTop: '1px solid #E8E0D8',
            display: 'flex',
            gap: 8,
            alignItems: 'center',
            flexShrink: 0,
          }}
        >
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Ask me anything…"
            disabled={loading}
            style={{
              flex: 1,
              border: '1.5px solid #E8E0D8',
              borderRadius: 12,
              padding: '9px 13px',
              fontSize: 14,
              color: '#1C2B3A',
              background: '#FAFAFA',
              outline: 'none',
              fontFamily: 'inherit',
            }}
          />
          <button
            onClick={() => send(input)}
            disabled={!input.trim() || loading}
            aria-label="Send"
            style={{
              width: 38,
              height: 38,
              borderRadius: '50%',
              background: !input.trim() || loading ? '#E8E0D8' : '#E07B2F',
              border: 'none',
              cursor: !input.trim() || loading ? 'default' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              transition: 'background 0.15s ease',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>
      </div>

      <style>{`
        @keyframes nd-bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-5px); }
        }
      `}</style>
    </>
  )
}
