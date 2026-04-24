'use client'

import { useState } from 'react'

interface SessionItem {
  id: string
  scheduledDate: string
  scheduledTime: string
  status: string
}

interface CarePlanSessionListProps {
  sessions: SessionItem[]
  totalRemaining: number
}

const STATUS_LABEL: Record<string, { label: string; color: string; bg: string }> = {
  SCHEDULED: { label: 'Scheduled', color: '#1A6B7A', bg: '#E0F2F7' },
  COMPLETED: { label: 'Completed', color: '#4A8C6F', bg: '#F0FAF4' },
  CANCELLED: { label: 'Cancelled', color: '#6B7280', bg: '#F3F4F6' },
  NO_SHOW: { label: 'No show', color: '#E85D4A', bg: '#FEF2F2' },
}

function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat('en-IN', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(new Date(dateStr))
}

export default function CarePlanSessionList({ sessions, totalRemaining }: CarePlanSessionListProps) {
  const [showAll, setShowAll] = useState(false)

  if (sessions.length === 0) return null

  const visibleSessions = showAll ? sessions : []

  return (
    <div style={{ marginTop: 12 }}>
      <button
        onClick={() => setShowAll((prev) => !prev)}
        style={{
          background: 'transparent', border: 'none',
          color: '#1A6B7A', fontWeight: 600, fontSize: 14,
          cursor: 'pointer', padding: '8px 0',
          display: 'flex', alignItems: 'center', gap: 4,
          fontFamily: 'DM Sans, sans-serif',
        }}
      >
        {showAll
          ? 'Hide remaining visits ▲'
          : `View all ${totalRemaining} remaining ▼`}
      </button>

      {showAll && visibleSessions.map((s, i) => {
        const conf = STATUS_LABEL[s.status] ?? STATUS_LABEL['SCHEDULED']
        return (
          <div
            key={s.id}
            style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              paddingTop: 12, paddingBottom: 12,
              borderTop: '1px solid #F3F4F6',
              marginTop: i === 0 ? 4 : 0,
            }}
          >
            <div>
              <p style={{ fontWeight: 600, fontSize: 14, color: '#1C2B3A', margin: 0 }}>
                {formatDate(s.scheduledDate)}
              </p>
              <p style={{ fontSize: 12, color: '#9CA3AF', margin: '2px 0 0' }}>
                {s.scheduledTime}
              </p>
            </div>
            <span style={{
              background: conf.bg, color: conf.color,
              borderRadius: 9999, padding: '3px 10px',
              fontSize: 12, fontWeight: 600,
            }}>
              {conf.label}
            </span>
          </div>
        )
      })}
    </div>
  )
}
