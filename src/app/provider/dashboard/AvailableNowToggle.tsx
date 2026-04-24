'use client'

import { useState } from 'react'

interface AvailableNowToggleProps {
  initial: boolean
}

export default function AvailableNowToggle({ initial }: AvailableNowToggleProps) {
  const [available, setAvailable] = useState(initial)
  const [loading, setLoading] = useState(false)

  async function toggle() {
    setLoading(true)
    try {
      const res = await fetch('/api/provider/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ availableNow: !available }),
      })
      if (res.ok) {
        setAvailable((v) => !v)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        background: available ? '#F0FAF4' : '#FFFFFF',
        border: `1.5px solid ${available ? '#4A8C6F' : '#E8E0D8'}`,
        borderRadius: 16,
        padding: '16px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 20,
        transition: 'all 0.2s',
      }}
    >
      <div>
        <p
          style={{
            fontSize: 15,
            fontWeight: 600,
            color: available ? '#4A8C6F' : '#1C2B3A',
            margin: 0,
          }}
        >
          {available ? 'You are available now' : 'You are offline'}
        </p>
        <p style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>
          {available
            ? 'Families can see you as available for visits'
            : 'Turn on to accept same-day requests'}
        </p>
      </div>
      <button
        onClick={toggle}
        disabled={loading}
        aria-label={available ? 'Go offline' : 'Go available'}
        style={{
          width: 48,
          height: 28,
          borderRadius: 14,
          background: available ? '#4A8C6F' : '#D1D5DB',
          border: 'none',
          cursor: loading ? 'not-allowed' : 'pointer',
          position: 'relative',
          transition: 'background 0.2s',
          flexShrink: 0,
          opacity: loading ? 0.7 : 1,
        }}
      >
        <span
          style={{
            position: 'absolute',
            top: 3,
            left: available ? 22 : 4,
            width: 22,
            height: 22,
            borderRadius: '50%',
            background: '#FFFFFF',
            transition: 'left 0.2s',
            boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
          }}
        />
      </button>
    </div>
  )
}
