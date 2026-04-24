import { redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import NearDearLogo from '@/components/NearDearLogo'

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

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date)
}

export default async function SessionPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const authSession = await auth()
  if (!authSession?.user?.id) redirect('/login')

  const { id } = await params

  const session = await prisma.session.findUnique({
    where: { id },
    include: {
      request: {
        include: {
          requestServices: {
            include: { serviceCategory: true },
          },
          elderProfile: true,
        },
      },
      companion: {
        include: { user: true },
      },
    },
  })

  if (!session) redirect('/dashboard')

  if (session.request.userId !== authSession.user.id) redirect('/dashboard')

  const companion = session.companion
  const firstName = companion.legalName.split(' ')[0]
  const occupation =
    companion.occupationCurrent ??
    companion.occupationPast ??
    companion.currentStatus ??
    ''

  return (
    <div style={{ minHeight: '100vh', background: '#FEF8F0', padding: '40px 24px' }}>
      <div style={{ maxWidth: 560, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <Link href="/" aria-label="NearDear home" style={{ textDecoration: 'none', display: 'inline-block' }}>
            <NearDearLogo width={140} variant="compact" />
          </Link>
        </div>

        {/* Confirmation heading */}
        <h1
          style={{
            fontFamily: 'Playfair Display, Georgia, serif',
            fontWeight: 700,
            fontSize: 26,
            color: '#1C2B3A',
            marginBottom: 24,
            lineHeight: 1.3,
          }}
        >
          Wonderful. {firstName} will be your companion.
        </h1>

        {/* Companion card */}
        <div
          style={{
            background: '#FFFFFF',
            borderRadius: 16,
            border: '1px solid #E8E0D8',
            padding: 24,
            marginBottom: 20,
            boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
          }}
        >
          <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
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

            <div style={{ flex: 1 }}>
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
        </div>

        {/* Session details */}
        <div
          style={{
            background: '#FFFFFF',
            borderRadius: 16,
            border: '1px solid #E8E0D8',
            padding: 24,
            marginBottom: 20,
          }}
        >
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
            Session Details
          </p>

          {/* Services */}
          <div style={{ marginBottom: 12 }}>
            <p style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 6 }}>Services</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {session.request.requestServices.map((rs) => (
                <span
                  key={rs.id}
                  style={{
                    background: 'rgba(26,107,122,0.1)',
                    color: '#1A6B7A',
                    borderRadius: 9999,
                    padding: '3px 10px',
                    fontSize: 12,
                    fontWeight: 500,
                  }}
                >
                  {rs.serviceCategory.name}
                </span>
              ))}
            </div>
          </div>

          {/* City */}
          <div style={{ marginBottom: 12 }}>
            <p style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 2 }}>Location</p>
            <p style={{ fontSize: 14, color: '#1C2B3A', fontWeight: 500 }}>{session.serviceCity}</p>
          </div>

          {/* Date and time */}
          {session.scheduledDate && (
            <div>
              <p style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 2 }}>Scheduled</p>
              <p style={{ fontSize: 14, color: '#1C2B3A', fontWeight: 500 }}>
                {formatDate(session.scheduledDate)}{session.scheduledTime ? ` · ${session.scheduledTime}` : ''}
              </p>
            </div>
          )}
        </div>

        {/* Payment card */}
        <div
          style={{
            background: '#FFFFFF',
            borderRadius: 16,
            border: '1px solid #E8E0D8',
            padding: 24,
            marginBottom: 20,
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
            Payment
          </p>
          <p style={{ fontSize: 14, color: '#6B7280', marginBottom: 20, lineHeight: 1.6 }}>
            Payment pending — complete payment to confirm your session
          </p>
          <Link
            href={`/session/${id}/payment`}
            style={{
              display: 'block',
              width: '100%',
              background: '#E07B2F',
              color: '#FFFFFF',
              borderRadius: 12,
              padding: '13px 0',
              fontWeight: 600,
              fontSize: 15,
              textAlign: 'center',
              textDecoration: 'none',
              boxSizing: 'border-box',
            }}
          >
            Proceed to Payment &rarr;
          </Link>
        </div>

        {/* Intro call offer */}
        <div
          style={{
            background: '#FFFFFF',
            borderRadius: 16,
            border: '1px solid #E8E0D8',
            padding: 20,
          }}
        >
          <p style={{ fontSize: 14, color: '#1C2B3A', marginBottom: 14, lineHeight: 1.6 }}>
            Would you like a quick intro call with {firstName} before the first visit?
          </p>
          <div style={{ display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap' }}>
            <Link
              href={`/session/${id}/intro-call`}
              style={{
                color: '#1A6B7A',
                fontWeight: 600,
                fontSize: 14,
                textDecoration: 'none',
              }}
            >
              Yes — schedule intro call &rarr;
            </Link>
            <Link
              href={`/session/${id}/payment`}
              style={{
                color: '#9CA3AF',
                fontSize: 14,
                textDecoration: 'none',
              }}
            >
              No, proceed to payment
            </Link>
          </div>
        </div>

      </div>
    </div>
  )
}
