'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface FeedbackSession {
  scheduledDate: string
  request: {
    requestServices: Array<{ serviceCategory: { name: string } }>
  }
}

interface RecentFeedback {
  id: string
  overallScore: number | null
  concernText: string | null
  hasConcern: boolean
  createdAt: string
  session: FeedbackSession
}

interface PerformanceData {
  reliabilityScore: number
  totalSessions: number
  avgFeedbackScore: number | null
  advanceCancellations: number
  shortNoticeCancels: number
  noShowCount: number
  selfArrangedCovers: number
  recentFeedback: RecentFeedback[]
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

/** Circular progress ring using SVG */
function ReliabilityRing({ score }: { score: number }) {
  const size = 160
  const strokeWidth = 14
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const pct = Math.max(0, Math.min(100, score))
  const dashOffset = circumference - (pct / 100) * circumference
  const color = pct >= 80 ? '#4A8C6F' : pct >= 60 ? '#E07B2F' : '#E85D4A'

  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#F3F4F6"
          strokeWidth={strokeWidth}
        />
        {/* Arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
        />
      </svg>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <span
          style={{
            fontSize: 32,
            fontWeight: 700,
            color,
            fontFamily: 'DM Mono, monospace',
            lineHeight: 1,
          }}
        >
          {Math.round(pct)}
        </span>
        <span style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>/ 100</span>
      </div>
    </div>
  )
}

function Stars({ score }: { score: number | null }) {
  if (score === null) return <span style={{ fontSize: 12, color: '#9CA3AF' }}>No ratings yet</span>
  const filled = Math.round(score)
  return (
    <span>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} style={{ color: i <= filled ? '#E07B2F' : '#D1D5DB', fontSize: 16 }}>
          ★
        </span>
      ))}
    </span>
  )
}

function MetricCard({
  label,
  value,
  positive,
  invert,
}: {
  label: string
  value: number | string
  positive?: boolean
  invert?: boolean
}) {
  const numVal = typeof value === 'number' ? value : 0
  const isAlert = invert ? numVal > 0 : false
  const isGood = positive

  return (
    <div
      style={{
        background: '#FFFFFF',
        borderRadius: 14,
        border: `1px solid ${isAlert ? '#E85D4A30' : '#E8E0D8'}`,
        padding: '14px 14px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
      }}
    >
      <p style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#1A6B7A', margin: 0 }}>
        {label}
      </p>
      <p
        style={{
          fontSize: 22,
          fontWeight: 700,
          color: isAlert ? '#E85D4A' : isGood ? '#4A8C6F' : '#1C2B3A',
          fontFamily: 'DM Mono, monospace',
          marginTop: 4,
        }}
      >
        {value}
      </p>
    </div>
  )
}

export default function ProviderPerformancePage() {
  const [data, setData] = useState<PerformanceData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/provider/performance')
      .then((r) => r.json())
      .then((d: PerformanceData) => {
        setData(d)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

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
        <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 18, fontWeight: 700, color: '#1C2B3A', margin: 0 }}>
          Performance
        </h1>
      </div>

      <div style={{ maxWidth: 480, margin: '0 auto', padding: '24px 20px' }}>
        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ height: 200, borderRadius: 16, background: '#F3F4F6' }} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} style={{ height: 80, borderRadius: 14, background: '#F3F4F6' }} />
              ))}
            </div>
          </div>
        )}

        {!loading && data && (
          <>
            {/* Reliability ring */}
            <div
              style={{
                background: '#FFFFFF',
                borderRadius: 16,
                border: '1px solid #E8E0D8',
                padding: '24px 20px',
                marginBottom: 20,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
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
                  marginBottom: 16,
                }}
              >
                Reliability Score
              </p>
              <ReliabilityRing score={data.reliabilityScore} />
              <p style={{ fontSize: 13, color: '#6B7280', marginTop: 14, textAlign: 'center' }}>
                {data.reliabilityScore >= 90
                  ? 'Excellent — you are one of our most reliable companions!'
                  : data.reliabilityScore >= 75
                  ? 'Good — keep up the consistent sessions.'
                  : 'Your score needs attention — check your cancellations below.'}
              </p>
            </div>

            {/* Metric grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
              <MetricCard label="Sessions Completed" value={data.totalSessions} positive />
              <MetricCard
                label="Avg Feedback"
                value={data.avgFeedbackScore !== null ? `${data.avgFeedbackScore.toFixed(1)}/5` : '—'}
                positive={data.avgFeedbackScore !== null && data.avgFeedbackScore >= 4}
              />
              <MetricCard
                label="Advance Cancels"
                value={data.advanceCancellations}
                invert
              />
              <MetricCard
                label="Short Notice Cancels"
                value={data.shortNoticeCancels}
                invert
              />
              <MetricCard label="No-shows" value={data.noShowCount} invert />
              <MetricCard label="Self Covers" value={data.selfArrangedCovers} positive />
            </div>

            {/* Covers message */}
            {data.selfArrangedCovers > 0 && (
              <div
                style={{
                  background: '#F0FAF4',
                  border: '1px solid #C6E4D6',
                  borderRadius: 12,
                  padding: '12px 16px',
                  marginBottom: 20,
                }}
              >
                <p style={{ fontSize: 13, color: '#166534', fontWeight: 500, margin: 0 }}>
                  You arranged {data.selfArrangedCovers} cover
                  {data.selfArrangedCovers !== 1 ? 's' : ''} — thank you for being responsible.
                </p>
              </div>
            )}

            {/* Recent feedback */}
            <div>
              <p
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: '#1A6B7A',
                  marginBottom: 12,
                }}
              >
                Recent Feedback
              </p>

              {data.recentFeedback.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px 20px' }}>
                  <p style={{ fontSize: 14, color: '#9CA3AF' }}>
                    No feedback received yet. It will appear here after sessions are rated.
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
                  {data.recentFeedback.map((fb, i) => {
                    const serviceName =
                      fb.session?.request?.requestServices[0]?.serviceCategory?.name ?? 'Visit'
                    return (
                      <div
                        key={fb.id}
                        style={{
                          padding: '14px 16px',
                          borderBottom: i < data.recentFeedback.length - 1 ? '1px solid #F9FAFB' : 'none',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div>
                            <p style={{ fontSize: 13, fontWeight: 500, color: '#1C2B3A', margin: 0 }}>
                              {serviceName}
                            </p>
                            <p style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>
                              {new Date(fb.session.scheduledDate).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                              })}
                            </p>
                          </div>
                          <Stars score={fb.overallScore} />
                        </div>
                        {fb.concernText && (
                          <p
                            style={{
                              fontSize: 12,
                              color: '#6B7280',
                              marginTop: 8,
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                            }}
                          >
                            {fb.concernText}
                          </p>
                        )}
                        {fb.hasConcern && (
                          <span
                            style={{
                              display: 'inline-block',
                              marginTop: 6,
                              fontSize: 10,
                              fontWeight: 600,
                              padding: '2px 8px',
                              borderRadius: 9999,
                              background: '#FEF2F2',
                              color: '#E85D4A',
                            }}
                          >
                            Concern flagged
                          </span>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <BottomNav active="Performance" />
    </div>
  )
}
