'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'

interface Notification {
  id: string
  title: string
  body: string
  channel: string
  status: string
  createdAt: string
  readAt: string | null
}

interface NotificationsResponse {
  notifications: Notification[]
  total: number
  page: number
  totalPages: number
}

type FilterType = 'ALL' | 'REQUESTS' | 'EARNINGS' | 'ACCOUNT' | 'WARNINGS'

function relativeTime(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins} min ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs} hr ago`
  if (hrs < 48) return 'Yesterday'
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })
}

const CHANNEL_COLORS: Record<string, string> = {
  PUSH:   '#E07B2F',
  SMS:    '#1A6B7A',
  EMAIL:  '#4A8C6F',
  IN_APP: '#9CA3AF',
}

const CHANNEL_LABELS: Record<string, string> = {
  PUSH:   'Push',
  SMS:    'SMS',
  EMAIL:  'Email',
  IN_APP: 'In-app',
}

function BottomNav({ active }: { active: string }) {
  const links = [
    { href: '/provider/dashboard', label: 'Dashboard' },
    { href: '/provider/earnings', label: 'Earnings' },
    { href: '/provider/performance', label: 'Performance' },
    { href: '/provider/account', label: 'Account' },
  ]
  return (
    <nav
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        background: '#FFFFFF',
        borderTop: '1px solid #E8E0D8',
        display: 'flex',
        justifyContent: 'space-around',
        padding: '10px 0 14px',
        zIndex: 50,
      }}
    >
      {links.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textDecoration: 'none',
            color: l.label === active ? '#E07B2F' : '#9CA3AF',
          }}
        >
          <span style={{ fontSize: 12, fontWeight: l.label === active ? 700 : 400 }}>{l.label}</span>
        </Link>
      ))}
    </nav>
  )
}

export default function ProviderNotificationsPage() {
  const [filter, setFilter] = useState<FilterType>('ALL')
  const [page, setPage] = useState(1)
  const [data, setData] = useState<NotificationsResponse | null>(null)
  const [loading, setLoading] = useState(true)

  const filters: FilterType[] = ['ALL', 'REQUESTS', 'EARNINGS', 'ACCOUNT', 'WARNINGS']

  const load = useCallback((f: FilterType, p: number) => {
    setLoading(true)
    fetch(`/api/provider/notifications?filter=${f}&page=${p}`)
      .then((r) => r.json())
      .then((d: NotificationsResponse) => {
        setData(d)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  useEffect(() => {
    load(filter, page)
  }, [filter, page, load])

  function changeFilter(f: FilterType) {
    setFilter(f)
    setPage(1)
  }

  async function markAllRead() {
    if (!data) return
    const unread = data.notifications.filter((n) => n.status !== 'READ').map((n) => n.id)
    if (unread.length === 0) return
    await fetch('/api/provider/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: unread }),
    })
    load(filter, page)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#FEF8F0', paddingBottom: 80 }}>
      {/* Header */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          background: '#FFFFFF',
          borderBottom: '1px solid #E8E0D8',
          padding: '12px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 18, fontWeight: 700, color: '#1C2B3A', margin: 0 }}>
          Notifications
        </h1>
        <button
          onClick={markAllRead}
          style={{
            background: 'none',
            border: 'none',
            color: '#E07B2F',
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
            padding: 0,
          }}
        >
          Mark all read
        </button>
      </div>

      {/* Filter chips */}
      <div
        style={{
          background: '#FFFFFF',
          borderBottom: '1px solid #E8E0D8',
          display: 'flex',
          overflowX: 'auto',
          padding: '10px 20px',
          gap: 8,
        }}
      >
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => changeFilter(f)}
            style={{
              background: filter === f ? '#E07B2F' : '#F3F4F6',
              color: filter === f ? '#FFFFFF' : '#6B7280',
              border: 'none',
              borderRadius: 20,
              padding: '6px 14px',
              fontSize: 12,
              fontWeight: filter === f ? 600 : 400,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            {f.charAt(0) + f.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      <div style={{ maxWidth: 480, margin: '0 auto', padding: '20px 20px' }}>
        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                style={{ height: 72, borderRadius: 12, background: '#F3F4F6' }}
              />
            ))}
          </div>
        )}

        {!loading && (!data || data.notifications.length === 0) && (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <p style={{ fontSize: 28, marginBottom: 10 }}>🔔</p>
            <p style={{ fontSize: 15, color: '#6B7280' }}>All caught up!</p>
            <p style={{ fontSize: 13, color: '#9CA3AF', marginTop: 4 }}>
              No notifications to show right now.
            </p>
          </div>
        )}

        {!loading && data && data.notifications.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {data.notifications.map((n) => {
              const isUnread = n.status !== 'READ'
              return (
                <div
                  key={n.id}
                  style={{
                    background: isUnread ? '#FFFFFF' : '#FAFAFA',
                    borderRadius: 12,
                    border: '1px solid #E8E0D8',
                    borderLeft: isUnread ? '3px solid #E07B2F' : '1px solid #E8E0D8',
                    padding: '14px 14px',
                    display: 'flex',
                    gap: 12,
                    alignItems: 'flex-start',
                  }}
                >
                  {/* Icon circle */}
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: '50%',
                      background: CHANNEL_COLORS[n.channel] ?? '#9CA3AF',
                      flexShrink: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <span style={{ fontSize: 14, color: '#FFFFFF' }}>
                      {n.channel === 'SMS' ? '💬' : n.channel === 'EMAIL' ? '✉️' : '🔔'}
                    </span>
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#1C2B3A', margin: 0 }}>
                      {n.title}
                    </p>
                    <p style={{ fontSize: 12, color: '#6B7280', marginTop: 2, lineHeight: 1.4 }}>
                      {n.body}
                    </p>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginTop: 8,
                      }}
                    >
                      <span style={{ fontSize: 11, color: '#9CA3AF' }}>
                        {relativeTime(n.createdAt)}
                      </span>
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 600,
                          padding: '2px 8px',
                          borderRadius: 9999,
                          background: `${CHANNEL_COLORS[n.channel] ?? '#9CA3AF'}20`,
                          color: CHANNEL_COLORS[n.channel] ?? '#9CA3AF',
                        }}
                      >
                        {CHANNEL_LABELS[n.channel] ?? n.channel}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Pagination */}
        {data && data.totalPages > 1 && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: 12,
              marginTop: 24,
            }}
          >
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              style={{
                background: page <= 1 ? '#F3F4F6' : '#FFFFFF',
                border: '1px solid #E8E0D8',
                borderRadius: 8,
                padding: '8px 16px',
                fontSize: 13,
                color: page <= 1 ? '#9CA3AF' : '#1C2B3A',
                cursor: page <= 1 ? 'not-allowed' : 'pointer',
              }}
            >
              Previous
            </button>
            <span style={{ fontSize: 12, color: '#6B7280' }}>
              {page} of {data.totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
              disabled={page >= data.totalPages}
              style={{
                background: page >= data.totalPages ? '#F3F4F6' : '#FFFFFF',
                border: '1px solid #E8E0D8',
                borderRadius: 8,
                padding: '8px 16px',
                fontSize: 13,
                color: page >= data.totalPages ? '#9CA3AF' : '#1C2B3A',
                cursor: page >= data.totalPages ? 'not-allowed' : 'pointer',
              }}
            >
              Next
            </button>
          </div>
        )}
      </div>

      <BottomNav active="" />
    </div>
  )
}
