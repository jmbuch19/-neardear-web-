'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface CarePlanUser {
  id: string
  name: string
  phone: string
}

interface CarePlanElder {
  id: string
  name: string
  city: string
  ageRange: string
}

interface NextSession {
  scheduledDate: string
  scheduledTime: string
}

interface CarePlan {
  id: string
  status: string
  frequency: string
  duration: string
  billing: string
  totalSessions: number
  sessionsCompleted: number
  sessionsRemaining: number
  planPricePerVisit: number
  startDate: string | null
  endDate: string | null
  createdAt: string
  user: CarePlanUser
  elderProfile: CarePlanElder | null
  serviceCategoryId: string
  nextSession: NextSession | null
  guaranteedIncome: number
}

interface CarePlansData {
  active: CarePlan[]
  past: CarePlan[]
}

function formatINR(n: number) {
  return `₹${n.toLocaleString('en-IN')}`
}

const FREQUENCY_LABELS: Record<string, string> = {
  ONCE_WEEKLY:    'Once a week',
  TWICE_WEEKLY:   'Twice a week',
  THREE_WEEKLY:   '3 times/week',
  DAILY_WEEKDAYS: 'Daily (weekdays)',
}

const DURATION_LABELS: Record<string, string> = {
  ONE_MONTH:    '1 month',
  THREE_MONTHS: '3 months',
  SIX_MONTHS:   '6 months',
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

function ActivePlanCard({ plan }: { plan: CarePlan }) {
  const elderName = plan.elderProfile?.name ?? plan.user.name
  const city = plan.elderProfile?.city ?? '—'

  return (
    <div
      style={{
        background: '#FFFFFF',
        borderRadius: 16,
        border: '1px solid #E8E0D8',
        padding: '20px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
      }}
    >
      {/* Elder + service */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div>
          <p style={{ fontSize: 16, fontWeight: 700, color: '#1C2B3A', margin: 0 }}>
            {elderName}
          </p>
          <p style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>{city}</p>
        </div>
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            padding: '4px 10px',
            borderRadius: 9999,
            background: plan.status === 'ACTIVE' ? '#F0FAF4' : '#FEF3C7',
            color: plan.status === 'ACTIVE' ? '#166534' : '#92400E',
          }}
        >
          {plan.status}
        </span>
      </div>

      {/* Frequency & duration badges */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
        <span
          style={{
            fontSize: 11,
            padding: '3px 10px',
            borderRadius: 9999,
            background: '#F3F4F6',
            color: '#6B7280',
          }}
        >
          {FREQUENCY_LABELS[plan.frequency] ?? plan.frequency}
        </span>
        <span
          style={{
            fontSize: 11,
            padding: '3px 10px',
            borderRadius: 9999,
            background: '#F3F4F6',
            color: '#6B7280',
          }}
        >
          {DURATION_LABELS[plan.duration] ?? plan.duration}
        </span>
      </div>

      {/* Sessions progress */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontSize: 12, color: '#6B7280' }}>
            {plan.sessionsRemaining} sessions remaining
          </span>
          <span style={{ fontSize: 12, color: '#9CA3AF' }}>
            {plan.sessionsCompleted} / {plan.totalSessions} done
          </span>
        </div>
        <div style={{ height: 6, background: '#F3F4F6', borderRadius: 4, overflow: 'hidden' }}>
          <div
            style={{
              height: '100%',
              width: `${Math.round((plan.sessionsCompleted / plan.totalSessions) * 100)}%`,
              background: '#4A8C6F',
              borderRadius: 4,
            }}
          />
        </div>
      </div>

      {/* Next session */}
      {plan.nextSession && (
        <div
          style={{
            background: '#F0FAF4',
            borderRadius: 10,
            padding: '10px 14px',
            marginBottom: 14,
          }}
        >
          <p style={{ fontSize: 12, color: '#166534', margin: 0 }}>
            Next visit:{' '}
            <strong>
              {new Date(plan.nextSession.scheduledDate).toLocaleDateString('en-IN', {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
              })}{' '}
              at {plan.nextSession.scheduledTime}
            </strong>
          </p>
        </div>
      )}

      {/* Guaranteed income */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <p style={{ fontSize: 11, color: '#9CA3AF', margin: 0 }}>Guaranteed remaining</p>
          <p
            style={{
              fontSize: 20,
              fontWeight: 700,
              color: '#E07B2F',
              fontFamily: 'DM Mono, monospace',
              marginTop: 2,
            }}
          >
            {formatINR(plan.guaranteedIncome)}
          </p>
        </div>
        <Link
          href={`/care-plan/${plan.id}`}
          style={{
            background: '#F3F4F6',
            color: '#1A6B7A',
            fontSize: 12,
            fontWeight: 600,
            padding: '8px 14px',
            borderRadius: 8,
            textDecoration: 'none',
          }}
        >
          View full plan
        </Link>
      </div>
    </div>
  )
}

function PastPlanRow({ plan }: { plan: CarePlan }) {
  const elderName = plan.elderProfile?.name ?? plan.user.name

  return (
    <div
      style={{
        background: '#FAFAFA',
        borderRadius: 12,
        border: '1px solid #E8E0D8',
        padding: '14px 16px',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <p style={{ fontSize: 13, fontWeight: 600, color: '#1C2B3A', margin: 0 }}>{elderName}</p>
          <p style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>
            {FREQUENCY_LABELS[plan.frequency] ?? plan.frequency} · {DURATION_LABELS[plan.duration] ?? plan.duration}
          </p>
          <p style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>
            {plan.startDate
              ? new Date(plan.startDate).toLocaleDateString('en-IN', { month: 'short', year: '2-digit' })
              : '—'}{' '}
            –{' '}
            {plan.endDate
              ? new Date(plan.endDate).toLocaleDateString('en-IN', { month: 'short', year: '2-digit' })
              : '—'}
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ fontSize: 12, color: '#9CA3AF', margin: 0 }}>
            {plan.sessionsCompleted} sessions
          </p>
          <span
            style={{
              fontSize: 10,
              fontWeight: 600,
              padding: '2px 8px',
              borderRadius: 9999,
              background: '#F3F4F6',
              color: '#9CA3AF',
            }}
          >
            {plan.status}
          </span>
        </div>
      </div>
    </div>
  )
}

export default function ProviderCarePlansPage() {
  const [data, setData] = useState<CarePlansData | null>(null)
  const [loading, setLoading] = useState(true)
  const [pastExpanded, setPastExpanded] = useState(false)

  useEffect(() => {
    fetch('/api/provider/care-plans')
      .then((r) => r.json())
      .then((d: CarePlansData) => {
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
          Care Plans
        </h1>
      </div>

      <div style={{ maxWidth: 480, margin: '0 auto', padding: '24px 20px' }}>
        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[1, 2].map((i) => (
              <div key={i} style={{ height: 240, borderRadius: 16, background: '#F3F4F6' }} />
            ))}
          </div>
        )}

        {!loading && data && (
          <>
            {/* Active plans */}
            <p
              style={{
                fontSize: 11,
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: '#1A6B7A',
                marginBottom: 14,
              }}
            >
              Active Plans ({data.active.length})
            </p>

            {data.active.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', marginBottom: 24 }}>
                <p style={{ fontSize: 28, marginBottom: 10 }}>📋</p>
                <p style={{ fontSize: 15, color: '#6B7280' }}>No active care plans yet.</p>
                <p style={{ fontSize: 13, color: '#9CA3AF', marginTop: 4 }}>
                  When a family signs up for a care plan with you, it will appear here.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 28 }}>
                {data.active.map((plan) => (
                  <ActivePlanCard key={plan.id} plan={plan} />
                ))}
              </div>
            )}

            {/* Past plans */}
            {data.past.length > 0 && (
              <div>
                <button
                  onClick={() => setPastExpanded((v) => !v)}
                  style={{
                    width: '100%',
                    background: 'none',
                    border: 'none',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0 0 12px',
                    cursor: 'pointer',
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
                    Past Plans ({data.past.length})
                  </p>
                  <span style={{ fontSize: 14, color: '#9CA3AF' }}>
                    {pastExpanded ? '▲' : '▼'}
                  </span>
                </button>

                {pastExpanded && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {data.past.map((plan) => (
                      <PastPlanRow key={plan.id} plan={plan} />
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      <BottomNav active="" />
    </div>
  )
}
