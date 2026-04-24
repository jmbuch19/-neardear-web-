'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

// ── Types ─────────────────────────────────────────────────────────────────────

interface RequestService {
  serviceCategory: { name: string }
}

interface EarningSession {
  scheduledDate: string
  scheduledTime: string
  request: {
    requestServices: RequestService[]
    elderProfile: { name: string; city: string } | null
  }
}

interface Earning {
  id: string
  sessionId: string
  amount: number
  createdAt: string
  status: string
  session: EarningSession | null
}

interface EarningsData {
  thisMonth: number
  lastMonth: number
  allTime: number
  earningsPercent: number
  sessionsThisMonth: number
  availableToWithdraw: number
  pendingRelease: number
  recentEarnings: Earning[]
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatINR(n: number) {
  return `₹${n.toLocaleString('en-IN')}`
}

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

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  PENDING:    { bg: '#F3F4F6', text: '#6B7280' },
  RELEASED:   { bg: '#EFF6FF', text: '#1A6B7A' },
  PROCESSING: { bg: '#FEF3C7', text: '#92400E' },
  PAID:       { bg: '#F0FAF4', text: '#166534' },
  HELD:       { bg: '#FEF2F2', text: '#991B1B' },
  CANCELLED:  { bg: '#F3F4F6', text: '#9CA3AF' },
}

// ── Components ────────────────────────────────────────────────────────────────

function Skeleton({ h = 16, w = '100%', radius = 8 }: { h?: number; w?: string | number; radius?: number }) {
  return (
    <div
      style={{
        height: h,
        width: w,
        borderRadius: radius,
        background: '#F3F4F6',
        animation: 'pulse 1.5s ease-in-out infinite',
      }}
    />
  )
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

// ── Main Page ─────────────────────────────────────────────────────────────────

type TabId = 'overview' | 'sessions' | 'withdrawals' | 'bonuses'

export default function ProviderEarningsPage() {
  const [tab, setTab] = useState<TabId>('overview')
  const [data, setData] = useState<EarningsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/provider/earnings')
      .then((r) => r.json())
      .then((d: EarningsData) => {
        setData(d)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const tabs: { id: TabId; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'sessions', label: 'Sessions' },
    { id: 'withdrawals', label: 'Withdrawals' },
    { id: 'bonuses', label: 'Bonuses' },
  ]

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
        }}
      >
        <h1
          style={{
            fontFamily: 'Georgia, serif',
            fontSize: 18,
            fontWeight: 700,
            color: '#1C2B3A',
            margin: 0,
          }}
        >
          Earnings
        </h1>
      </div>

      {/* Tab bar */}
      <div
        style={{
          background: '#FFFFFF',
          borderBottom: '1px solid #E8E0D8',
          display: 'flex',
          overflowX: 'auto',
          padding: '0 20px',
          gap: 0,
        }}
      >
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              background: 'none',
              border: 'none',
              borderBottom: tab === t.id ? '2px solid #E07B2F' : '2px solid transparent',
              color: tab === t.id ? '#E07B2F' : '#6B7280',
              fontWeight: tab === t.id ? 600 : 400,
              fontSize: 13,
              padding: '12px 16px',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ maxWidth: 480, margin: '0 auto', padding: '24px 20px' }}>

        {/* OVERVIEW TAB */}
        {tab === 'overview' && (
          <div>
            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <Skeleton h={100} radius={16} />
                <Skeleton h={60} radius={16} />
                <Skeleton h={60} radius={16} />
              </div>
            ) : data ? (
              <>
                {/* Big this-month number */}
                <div
                  style={{
                    background: '#FFFFFF',
                    borderRadius: 16,
                    border: '1px solid #E8E0D8',
                    padding: '24px 20px',
                    marginBottom: 16,
                    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                  }}
                >
                  <p
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      color: '#1A6B7A',
                      margin: 0,
                    }}
                  >
                    This Month
                  </p>
                  <p
                    style={{
                      fontSize: 40,
                      fontWeight: 700,
                      color: '#E07B2F',
                      fontFamily: 'DM Mono, monospace',
                      margin: '8px 0 4px',
                      letterSpacing: '-1px',
                    }}
                  >
                    {formatINR(data.thisMonth)}
                  </p>
                  <p style={{ fontSize: 12, color: '#6B7280' }}>
                    {data.sessionsThisMonth} session{data.sessionsThisMonth !== 1 ? 's' : ''} this month
                  </p>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: 12,
                      marginTop: 16,
                      paddingTop: 16,
                      borderTop: '1px solid #F3F4F6',
                    }}
                  >
                    <div>
                      <p style={{ fontSize: 11, color: '#9CA3AF', margin: 0 }}>Last Month</p>
                      <p
                        style={{
                          fontSize: 18,
                          fontWeight: 700,
                          color: '#1C2B3A',
                          fontFamily: 'DM Mono, monospace',
                          marginTop: 2,
                        }}
                      >
                        {formatINR(data.lastMonth)}
                      </p>
                    </div>
                    <div>
                      <p style={{ fontSize: 11, color: '#9CA3AF', margin: 0 }}>All Time</p>
                      <p
                        style={{
                          fontSize: 18,
                          fontWeight: 700,
                          color: '#1C2B3A',
                          fontFamily: 'DM Mono, monospace',
                          marginTop: 2,
                        }}
                      >
                        {formatINR(data.allTime)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Earnings rate */}
                <div
                  style={{
                    background: '#F0FAF4',
                    borderRadius: 12,
                    border: '1px solid #C6E4D6',
                    padding: '14px 16px',
                    marginBottom: 16,
                  }}
                >
                  <p style={{ fontSize: 13, color: '#166534', fontWeight: 500, margin: 0 }}>
                    You earn{' '}
                    <strong style={{ fontFamily: 'DM Mono, monospace' }}>
                      {data.earningsPercent}%
                    </strong>{' '}
                    of every session
                  </p>
                </div>

                {/* Withdraw / Pending */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
                  <div
                    style={{
                      background: '#FFFFFF',
                      borderRadius: 16,
                      border: '1px solid #E8E0D8',
                      padding: '16px 20px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <p style={{ fontSize: 12, color: '#6B7280', margin: 0 }}>Available to Withdraw</p>
                      <p
                        style={{
                          fontSize: 22,
                          fontWeight: 700,
                          color: '#4A8C6F',
                          fontFamily: 'DM Mono, monospace',
                          marginTop: 2,
                        }}
                      >
                        {formatINR(data.availableToWithdraw)}
                      </p>
                    </div>
                    <button
                      style={{
                        background: '#E07B2F',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: 10,
                        padding: '10px 16px',
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      Withdraw to Bank
                    </button>
                  </div>

                  <div
                    style={{
                      background: '#FFFFFF',
                      borderRadius: 16,
                      border: '1px solid #E8E0D8',
                      padding: '14px 20px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <p style={{ fontSize: 12, color: '#6B7280', margin: 0 }}>Pending Release</p>
                      <p style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>
                        Awaiting session confirmation
                      </p>
                    </div>
                    <p
                      style={{
                        fontSize: 18,
                        fontWeight: 700,
                        color: '#9CA3AF',
                        fontFamily: 'DM Mono, monospace',
                      }}
                    >
                      {formatINR(data.pendingRelease)}
                    </p>
                  </div>
                </div>
              </>
            ) : null}
          </div>
        )}

        {/* SESSIONS TAB */}
        {tab === 'sessions' && (
          <div>
            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} h={64} radius={12} />)}
              </div>
            ) : !data || data.recentEarnings.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 20px' }}>
                <p style={{ fontSize: 14, color: '#9CA3AF' }}>
                  No session earnings yet. Complete sessions to see your history here.
                </p>
              </div>
            ) : (
              <div
                style={{
                  background: '#FFFFFF',
                  borderRadius: 16,
                  border: '1px solid #E8E0D8',
                  overflow: 'hidden',
                }}
              >
                {data.recentEarnings.map((e, i) => {
                  const isExpanded = expandedId === e.id
                  const serviceName =
                    e.session?.request?.requestServices[0]?.serviceCategory?.name ?? '—'
                  const city = e.session?.request?.elderProfile?.city ?? '—'
                  const s = STATUS_COLORS[e.status] ?? STATUS_COLORS['PENDING']

                  return (
                    <div key={e.id}>
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : e.id)}
                        style={{
                          width: '100%',
                          background: 'none',
                          border: 'none',
                          borderBottom: i < data.recentEarnings.length - 1 ? '1px solid #F9FAFB' : 'none',
                          padding: '14px 16px',
                          textAlign: 'left',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 8,
                        }}
                      >
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 13, fontWeight: 500, color: '#1C2B3A', margin: 0 }}>
                            {serviceName}
                          </p>
                          <p style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>
                            {e.session?.scheduledDate
                              ? new Date(e.session.scheduledDate).toLocaleDateString('en-IN', {
                                  day: 'numeric',
                                  month: 'short',
                                })
                              : '—'}{' '}
                            · {city}
                          </p>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                          <span
                            style={{
                              fontSize: 11,
                              fontWeight: 600,
                              padding: '2px 8px',
                              borderRadius: 9999,
                              background: s.bg,
                              color: s.text,
                            }}
                          >
                            {e.status}
                          </span>
                          <span
                            style={{
                              fontSize: 14,
                              fontWeight: 700,
                              color: '#E07B2F',
                              fontFamily: 'DM Mono, monospace',
                            }}
                          >
                            {formatINR(e.amount)}
                          </span>
                        </div>
                      </button>
                      {isExpanded && (
                        <div
                          style={{
                            background: '#F9FAFB',
                            borderBottom: '1px solid #F3F4F6',
                            padding: '12px 16px',
                          }}
                        >
                          <p style={{ fontSize: 12, color: '#6B7280', margin: 0 }}>
                            Session time:{' '}
                            <strong style={{ color: '#1C2B3A' }}>
                              {e.session?.scheduledTime ?? '—'}
                            </strong>
                          </p>
                          <p style={{ fontSize: 12, color: '#6B7280', marginTop: 4 }}>
                            Created: {relativeTime(e.createdAt)}
                          </p>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* WITHDRAWALS TAB */}
        {tab === 'withdrawals' && (
          <div style={{ textAlign: 'center', padding: '48px 20px' }}>
            <p style={{ fontSize: 32, marginBottom: 12 }}>🏦</p>
            <p style={{ fontSize: 15, color: '#6B7280', fontWeight: 500 }}>
              No withdrawals yet.
            </p>
            <p style={{ fontSize: 13, color: '#9CA3AF', marginTop: 6 }}>
              Once you have earnings available, you can withdraw here.
            </p>
          </div>
        )}

        {/* BONUSES TAB */}
        {tab === 'bonuses' && (
          <div style={{ textAlign: 'center', padding: '48px 20px' }}>
            <p style={{ fontSize: 32, marginBottom: 12 }}>🎁</p>
            <p style={{ fontSize: 15, color: '#6B7280', fontWeight: 500 }}>
              No bonuses yet.
            </p>
            <p style={{ fontSize: 13, color: '#9CA3AF', marginTop: 6 }}>
              Keep delivering great sessions — bonuses will appear here.
            </p>
          </div>
        )}

      </div>

      <BottomNav active="Earnings" />
    </div>
  )
}
