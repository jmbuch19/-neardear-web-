import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import NearDearLogo from '@/components/NearDearLogo'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-IN', {
    weekday: 'short', month: 'short', day: 'numeric',
  }).format(date)
}

function formatDateLong(date: Date): string {
  return new Intl.DateTimeFormat('en-IN', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  }).format(date)
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
}

function greetingFor(name: string): string {
  const hour = new Date().getHours()
  const first = name.split(' ')[0]
  if (hour < 12) return `Good morning, ${first}`
  if (hour < 17) return `Good afternoon, ${first}`
  return `Good evening, ${first}`
}

// ─── Stage detection ─────────────────────────────────────────────────────────
// Stage 1: 0–1 completed sessions, no care plan
// Stage 2: 2–15 sessions OR active care plan
// Stage 3: 16+ sessions OR 2+ elders OR 2+ distinct companions

function getStage(totalCompleted: number, hasActivePlan: boolean, elderCount: number, companionCount: number): 1 | 2 | 3 {
  if (totalCompleted >= 16 || elderCount >= 2 || companionCount >= 2) return 3
  if (totalCompleted >= 2 || hasActivePlan) return 2
  return 1
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p style={{
      fontSize: 11, fontWeight: 600, textTransform: 'uppercase',
      letterSpacing: '0.08em', color: '#1A6B7A', marginBottom: 12, margin: '0 0 12px',
    }}>
      {children}
    </p>
  )
}

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: '#FFFFFF', borderRadius: 16,
      border: '1px solid #E8E0D8', padding: 20,
      boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
      ...style,
    }}>
      {children}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function DashboardPage() {
  const authSession = await auth()
  if (!authSession?.user?.id) redirect('/login')
  const userId = authSession.user.id

  // Fetch everything in parallel
  const [
    user,
    elderProfiles,
    recentSessions,
    upcomingSession,
    activePlans,
    notifications,
    allCompletedCount,
  ] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { id: true, name: true, phone: true, city: true } }),
    prisma.elderProfile.findMany({
      where: { familyUserId: userId, isActive: true, deletedAt: null },
      orderBy: { createdAt: 'asc' },
      select: { id: true, name: true, city: true, ageRange: true, primaryLanguage: true },
    }),
    prisma.session.findMany({
      where: {
        status: { in: ['COMPLETED', 'NOTE_SUBMITTED', 'CHECKED_OUT', 'CHECKED_IN'] },
        request: { userId },
      },
      include: {
        companion: { select: { id: true, legalName: true, trustLevel: true } },
        sessionNote: { select: { whatDoneToday: true, personWellbeing: true, hasConcern: true } },
        feedback: { select: { overallScore: true } },
        request: {
          include: {
            elderProfile: { select: { id: true, name: true } },
            requestServices: { include: { serviceCategory: { select: { name: true } } } },
          },
        },
        payment: { select: { amount: true } },
      },
      orderBy: { scheduledDate: 'desc' },
      take: 10,
    }),
    prisma.session.findFirst({
      where: {
        status: 'SCHEDULED',
        request: { userId },
      },
      include: {
        companion: { select: { legalName: true } },
        request: {
          include: {
            elderProfile: { select: { name: true } },
            requestServices: { include: { serviceCategory: { select: { name: true } } } },
          },
        },
      },
      orderBy: { scheduledDate: 'asc' },
    }),
    prisma.carePlan.findMany({
      where: { userId, status: 'ACTIVE' },
      include: {
        providerProfile: { select: { id: true, legalName: true } },
        planSessions: {
          where: { status: 'SCHEDULED' },
          orderBy: { scheduledDate: 'asc' },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.notification.findMany({
      where: { userId, readAt: null },
      orderBy: { createdAt: 'desc' },
      take: 3,
      select: { id: true, title: true, body: true, createdAt: true, channel: true },
    }),
    prisma.session.count({
      where: {
        status: { in: ['COMPLETED', 'NOTE_SUBMITTED', 'CHECKED_OUT', 'CHECKED_IN'] },
        request: { userId },
      },
    }),
  ])

  // Care plan service names
  const planServiceNames = await Promise.all(
    activePlans.map((p) =>
      prisma.serviceCategory.findUnique({ where: { id: p.serviceCategoryId }, select: { name: true } })
    )
  )

  // Unique companion IDs from completed sessions
  const companionIdSet: Record<string, true> = {}
  for (const s of recentSessions) companionIdSet[s.companion.id] = true
  const companionIds = Object.keys(companionIdSet)
  const hasActivePlan = activePlans.length > 0

  // Care plan upgrade eligibility (if no plan, check for 3+ sessions with same companion)
  let upgradeCta: { companionId: string; companionName: string; sessionCount: number } | null = null
  if (!hasActivePlan) {
    const counts: Record<string, { name: string; count: number }> = {}
    for (const s of recentSessions) {
      const cid = s.companion.id
      if (counts[cid]) counts[cid].count++
      else counts[cid] = { name: s.companion.legalName, count: 1 }
    }
    for (const [cid, data] of Object.entries(counts)) {
      if (data.count >= 3) { upgradeCta = { companionId: cid, companionName: data.name, sessionCount: data.count }; break }
    }
  }

  const stage = getStage(allCompletedCount, hasActivePlan, elderProfiles.length, companionIds.length)

  // Total spend from all payments
  const totalSpendAgg = await prisma.payment.aggregate({
    where: { userId, status: 'CAPTURED' },
    _sum: { amount: true },
  })
  const totalSpend = totalSpendAgg._sum.amount ?? 0

  // Total savings from all care plans
  const totalSavingsAgg = await prisma.carePlan.aggregate({
    where: { userId },
    _sum: { totalSavings: true },
  })
  const totalSavings = totalSavingsAgg._sum.totalSavings ?? 0

  const userName = user?.name ?? 'Friend'
  const today = new Date()

  return (
    <div style={{ minHeight: '100vh', background: '#FEF8F0', fontFamily: 'DM Sans, sans-serif' }}>

      {/* Header */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 40,
        background: '#FFFFFF', borderBottom: '1px solid #E8E0D8',
        padding: '12px 20px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <NearDearLogo width={120} variant="compact" />
        <div style={{ display: 'flex', gap: 8 }}>
          {notifications.length > 0 && (
            <div style={{
              width: 8, height: 8, borderRadius: '50%',
              background: '#E07B2F', marginTop: 4,
            }} />
          )}
          <Link href="/settings" style={{ color: '#6B7280', textDecoration: 'none' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
            </svg>
          </Link>
        </div>
      </div>

      <div style={{ maxWidth: 560, margin: '0 auto', padding: '28px 20px 120px' }}>

        {/* Greeting */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{
            fontFamily: 'Playfair Display, Georgia, serif',
            fontSize: 26, fontWeight: 700, color: '#1C2B3A',
            margin: '0 0 4px',
          }}>
            {greetingFor(userName)}
          </h1>
          <p style={{ color: '#9CA3AF', fontSize: 13, margin: 0 }}>
            {formatDateLong(today)}
          </p>
        </div>

        {/* ── STAGE 1: First visit — simple, warm, guiding ── */}
        {stage === 1 && (
          <>
            {/* Welcome card */}
            <Card style={{ marginBottom: 20, background: '#1A6B7A', border: 'none' }}>
              <p style={{
                fontSize: 11, fontWeight: 600, textTransform: 'uppercase',
                letterSpacing: '0.08em', color: 'rgba(255,255,255,0.6)', marginBottom: 8,
              }}>
                Welcome to NearDear
              </p>
              <p style={{ fontSize: 17, fontWeight: 600, color: '#FFFFFF', margin: '0 0 6px', lineHeight: 1.4 }}>
                {allCompletedCount === 0
                  ? 'Your first step to peace of mind.'
                  : 'Your first visit is complete.'}
              </p>
              <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.75)', margin: 0, lineHeight: 1.6 }}>
                {allCompletedCount === 0
                  ? 'Book your first session. We match you with a verified companion within hours.'
                  : 'How did it go? Regular visits are available at up to 25% off with a care plan.'}
              </p>
            </Card>

            {/* Elder profiles — prompt if none */}
            {elderProfiles.length === 0 ? (
              <Card style={{ marginBottom: 20, border: '1.5px dashed #E8E0D8' }}>
                <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#1A6B7A', margin: '0 0 8px' }}>
                  First, tell us who needs care
                </p>
                <p style={{ fontSize: 14, color: '#6B7280', margin: '0 0 14px', lineHeight: 1.6 }}>
                  Create an elder profile so we can match the right companion — age, language, preferences and health notes all help.
                </p>
                <Link href="/elder/new" style={{
                  display: 'inline-block', background: '#E07B2F', color: '#FFFFFF',
                  borderRadius: 10, padding: '10px 18px',
                  fontWeight: 600, fontSize: 14, textDecoration: 'none',
                }}>
                  Add elder profile →
                </Link>
              </Card>
            ) : (
              <ElderCard elder={elderProfiles[0]} />
            )}
          </>
        )}

        {/* ── UPCOMING SESSION (shown stage 1+) ── */}
        {upcomingSession && (
          <Card style={{ marginBottom: 20, border: '1.5px solid #E07B2F33' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <SectionLabel>Upcoming visit</SectionLabel>
              <Link href={`/session/${upcomingSession.id}`} style={{ fontSize: 13, color: '#E07B2F', fontWeight: 600, textDecoration: 'none' }}>
                Details →
              </Link>
            </div>
            <p style={{ fontWeight: 700, fontSize: 17, color: '#1C2B3A', margin: '0 0 4px' }}>
              {formatDate(upcomingSession.scheduledDate)} · {upcomingSession.scheduledTime}
            </p>
            <p style={{ fontSize: 14, color: '#6B7280', margin: '0 0 10px' }}>
              {upcomingSession.request.requestServices[0]?.serviceCategory.name ?? 'Session'}
              {upcomingSession.request.elderProfile && ` · ${upcomingSession.request.elderProfile.name}`}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%',
                background: '#4A8C6F', color: '#FFFFFF',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 700, flexShrink: 0,
              }}>
                {getInitials(upcomingSession.companion.legalName)}
              </div>
              <span style={{ fontSize: 14, color: '#1C2B3A', fontWeight: 500 }}>
                {upcomingSession.companion.legalName}
              </span>
            </div>
          </Card>
        )}

        {/* ── ACTIVE CARE PLANS ── */}
        {activePlans.map((plan, i) => (
          <CarePlanCard
            key={plan.id}
            plan={plan}
            serviceName={planServiceNames[i]?.name ?? 'Care Service'}
          />
        ))}

        {/* ── STAGE 2 & 3: Established relationship ── */}
        {stage >= 2 && (
          <>
            {/* Stats row */}
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
              gap: 10, marginBottom: 20,
            }}>
              <StatCard
                label="Sessions"
                value={String(allCompletedCount)}
                color="#1A6B7A"
              />
              <StatCard
                label="Total spent"
                value={`₹${(totalSpend / 1000).toFixed(1)}k`}
                mono
                color="#1C2B3A"
              />
              <StatCard
                label="Saved"
                value={totalSavings > 0 ? `₹${(totalSavings / 1000).toFixed(1)}k` : '—'}
                mono
                color="#4A8C6F"
              />
            </div>

            {/* Care plan upgrade nudge */}
            {upgradeCta && (
              <Card style={{ marginBottom: 20, background: '#FFF7F0', border: '1.5px solid #E07B2F33' }}>
                <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#E07B2F', margin: '0 0 8px' }}>
                  Care plan available
                </p>
                <p style={{ fontWeight: 600, fontSize: 15, color: '#1C2B3A', margin: '0 0 4px' }}>
                  {upgradeCta.sessionCount} visits with {upgradeCta.companionName.split(' ')[0]} — lock in a lower rate
                </p>
                <p style={{ fontSize: 14, color: '#6B7280', margin: '0 0 14px', lineHeight: 1.5 }}>
                  A care plan gives you regular visits at up to 25% off — and guarantees {upgradeCta.companionName.split(' ')[0]}&apos;s availability.
                </p>
                <Link href={`/care-plan/new?companionId=${upgradeCta.companionId}`} style={{
                  display: 'inline-block', background: '#E07B2F', color: '#FFFFFF',
                  borderRadius: 10, padding: '10px 18px',
                  fontWeight: 600, fontSize: 14, textDecoration: 'none',
                }}>
                  Create a care plan →
                </Link>
              </Card>
            )}
          </>
        )}

        {/* ── STAGE 3: Full relationship view ── */}
        {stage >= 3 && elderProfiles.length > 1 && (
          <Card style={{ marginBottom: 20 }}>
            <SectionLabel>Your family members</SectionLabel>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {elderProfiles.map((elder) => (
                <div key={elder.id} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 38, height: 38, borderRadius: '50%',
                    background: '#F0FAF4', border: '1.5px solid #4A8C6F',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 13, fontWeight: 700, color: '#4A8C6F', flexShrink: 0,
                  }}>
                    {getInitials(elder.name)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 600, fontSize: 14, color: '#1C2B3A', margin: 0 }}>{elder.name}</p>
                    <p style={{ fontSize: 12, color: '#9CA3AF', margin: '2px 0 0' }}>{elder.city} · {elder.ageRange}</p>
                  </div>
                  <Link href={`/elder/${elder.id}/care-diary`} style={{
                    fontSize: 12, color: '#4A8C6F', fontWeight: 600,
                    textDecoration: 'none', flexShrink: 0,
                  }}>
                    Diary →
                  </Link>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* ── RECENT SESSIONS ── */}
        {recentSessions.length > 0 && (
          <Card style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <SectionLabel>{stage >= 3 ? 'Full care history' : 'Recent sessions'}</SectionLabel>
              <Link href="/sessions" style={{ fontSize: 13, color: '#E07B2F', fontWeight: 600, textDecoration: 'none' }}>
                All →
              </Link>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {recentSessions.slice(0, stage >= 3 ? 5 : 3).map((s, i) => (
                <SessionRow key={s.id} session={s} isLast={i === Math.min(recentSessions.length, stage >= 3 ? 5 : 3) - 1} />
              ))}
            </div>
          </Card>
        )}

        {/* ── NOTIFICATIONS ── */}
        {notifications.length > 0 && (
          <Card style={{ marginBottom: 20 }}>
            <SectionLabel>Recent notifications</SectionLabel>
            {notifications.map((n) => (
              <div key={n.id} style={{
                borderLeft: '3px solid #E07B2F',
                paddingLeft: 12, marginBottom: 12,
              }}>
                <p style={{ fontWeight: 600, fontSize: 14, color: '#1C2B3A', margin: '0 0 2px' }}>{n.title}</p>
                <p style={{ fontSize: 13, color: '#6B7280', margin: '0 0 4px', lineHeight: 1.5 }}>{n.body}</p>
                <p style={{ fontSize: 11, color: '#9CA3AF', margin: 0 }}>{formatDate(n.createdAt)}</p>
              </div>
            ))}
          </Card>
        )}

        {/* ── STAGE 3: Total relationship card ── */}
        {stage >= 3 && (
          <Card style={{ marginBottom: 20, background: '#1C2B3A', border: 'none' }}>
            <p style={{
              fontSize: 11, fontWeight: 600, textTransform: 'uppercase',
              letterSpacing: '0.08em', color: 'rgba(255,255,255,0.4)', margin: '0 0 12px',
            }}>
              Your NearDear story
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <p style={{ fontSize: 28, fontWeight: 700, color: '#E07B2F', margin: 0, fontFamily: 'DM Mono, monospace' }}>
                  {allCompletedCount}
                </p>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', margin: '4px 0 0' }}>visits completed</p>
              </div>
              <div>
                <p style={{ fontSize: 28, fontWeight: 700, color: '#4A8C6F', margin: 0, fontFamily: 'DM Mono, monospace' }}>
                  {companionIds.length}
                </p>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', margin: '4px 0 0' }}>companions trusted</p>
              </div>
              {totalSavings > 0 && (
                <div style={{ gridColumn: '1 / -1' }}>
                  <p style={{ fontSize: 22, fontWeight: 700, color: '#F0B429', margin: 0, fontFamily: 'DM Mono, monospace' }}>
                    ₹{totalSavings.toLocaleString('en-IN')}
                  </p>
                  <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', margin: '4px 0 0' }}>saved through care plans</p>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* ── QUICK ACTIONS ── */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Link href="/request/new" style={{
            flex: 1, minWidth: 140,
            background: '#E07B2F', color: '#FFFFFF',
            borderRadius: 12, padding: '13px 0',
            fontWeight: 600, fontSize: 15, textDecoration: 'none',
            textAlign: 'center', display: 'block',
          }}>
            Book a visit
          </Link>
          {!hasActivePlan && allCompletedCount >= 1 && (
            <Link href="/care-plan/new" style={{
              flex: 1, minWidth: 140,
              background: '#FFFFFF', color: '#1A6B7A',
              border: '1.5px solid #1A6B7A',
              borderRadius: 12, padding: '13px 0',
              fontWeight: 600, fontSize: 15, textDecoration: 'none',
              textAlign: 'center', display: 'block',
            }}>
              Care plans
            </Link>
          )}
          {stage >= 2 && (
            <Link href="/sessions" style={{
              flex: 1, minWidth: 140,
              background: '#FFFFFF', color: '#1C2B3A',
              border: '1px solid #E8E0D8',
              borderRadius: 12, padding: '13px 0',
              fontWeight: 600, fontSize: 15, textDecoration: 'none',
              textAlign: 'center', display: 'block',
            }}>
              All sessions
            </Link>
          )}
          {stage >= 2 && elderProfiles.length > 0 && (
            <Link href={`/elder/${elderProfiles[0].id}/care-diary`} style={{
              flex: 1, minWidth: 140,
              background: '#FFFFFF', color: '#4A8C6F',
              border: '1.5px solid #4A8C6F',
              borderRadius: 12, padding: '13px 0',
              fontWeight: 600, fontSize: 15, textDecoration: 'none',
              textAlign: 'center', display: 'block',
            }}>
              Care diary
            </Link>
          )}
        </div>

      </div>

      {/* Bottom nav */}
      <BottomNav active="home" />
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ElderCard({ elder }: { elder: { id: string; name: string; city: string; ageRange: string } }) {
  return (
    <div style={{
      background: '#FFFFFF', borderRadius: 16,
      border: '1px solid #E8E0D8', padding: 20,
      marginBottom: 20,
      display: 'flex', alignItems: 'center', gap: 14,
    }}>
      <div style={{
        width: 44, height: 44, borderRadius: '50%',
        background: '#F0FAF4', border: '1.5px solid #4A8C6F',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 15, fontWeight: 700, color: '#4A8C6F', flexShrink: 0,
      }}>
        {getInitials(elder.name)}
      </div>
      <div style={{ flex: 1 }}>
        <p style={{ fontWeight: 600, fontSize: 15, color: '#1C2B3A', margin: 0 }}>{elder.name}</p>
        <p style={{ fontSize: 13, color: '#9CA3AF', margin: '3px 0 0' }}>{elder.city} · {elder.ageRange}</p>
      </div>
      <Link href={`/elder/${elder.id}`} style={{ fontSize: 13, color: '#E07B2F', fontWeight: 600, textDecoration: 'none' }}>
        View →
      </Link>
    </div>
  )
}

function StatCard({ label, value, color, mono }: { label: string; value: string; color: string; mono?: boolean }) {
  return (
    <div style={{
      background: '#FFFFFF', borderRadius: 14,
      border: '1px solid #E8E0D8', padding: '14px 12px',
      textAlign: 'center',
    }}>
      <p style={{
        fontSize: 20, fontWeight: 700, color,
        fontFamily: mono ? 'DM Mono, monospace' : 'DM Sans, sans-serif',
        margin: '0 0 4px', letterSpacing: mono ? '-0.5px' : undefined,
      }}>
        {value}
      </p>
      <p style={{ fontSize: 11, color: '#9CA3AF', margin: 0, fontWeight: 500 }}>{label}</p>
    </div>
  )
}

type SessionRowProps = {
  session: {
    id: string
    scheduledDate: Date
    scheduledTime: string
    companion: { legalName: string }
    sessionNote: { whatDoneToday: string; personWellbeing: string | null; hasConcern: boolean } | null
    feedback: { overallScore: number | null } | null
    request: {
      requestServices: { serviceCategory: { name: string } }[]
      elderProfile: { name: string } | null
    }
    payment: { amount: number } | null
  }
  isLast: boolean
}

function SessionRow({ session, isLast }: SessionRowProps) {
  const serviceName = session.request.requestServices[0]?.serviceCategory.name ?? 'Session'
  const elderName = session.request.elderProfile?.name
  const score = session.feedback?.overallScore
  const hasNote = !!session.sessionNote

  return (
    <Link href={`/session/${session.id}`} style={{ textDecoration: 'none' }}>
      <div style={{
        paddingBottom: isLast ? 0 : 14,
        marginBottom: isLast ? 0 : 14,
        borderBottom: isLast ? 'none' : '1px solid #F3F4F6',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ flex: 1 }}>
            <p style={{ fontWeight: 600, fontSize: 14, color: '#1C2B3A', margin: '0 0 2px' }}>
              {serviceName}{elderName ? ` · ${elderName}` : ''}
            </p>
            <p style={{ fontSize: 12, color: '#9CA3AF', margin: '0 0 6px' }}>
              {formatDate(session.scheduledDate)} · {session.companion.legalName.split(' ')[0]}
            </p>
            {hasNote && (
              <p style={{
                fontSize: 12, color: '#6B7280', margin: 0, lineHeight: 1.5,
                overflow: 'hidden', display: '-webkit-box',
                WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const,
              }}>
                {session.sessionNote!.whatDoneToday.slice(0, 80)}
                {session.sessionNote!.whatDoneToday.length > 80 ? '…' : ''}
              </p>
            )}
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0, paddingLeft: 12 }}>
            {session.payment && (
              <p style={{
                fontFamily: 'DM Mono, monospace', fontSize: 13, fontWeight: 600,
                color: '#1C2B3A', margin: '0 0 4px',
              }}>
                ₹{session.payment.amount.toLocaleString('en-IN')}
              </p>
            )}
            {score && (
              <div style={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <svg key={star} width="10" height="10" viewBox="0 0 24 24" fill={star <= score ? '#F0B429' : '#E8E0D8'}>
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}

type CarePlanCardProps = {
  plan: {
    id: string
    totalSessions: number
    sessionsCompleted: number
    totalSavings: number
    planPricePerVisit: number
    providerProfile: { id: string; legalName: string }
    planSessions: { scheduledDate: Date; scheduledTime: string }[]
  }
  serviceName: string
}

function CarePlanCard({ plan, serviceName }: CarePlanCardProps) {
  const pct = plan.totalSessions > 0
    ? Math.round((plan.sessionsCompleted / plan.totalSessions) * 100) : 0
  const remaining = plan.totalSessions - plan.sessionsCompleted
  const guaranteedIncome = remaining * plan.planPricePerVisit

  return (
    <div style={{
      background: '#FFFFFF', borderRadius: 16,
      border: '1.5px solid #4A8C6F33', padding: 20,
      marginBottom: 20,
      boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <span style={{
          background: '#F0FAF4', color: '#4A8C6F',
          borderRadius: 9999, padding: '3px 10px',
          fontSize: 11, fontWeight: 600,
          display: 'inline-flex', alignItems: 'center', gap: 4,
        }}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6L9 17l-5-5"/>
          </svg>
          Active care plan
        </span>
        <Link href={`/care-plan/${plan.id}`} style={{ fontSize: 13, color: '#E07B2F', fontWeight: 600, textDecoration: 'none' }}>
          View →
        </Link>
      </div>

      <p style={{ fontWeight: 600, fontSize: 16, color: '#1C2B3A', margin: '0 0 2px' }}>{serviceName}</p>
      <p style={{ fontSize: 13, color: '#6B7280', margin: '0 0 14px' }}>
        with {plan.providerProfile.legalName}
      </p>

      {/* Progress */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
          <span style={{ fontSize: 12, color: '#6B7280' }}>{plan.sessionsCompleted} of {plan.totalSessions} visits</span>
          <span style={{ fontSize: 12, color: '#6B7280' }}>{pct}%</span>
        </div>
        <div style={{ height: 6, background: '#F3F4F6', borderRadius: 9999, overflow: 'hidden' }}>
          <div style={{ height: '100%', background: '#4A8C6F', borderRadius: 9999, width: `${pct}%` }} />
        </div>
      </div>

      {/* Next session */}
      {plan.planSessions[0] && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#E07B2F', flexShrink: 0 }} />
          <span style={{ fontSize: 13, color: '#1C2B3A', fontWeight: 500 }}>
            Next: {formatDate(plan.planSessions[0].scheduledDate)} · {plan.planSessions[0].scheduledTime}
          </span>
        </div>
      )}

      {/* Stats row */}
      <div style={{ display: 'flex', gap: 8 }}>
        <div style={{ flex: 1, background: '#F0FAF4', borderRadius: 10, padding: '8px 12px' }}>
          <p style={{ fontSize: 11, color: '#4A8C6F', margin: '0 0 2px' }}>Saved so far</p>
          <p style={{ fontSize: 15, fontWeight: 700, color: '#4A8C6F', margin: 0, fontFamily: 'DM Mono, monospace' }}>
            ₹{plan.totalSavings.toLocaleString('en-IN')}
          </p>
        </div>
        <div style={{ flex: 1, background: '#FEF8F0', borderRadius: 10, padding: '8px 12px' }}>
          <p style={{ fontSize: 11, color: '#6B7280', margin: '0 0 2px' }}>Remaining</p>
          <p style={{ fontSize: 15, fontWeight: 700, color: '#E07B2F', margin: 0, fontFamily: 'DM Mono, monospace' }}>
            ₹{guaranteedIncome.toLocaleString('en-IN')}
          </p>
        </div>
      </div>
    </div>
  )
}

function BottomNav({ active }: { active: 'home' | 'sessions' | 'plans' | 'account' }) {
  const items = [
    { key: 'home', label: 'Home', href: '/dashboard', icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    )},
    { key: 'sessions', label: 'Sessions', href: '/sessions', icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
      </svg>
    )},
    { key: 'plans', label: 'Care plans', href: '/care-plan/new', icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
      </svg>
    )},
    { key: 'account', label: 'Account', href: '/settings', icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
      </svg>
    )},
  ] as const

  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      background: '#FFFFFF', borderTop: '1px solid #E8E0D8',
      display: 'flex', zIndex: 50,
      paddingBottom: 'env(safe-area-inset-bottom)',
    }}>
      {items.map((item) => {
        const isActive = item.key === active
        return (
          <Link key={item.key} href={item.href} style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            padding: '10px 4px 8px',
            color: isActive ? '#E07B2F' : '#9CA3AF',
            textDecoration: 'none',
          }}>
            {item.icon}
            <span style={{ fontSize: 10, fontWeight: isActive ? 600 : 400, marginTop: 3 }}>
              {item.label}
            </span>
          </Link>
        )
      })}
    </div>
  )
}
