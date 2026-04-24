'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useLanguage } from '@/lib/language'
import { MatchResult } from '@/lib/matching'
import { calculatePlan } from '@/lib/carePlan'

interface ServiceInfo {
  id: string
  name: string
  slug: string
  suggestedFeeMin: number
}

interface MatchesResponse {
  matches: MatchResult[]
  request: {
    serviceCity: string
    elderName: string | null
  }
  service: ServiceInfo | null
}

interface PlanNudge {
  sessionId: string
  companionId: string
  companionName: string
  service: ServiceInfo
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
}

function TrustBadge({ level }: { level: string }) {
  const configs: Record<string, { bg: string; text: string; label: string }> = {
    LEVEL_0: { bg: '#F3F4F6', text: '#4B5563', label: 'New Companion' },
    LEVEL_1: { bg: '#DBEAFE', text: '#1D4ED8', label: 'Field Verified' },
    LEVEL_2: { bg: '#1A6B7A', text: '#FFFFFF', label: 'Home Trusted' },
    LEVEL_3: { bg: '#F0B429', text: '#1C2B3A', label: 'Senior Companion' },
  }

  const config = configs[level] ?? configs['LEVEL_0']

  return (
    <span
      style={{
        background: config.bg,
        color: config.text,
        borderRadius: 9999,
        padding: '2px 8px',
        fontSize: 11,
        fontWeight: 600,
        display: 'inline-block',
      }}
    >
      {config.label}
    </span>
  )
}

function SkeletonCard() {
  return (
    <div
      style={{
        background: '#FFFFFF',
        borderRadius: 16,
        border: '1px solid #E8E0D8',
        padding: 24,
        marginBottom: 16,
      }}
    >
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        <div
          className="animate-pulse"
          style={{ width: 56, height: 56, borderRadius: '50%', background: '#E8E0D8', flexShrink: 0 }}
        />
        <div style={{ flex: 1 }}>
          <div className="animate-pulse" style={{ height: 18, background: '#E8E0D8', borderRadius: 8, marginBottom: 8, width: '60%' }} />
          <div className="animate-pulse" style={{ height: 14, background: '#E8E0D8', borderRadius: 8, marginBottom: 6, width: '40%' }} />
          <div className="animate-pulse" style={{ height: 12, background: '#E8E0D8', borderRadius: 8, width: '50%' }} />
        </div>
      </div>
      <div className="animate-pulse" style={{ height: 40, background: '#E8E0D8', borderRadius: 8, marginTop: 16 }} />
      <div className="animate-pulse" style={{ height: 44, background: '#E8E0D8', borderRadius: 12, marginTop: 16 }} />
    </div>
  )
}

function MatchCard({
  match,
  lang,
  onSelect,
  selecting,
}: {
  match: MatchResult
  lang: string
  onSelect: (companionId: string, firstName: string) => void
  selecting: string | null
}) {
  const { companion, cardCopy } = match
  const firstName = companion.legalName.split(' ')[0]
  const occupation =
    companion.occupationCurrent ??
    companion.occupationPast ??
    companion.currentStatus ??
    ''
  const isLoading = selecting === companion.id

  return (
    <div
      style={{
        background: '#FFFFFF',
        borderRadius: 16,
        border: '1px solid #E8E0D8',
        padding: 24,
        marginBottom: 16,
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
      }}
    >
      {/* Top row */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        {/* Avatar */}
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            background: '#4A8C6F',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: 18,
            flexShrink: 0,
          }}
        >
          {getInitials(companion.legalName)}
        </div>

        {/* Name + badge + occupation */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
            <span style={{ fontWeight: 600, fontSize: 18, color: '#1C2B3A', fontFamily: 'DM Sans, sans-serif' }}>
              {companion.legalName}
            </span>
            <TrustBadge level={companion.trustLevel} />
          </div>
          {occupation ? (
            <p style={{ fontSize: 13, color: '#6B7280', margin: 0 }}>{occupation}</p>
          ) : null}
        </div>
      </div>

      {/* Card copy */}
      <p
        style={{
          marginTop: 12,
          fontSize: 14,
          color: '#1C2B3A',
          fontStyle: 'italic',
          lineHeight: 1.6,
        }}
      >
        {lang === 'GU' && cardCopy.gu ? cardCopy.gu : cardCopy.en}
      </p>

      {/* Service pills */}
      {(companion.hardSkills.length > 0 || companion.softSkills.length > 0) && (
        <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {companion.hardSkills.slice(0, 3).map((skill) => (
            <span
              key={skill}
              style={{
                background: 'rgba(26,107,122,0.1)',
                color: '#1A6B7A',
                borderRadius: 9999,
                padding: '2px 8px',
                fontSize: 11,
              }}
            >
              {skill.replace(/_/g, ' ')}
            </span>
          ))}
          {companion.softSkills.slice(0, 2).map((skill) => (
            <span
              key={skill}
              style={{
                background: 'rgba(26,107,122,0.1)',
                color: '#1A6B7A',
                borderRadius: 9999,
                padding: '2px 8px',
                fontSize: 11,
              }}
            >
              {skill.replace(/_/g, ' ')}
            </span>
          ))}
        </div>
      )}

      {/* Stats */}
      <div
        style={{
          marginTop: 12,
          paddingTop: 12,
          borderTop: '1px solid #E8E0D8',
          display: 'flex',
          gap: 16,
          alignItems: 'center',
        }}
      >
        <span style={{ fontSize: 13, color: '#6B7280', fontFamily: 'DM Mono, monospace' }}>
          {companion.totalSessions} sessions completed
        </span>
        {companion.avgFeedbackScore !== null && companion.avgFeedbackScore !== undefined && (
          <span style={{ fontSize: 13, color: '#6B7280', fontFamily: 'DM Mono, monospace' }}>
            ⭐ {companion.avgFeedbackScore.toFixed(1)}/5
          </span>
        )}
      </div>

      {/* Request button */}
      <button
        onClick={() => onSelect(companion.id, firstName)}
        disabled={isLoading || selecting !== null}
        style={{
          marginTop: 16,
          width: '100%',
          background: isLoading ? '#C4600A' : '#E07B2F',
          color: '#FFFFFF',
          borderRadius: 12,
          padding: '12px 0',
          fontWeight: 600,
          fontSize: 15,
          border: 'none',
          cursor: isLoading || selecting !== null ? 'not-allowed' : 'pointer',
          opacity: selecting !== null && !isLoading ? 0.6 : 1,
          transition: 'all 0.15s ease',
        }}
      >
        {isLoading ? 'Requesting...' : `Request ${firstName}`}
      </button>
    </div>
  )
}

export default function MatchesPage() {
  const params = useParams<{ id: string }>()
  const id = params?.id ?? ''
  const router = useRouter()
  const { lang } = useLanguage()

  const [loading, setLoading] = useState(true)
  const [matches, setMatches] = useState<MatchResult[]>([])
  const [requestData, setRequestData] = useState<{ serviceCity: string; elderName: string | null } | null>(null)
  const [serviceInfo, setServiceInfo] = useState<ServiceInfo | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [selecting, setSelecting] = useState<string | null>(null)
  const [selectError, setSelectError] = useState<string | null>(null)
  const [showMore, setShowMore] = useState(false)
  const [planNudge, setPlanNudge] = useState<PlanNudge | null>(null)

  useEffect(() => {
    if (!id) return

    setLoading(true)
    fetch(`/api/requests/${id}/matches`)
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json().catch(() => ({})) as { error?: string }
          throw new Error(data.error ?? 'Failed to load matches')
        }
        return res.json() as Promise<MatchesResponse>
      })
      .then((data) => {
        setMatches(data.matches)
        setRequestData(data.request)
        setServiceInfo(data.service)
      })
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : 'Failed to load matches'
        setError(message)
      })
      .finally(() => setLoading(false))
  }, [id])

  async function selectCompanion(companionId: string, companionName: string) {
    setSelecting(companionId)
    setSelectError(null)
    try {
      const res = await fetch(`/api/requests/${id}/select-companion`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companionId }),
      })
      const data = await res.json() as { sessionId?: string; error?: string }
      if (res.ok && data.sessionId) {
        // Show care plan nudge if service info is available
        if (serviceInfo) {
          setPlanNudge({
            sessionId: data.sessionId,
            companionId,
            companionName,
            service: serviceInfo,
          })
        } else {
          router.push(`/session/${data.sessionId}`)
        }
      } else {
        setSelectError(data.error ?? 'Something went wrong. Please try again.')
      }
    } catch {
      setSelectError('Something went wrong. Please try again.')
    } finally {
      setSelecting(null)
    }
  }

  const city = requestData?.serviceCity ?? ''

  // Care plan nudge overlay (shown after companion selection)
  if (planNudge) {
    const exampleCalc = calculatePlan(planNudge.service.suggestedFeeMin, 'TWICE_WEEKLY', 'THREE_MONTHS', 'MONTHLY')
    const planUrl = `/care-plan/create?serviceId=${planNudge.service.id}&serviceName=${encodeURIComponent(planNudge.service.name)}&companionId=${planNudge.companionId}&companionName=${encodeURIComponent(planNudge.companionName)}&pricePerVisit=${planNudge.service.suggestedFeeMin}`
    return (
      <div style={{ minHeight: '100vh', background: '#FEF8F0', padding: '40px 24px' }}>
        <div style={{ maxWidth: 480, margin: '0 auto' }}>
          {/* Success badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%', background: '#4A8C6F',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6L9 17l-5-5" />
              </svg>
            </div>
            <span style={{ fontSize: 15, fontWeight: 600, color: '#4A8C6F' }}>
              {planNudge.companionName.split(' ')[0]} has been requested
            </span>
          </div>

          <h1 style={{
            fontFamily: 'Playfair Display, Georgia, serif',
            fontWeight: 700, fontSize: 26, color: '#1C2B3A',
            marginBottom: 8, lineHeight: 1.3,
          }}>
            You selected {planNudge.service.name}.<br />
            Planning regular visits?
          </h1>
          <p style={{ color: '#6B7280', fontSize: 15, marginBottom: 24, lineHeight: 1.6 }}>
            A care plan locks in {planNudge.companionName.split(' ')[0]} for recurring visits at a lower rate.
          </p>

          {/* Savings card */}
          <div style={{
            background: '#FFFFFF', borderRadius: 16, border: '1px solid #E8E0D8',
            padding: 20, marginBottom: 20,
          }}>
            <p style={{
              fontSize: 11, fontWeight: 600, textTransform: 'uppercase',
              letterSpacing: '0.08em', color: '#1A6B7A', marginBottom: 12,
            }}>
              Example — twice a week, 3 months
            </p>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 14, color: '#6B7280' }}>Regular price</span>
              <span style={{ fontSize: 14, color: '#9CA3AF', fontFamily: 'DM Mono, monospace', textDecoration: 'line-through' }}>
                ₹{exampleCalc.totalRegularPrice.toLocaleString('en-IN')}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ fontSize: 14, color: '#1C2B3A', fontWeight: 600 }}>Plan price (12% off)</span>
              <span style={{ fontSize: 14, color: '#1C2B3A', fontWeight: 700, fontFamily: 'DM Mono, monospace' }}>
                ₹{exampleCalc.totalPlanPrice.toLocaleString('en-IN')}
              </span>
            </div>
            <div style={{
              background: '#F0FAF4', borderRadius: 10, padding: '10px 14px',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: '#4A8C6F' }}>You could save</span>
              <span style={{ fontSize: 16, fontWeight: 700, color: '#4A8C6F', fontFamily: 'DM Mono, monospace' }}>
                ₹{exampleCalc.totalSavings.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <a
              href={planUrl}
              style={{
                display: 'block', background: '#E07B2F', color: '#FFFFFF',
                borderRadius: 12, padding: '14px 0', fontWeight: 600,
                fontSize: 15, textAlign: 'center', textDecoration: 'none',
              }}
            >
              Create a care plan →
            </a>
            <button
              onClick={() => router.push(`/session/${planNudge.sessionId}`)}
              style={{
                background: '#FFFFFF', color: '#1C2B3A', border: '1px solid #E8E0D8',
                borderRadius: 12, padding: '13px 0', fontWeight: 500,
                fontSize: 15, cursor: 'pointer',
              }}
            >
              Continue to this session
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Loading state
  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#FEF8F0', padding: '40px 24px' }}>
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <div className="animate-pulse" style={{ height: 32, background: '#E8E0D8', borderRadius: 8, marginBottom: 12, width: '70%' }} />
          <div className="animate-pulse" style={{ height: 18, background: '#E8E0D8', borderRadius: 8, marginBottom: 32, width: '50%' }} />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div style={{ minHeight: '100vh', background: '#FEF8F0', padding: '40px 24px' }}>
        <div style={{ maxWidth: 600, margin: '0 auto', textAlign: 'center' }}>
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: 16,
              border: '1px solid #E8E0D8',
              padding: 32,
            }}
          >
            <p style={{ color: '#E85D4A', marginBottom: 8, fontWeight: 600 }}>Something went wrong</p>
            <p style={{ color: '#6B7280', fontSize: 14 }}>{error}</p>
          </div>
        </div>
      </div>
    )
  }

  // Empty state
  if (matches.length === 0) {
    return (
      <div style={{ minHeight: '100vh', background: '#FEF8F0', padding: '40px 24px' }}>
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: 16,
              border: '1px solid #E8E0D8',
              padding: 32,
              textAlign: 'center',
            }}
          >
            <p
              style={{
                fontWeight: 600,
                fontSize: 18,
                color: '#1C2B3A',
                marginBottom: 12,
                fontFamily: 'Playfair Display, Georgia, serif',
              }}
            >
              No companions available in {city} for this service yet.
            </p>
            <p style={{ color: '#6B7280', fontSize: 14, marginBottom: 24, lineHeight: 1.6 }}>
              We are building our companion network in {city}. Leave your number and we will
              notify you when someone is available.
            </p>
            <button
              style={{
                border: '2px solid #1A6B7A',
                color: '#1A6B7A',
                background: 'transparent',
                borderRadius: 12,
                padding: '10px 24px',
                fontWeight: 600,
                cursor: 'pointer',
                fontSize: 15,
              }}
            >
              Notify me when available
            </button>
          </div>
        </div>
      </div>
    )
  }

  const topMatches = matches.slice(0, 3)
  const extraMatches = matches.slice(3)

  return (
    <div style={{ minHeight: '100vh', background: '#FEF8F0', padding: '40px 24px' }}>
      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        {/* Header */}
        <h1
          style={{
            fontFamily: 'Playfair Display, Georgia, serif',
            fontWeight: 700,
            fontSize: 28,
            color: '#1C2B3A',
            marginBottom: 8,
            lineHeight: 1.3,
          }}
        >
          We found {matches.length} companion{matches.length !== 1 ? 's' : ''} for you in {city}
        </h1>
        <p
          style={{
            fontFamily: 'DM Sans, sans-serif',
            color: '#6B7280',
            fontSize: 16,
            marginBottom: 32,
          }}
        >
          Here are the best matches based on your needs
        </p>

        {selectError && (
          <div
            style={{
              background: '#FEF2F2',
              border: '1px solid #FECACA',
              borderRadius: 12,
              padding: '12px 16px',
              marginBottom: 16,
              color: '#E85D4A',
              fontSize: 14,
            }}
          >
            {selectError}
          </div>
        )}

        {/* Top 3 matches */}
        {topMatches.map((match) => (
          <MatchCard
            key={match.companion.id}
            match={match}
            lang={lang}
            onSelect={selectCompanion}
            selecting={selecting}
          />
        ))}

        {/* Care plan banner — below all cards */}
        <div style={{
          background: '#FFFFFF', borderRadius: 16,
          border: '1px solid #E8E0D8', padding: '16px 20px',
          marginBottom: 16, marginTop: 4,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
          flexWrap: 'wrap',
        }}>
          <p style={{ fontSize: 14, color: '#6B7280', margin: 0, lineHeight: 1.5 }}>
            Need regular visits?{' '}
            <strong style={{ color: '#1C2B3A' }}>Care plans save up to 25%.</strong>
          </p>
          <a
            href={serviceInfo
              ? `/care-plan/new?serviceId=${serviceInfo.id}`
              : '/care-plan/new'}
            style={{
              color: '#E07B2F', fontWeight: 600, fontSize: 14,
              textDecoration: 'none', whiteSpace: 'nowrap' as const,
              flexShrink: 0,
            }}
          >
            Compare plan options →
          </a>
        </div>

        {/* Collapsible extra matches */}
        {extraMatches.length > 0 && (
          <div style={{ marginTop: 8 }}>
            <button
              onClick={() => setShowMore((prev) => !prev)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#1A6B7A',
                fontWeight: 600,
                fontSize: 15,
                cursor: 'pointer',
                padding: '8px 0',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              {showMore
                ? `Hide extra options ▲`
                : `See ${extraMatches.length} more option${extraMatches.length !== 1 ? 's' : ''} ▼`}
            </button>

            {showMore &&
              extraMatches.map((match) => (
                <MatchCard
                  key={match.companion.id}
                  match={match}
                  lang={lang}
                  onSelect={selectCompanion}
                  selecting={selecting}
                />
              ))}
          </div>
        )}
      </div>
    </div>
  )
}
