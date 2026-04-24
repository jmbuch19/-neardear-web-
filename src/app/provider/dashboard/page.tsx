import { redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import NearDearLogo from '@/components/NearDearLogo'
import AvailableNowToggle from './AvailableNowToggle'

const TRUST_LABELS: Record<string, string> = {
  LEVEL_0: 'New Companion',
  LEVEL_1: 'Field Verified',
  LEVEL_2: 'Home Trusted',
  LEVEL_3: 'Senior Companion',
}

const TRUST_SESSIONS_NEEDED: Record<string, number> = {
  LEVEL_0: 10,
  LEVEL_1: 25,
  LEVEL_2: 50,
  LEVEL_3: 999,
}

function formatINR(amount: number) {
  return `₹${amount.toLocaleString('en-IN')}`
}

function greetingText() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

function formatDate(d: Date) {
  return d.toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}

export default async function ProviderDashboardPage() {
  const authSession = await auth()
  if (!authSession?.user?.id) redirect('/login')

  const provider = await prisma.providerProfile.findUnique({
    where: { userId: authSession.user.id },
    include: {
      user: { select: { name: true } },
      earnings: {
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          session: {
            select: {
              scheduledDate: true,
              request: {
                select: {
                  requestServices: {
                    include: { serviceCategory: { select: { name: true } } },
                    take: 1,
                  },
                  elderProfile: { select: { name: true, city: true } },
                },
              },
            },
          },
        },
      },
      carePlans: {
        where: { status: 'ACTIVE' },
        take: 5,
      },
    },
  })

  if (!provider) redirect('/provider/apply')

  // Today's sessions
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const todayEnd = new Date()
  todayEnd.setHours(23, 59, 59, 999)

  const todaySessions = await prisma.session.findMany({
    where: {
      companionId: provider.id,
      scheduledDate: { gte: todayStart, lte: todayEnd },
      status: { in: ['SCHEDULED', 'CHECKED_IN', 'CHECKED_OUT'] },
    },
    include: {
      request: {
        select: {
          requestServices: {
            include: { serviceCategory: { select: { name: true } } },
            take: 1,
          },
          elderProfile: { select: { name: true, city: true } },
        },
      },
    },
    orderBy: { scheduledTime: 'asc' },
  })

  // Recent notifications (last 3)
  const recentNotifications = await prisma.notification.findMany({
    where: { userId: authSession.user.id },
    orderBy: { createdAt: 'desc' },
    take: 3,
  })

  // Stats: this month earnings + sessions
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const thisMonthAgg = await prisma.earning.aggregate({
    where: {
      providerProfileId: provider.id,
      createdAt: { gte: startOfMonth },
      status: { in: ['RELEASED', 'PROCESSING', 'PAID'] },
    },
    _sum: { amount: true },
    _count: true,
  })

  const availableToWithdraw = await prisma.earning.aggregate({
    where: { providerProfileId: provider.id, status: 'RELEASED' },
    _sum: { amount: true },
  })

  const thisMonthEarnings = thisMonthAgg._sum.amount ?? 0
  const sessionsThisMonth = thisMonthAgg._count
  const withdrawable = availableToWithdraw._sum.amount ?? 0

  // Trust level progress
  const trustLevel = provider.trustLevel as string
  const sessionsNeeded = TRUST_SESSIONS_NEEDED[trustLevel] ?? 999
  const progressPct = Math.min(100, Math.round((provider.totalSessions / sessionsNeeded) * 100))

  // Active care plans summary
  const activePlans = provider.carePlans
  const totalGuaranteedIncome = activePlans.reduce(
    (sum, p) => sum + p.sessionsRemaining * p.planPricePerVisit,
    0
  )

  const firstName = (provider.user?.name ?? provider.legalName).split(' ')[0]

  const navLinks = [
    { href: '/provider/dashboard', label: 'Dashboard', active: true },
    { href: '/provider/earnings', label: 'Earnings', active: false },
    { href: '/provider/performance', label: 'Performance', active: false },
    { href: '/provider/account', label: 'Account', active: false },
  ]

  return (
    <div style={{ minHeight: '100vh', background: '#FEF8F0', paddingBottom: 80 }}>
      {/* Sticky header */}
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
        <NearDearLogo width={100} variant="compact" />
        <span style={{ fontSize: 14, fontWeight: 600, color: '#6B7280' }}>Dashboard</span>
      </div>

      {/* Page body */}
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '24px 20px' }}>

        {/* Greeting */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1C2B3A', margin: 0 }}>
            {greetingText()}, {firstName}
          </h1>
          <p style={{ fontSize: 13, color: '#6B7280', marginTop: 4 }}>{formatDate(new Date())}</p>
        </div>

        {/* Available Now Toggle */}
        <AvailableNowToggle initial={provider.availableNow} />

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 24 }}>
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: 16,
              border: '1px solid #E8E0D8',
              padding: '14px 12px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
            }}
          >
            <p style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#1A6B7A', margin: 0 }}>
              This Month
            </p>
            <p
              style={{
                fontSize: 16,
                fontWeight: 700,
                color: '#E07B2F',
                fontFamily: 'DM Mono, monospace',
                marginTop: 4,
              }}
            >
              {formatINR(thisMonthEarnings)}
            </p>
          </div>
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: 16,
              border: '1px solid #E8E0D8',
              padding: '14px 12px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
            }}
          >
            <p style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#1A6B7A', margin: 0 }}>
              Sessions
            </p>
            <p
              style={{
                fontSize: 16,
                fontWeight: 700,
                color: '#1C2B3A',
                fontFamily: 'DM Mono, monospace',
                marginTop: 4,
              }}
            >
              {sessionsThisMonth}
            </p>
          </div>
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: 16,
              border: '1px solid #E8E0D8',
              padding: '14px 12px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
            }}
          >
            <p style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#1A6B7A', margin: 0 }}>
              Reliability
            </p>
            <p
              style={{
                fontSize: 16,
                fontWeight: 700,
                color: provider.reliabilityScore >= 80 ? '#4A8C6F' : '#E85D4A',
                fontFamily: 'DM Mono, monospace',
                marginTop: 4,
              }}
            >
              {Math.round(provider.reliabilityScore)}
            </p>
          </div>
        </div>

        {/* Today's Sessions */}
        <div style={{ marginBottom: 24 }}>
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
            Today&apos;s Visits
          </p>
          {todaySessions.length === 0 ? (
            <div
              style={{
                background: '#FFFFFF',
                borderRadius: 16,
                border: '1px solid #E8E0D8',
                padding: '28px 20px',
                textAlign: 'center',
              }}
            >
              <p style={{ fontSize: 24, marginBottom: 8 }}>☀️</p>
              <p style={{ fontSize: 14, color: '#9CA3AF' }}>
                No visits scheduled today — enjoy your day!
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {todaySessions.map((s) => {
                const serviceName =
                  s.request.requestServices[0]?.serviceCategory?.name ?? 'Visit'
                const elderName = s.request.elderProfile?.name ?? 'Elder'
                const city = s.request.elderProfile?.city ?? ''
                return (
                  <div
                    key={s.id}
                    style={{
                      background: '#FFFFFF',
                      borderRadius: 16,
                      border: '1px solid #E8E0D8',
                      padding: '14px 16px',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <p style={{ fontSize: 14, fontWeight: 600, color: '#1C2B3A', margin: 0 }}>
                          {elderName}
                        </p>
                        <p style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>
                          {serviceName} · {city}
                        </p>
                      </div>
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          color: '#1A6B7A',
                          fontFamily: 'DM Mono, monospace',
                        }}
                      >
                        {s.scheduledTime}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Wallet card */}
        <div
          style={{
            background: '#FFFFFF',
            borderRadius: 16,
            border: '1px solid #E8E0D8',
            padding: '20px',
            marginBottom: 24,
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
              marginBottom: 10,
            }}
          >
            Wallet
          </p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ fontSize: 12, color: '#6B7280', margin: 0 }}>Available to withdraw</p>
              <p
                style={{
                  fontSize: 24,
                  fontWeight: 700,
                  color: '#4A8C6F',
                  fontFamily: 'DM Mono, monospace',
                  marginTop: 2,
                }}
              >
                {formatINR(withdrawable)}
              </p>
            </div>
            <Link
              href="/provider/earnings"
              style={{
                background: '#E07B2F',
                color: '#FFFFFF',
                fontSize: 13,
                fontWeight: 600,
                padding: '10px 18px',
                borderRadius: 10,
                textDecoration: 'none',
              }}
            >
              Withdraw
            </Link>
          </div>
        </div>

        {/* Active Care Plans summary */}
        {activePlans.length > 0 && (
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: 16,
              border: '1px solid #E8E0D8',
              padding: '20px',
              marginBottom: 24,
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
                marginBottom: 10,
              }}
            >
              Active Care Plans
            </p>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ fontSize: 20, fontWeight: 700, color: '#1C2B3A', margin: 0 }}>
                  {activePlans.length} active plan{activePlans.length !== 1 ? 's' : ''}
                </p>
                <p style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>
                  Guaranteed income remaining
                </p>
              </div>
              <p
                style={{
                  fontSize: 20,
                  fontWeight: 700,
                  color: '#E07B2F',
                  fontFamily: 'DM Mono, monospace',
                }}
              >
                {formatINR(totalGuaranteedIncome)}
              </p>
            </div>
            <Link
              href="/provider/care-plans"
              style={{
                display: 'block',
                marginTop: 12,
                fontSize: 13,
                color: '#1A6B7A',
                fontWeight: 500,
                textDecoration: 'none',
              }}
            >
              View all plans →
            </Link>
          </div>
        )}

        {/* Trust Level */}
        <div
          style={{
            background: '#FFFFFF',
            borderRadius: 16,
            border: '1px solid #E8E0D8',
            padding: '20px',
            marginBottom: 24,
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
              marginBottom: 12,
            }}
          >
            Trust Level
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <span
              style={{
                background: '#1A6B7A',
                color: '#FFFFFF',
                fontSize: 12,
                fontWeight: 600,
                padding: '4px 12px',
                borderRadius: 9999,
              }}
            >
              {TRUST_LABELS[trustLevel] ?? trustLevel}
            </span>
            {trustLevel !== 'LEVEL_3' && (
              <span style={{ fontSize: 12, color: '#6B7280' }}>
                {provider.totalSessions} / {sessionsNeeded} sessions to next level
              </span>
            )}
          </div>
          {trustLevel !== 'LEVEL_3' && (
            <div
              style={{
                height: 6,
                background: '#F3F4F6',
                borderRadius: 4,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${progressPct}%`,
                  background: '#4A8C6F',
                  borderRadius: 4,
                  transition: 'width 0.3s',
                }}
              />
            </div>
          )}
          {trustLevel === 'LEVEL_3' && (
            <p style={{ fontSize: 13, color: '#4A8C6F', fontWeight: 500 }}>
              You have reached Senior Companion — the highest trust level!
            </p>
          )}
        </div>

        {/* Recent Earnings */}
        <div style={{ marginBottom: 24 }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 12,
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
              Recent Earnings
            </p>
            <Link href="/provider/earnings" style={{ fontSize: 12, color: '#E07B2F', textDecoration: 'none' }}>
              View all
            </Link>
          </div>
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: 16,
              border: '1px solid #E8E0D8',
              overflow: 'hidden',
              boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
            }}
          >
            {provider.earnings.length === 0 ? (
              <div style={{ padding: '28px 20px', textAlign: 'center' }}>
                <p style={{ fontSize: 14, color: '#9CA3AF' }}>
                  Complete your first session to start earning.
                </p>
              </div>
            ) : (
              provider.earnings.map((e, i) => {
                const serviceName =
                  e.session?.request?.requestServices[0]?.serviceCategory?.name ?? '—'
                return (
                  <div
                    key={e.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '12px 16px',
                      borderBottom: i < provider.earnings.length - 1 ? '1px solid #F9FAFB' : 'none',
                    }}
                  >
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 500, color: '#1C2B3A', margin: 0 }}>
                        {serviceName}
                      </p>
                      <p style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>
                        {e.session?.scheduledDate
                          ? new Date(e.session.scheduledDate).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                            })
                          : '—'}
                      </p>
                    </div>
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
                )
              })
            )}
          </div>
        </div>

        {/* Recent Notifications */}
        {recentNotifications.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 12,
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
                Notifications
              </p>
              <Link
                href="/provider/notifications"
                style={{ fontSize: 12, color: '#E07B2F', textDecoration: 'none' }}
              >
                View all
              </Link>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {recentNotifications.map((n) => (
                <div
                  key={n.id}
                  style={{
                    background: n.status === 'READ' ? '#FAFAFA' : '#FFFFFF',
                    borderRadius: 12,
                    border: '1px solid #E8E0D8',
                    borderLeft: n.status !== 'READ' ? '3px solid #E07B2F' : '1px solid #E8E0D8',
                    padding: '12px 14px',
                  }}
                >
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#1C2B3A', margin: 0 }}>
                    {n.title}
                  </p>
                  <p style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>{n.body}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom nav */}
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
        {navLinks.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
              textDecoration: 'none',
              color: l.active ? '#E07B2F' : '#9CA3AF',
            }}
          >
            <span style={{ fontSize: 12, fontWeight: l.active ? 700 : 400 }}>{l.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  )
}
