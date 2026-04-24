import { redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import NearDearLogo from '@/components/NearDearLogo'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDayLong(date: Date): string {
  return new Intl.DateTimeFormat('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long',
  }).format(date)
}

function formatMonthYear(date: Date): string {
  return new Intl.DateTimeFormat('en-IN', {
    month: 'long', year: 'numeric',
  }).format(date)
}

function formatDateShort(date: Date): string {
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  }).format(date)
}

function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
}

function monthsOfCare(first: Date, last: Date): number {
  const months =
    (last.getFullYear() - first.getFullYear()) * 12 +
    (last.getMonth() - first.getMonth())
  return Math.max(1, months + 1)
}

// Wellbeing label from score 1–5
function wellbeingLabel(score: number): { label: string; color: string } {
  if (score >= 5) return { label: 'Thriving', color: '#4A8C6F' }
  if (score >= 4) return { label: 'Good', color: '#4A8C6F' }
  if (score >= 3) return { label: 'Okay', color: '#F0B429' }
  if (score >= 2) return { label: 'Struggling', color: '#E07B2F' }
  return { label: 'Needs attention', color: '#E85D4A' }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function CareDiaryPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const authSession = await auth()
  if (!authSession?.user?.id) redirect('/login')

  const { id: elderId } = await params
  const userId = authSession.user.id

  // Verify ownership
  const elder = await prisma.elderProfile.findUnique({
    where: { id: elderId },
    select: { id: true, name: true, city: true, ageRange: true, familyUserId: true },
  })

  if (!elder || elder.familyUserId !== userId) redirect('/dashboard')

  // Fetch all session notes for this elder, oldest first for the diary
  const notes = await prisma.sessionNote.findMany({
    where: {
      session: {
        request: {
          elderProfileId: elderId,
          userId,
        },
        status: { in: ['NOTE_SUBMITTED', 'COMPLETED', 'CHECKED_OUT'] },
      },
    },
    include: {
      session: {
        include: {
          companion: { select: { id: true, legalName: true } },
          feedback: { select: { overallScore: true, wellbeingScore: true, hasConcern: true, concernText: true } },
          request: {
            include: {
              requestServices: {
                include: { serviceCategory: { select: { name: true } } },
                take: 1,
              },
            },
          },
        },
      },
    },
    orderBy: { createdAt: 'asc' },
  })

  if (notes.length === 0) {
    return <EmptyDiary elder={elder} />
  }

  // Group by month
  const groups: Map<string, typeof notes> = new Map()
  for (const note of notes) {
    const key = monthKey(note.session.scheduledDate)
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(note)
  }

  const sortedGroups = Array.from(groups.entries()).sort((a, b) => b[0].localeCompare(a[0]))

  const firstDate = notes[0].session.scheduledDate
  const lastDate = notes[notes.length - 1].session.scheduledDate
  const totalMonths = monthsOfCare(firstDate, lastDate)
  const companionSet: Record<string, true> = {}
  for (const n of notes) companionSet[n.session.companion.id] = true
  const uniqueCompanions = Object.keys(companionSet).length
  const concernCount = notes.filter((n) => n.hasConcern || n.session.feedback?.hasConcern).length

  return (
    <div style={{ minHeight: '100vh', background: '#FEF8F0', fontFamily: 'DM Sans, sans-serif' }}>

      {/* Header */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 40,
        background: '#FFFFFF', borderBottom: '1px solid #E8E0D8',
        padding: '12px 20px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <Link href="/dashboard" style={{ color: '#6B7280', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          <span style={{ fontSize: 14 }}>Dashboard</span>
        </Link>
        <NearDearLogo width={100} variant="compact" />
        {/* Download PDF */}
        <a
          href={`/api/elder/${elderId}/care-report`}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            background: '#E07B2F', color: '#FFFFFF',
            borderRadius: 10, padding: '7px 14px',
            fontWeight: 600, fontSize: 13, textDecoration: 'none',
            display: 'flex', alignItems: 'center', gap: 6,
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          PDF
        </a>
      </div>

      <div style={{ maxWidth: 560, margin: '0 auto', padding: '32px 20px 80px' }}>

        {/* Elder + diary title */}
        <div style={{ marginBottom: 28 }}>
          <p style={{
            fontSize: 11, fontWeight: 600, textTransform: 'uppercase',
            letterSpacing: '0.08em', color: '#1A6B7A', margin: '0 0 8px',
          }}>
            Care Diary
          </p>
          <h1 style={{
            fontFamily: 'Playfair Display, Georgia, serif',
            fontSize: 28, fontWeight: 700, color: '#1C2B3A',
            margin: '0 0 4px', lineHeight: 1.3,
          }}>
            {elder.name}
          </h1>
          <p style={{ color: '#9CA3AF', fontSize: 14, margin: 0 }}>
            {elder.city} · {elder.ageRange}
          </p>
        </div>

        {/* Summary stats */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
          gap: 10, marginBottom: 32,
        }}>
          <StatPill value={String(notes.length)} label="visits recorded" color="#1A6B7A" />
          <StatPill value={`${totalMonths}mo`} label="of care" color="#4A8C6F" />
          <StatPill
            value={String(uniqueCompanions)}
            label={uniqueCompanions === 1 ? 'companion' : 'companions'}
            color="#E07B2F"
          />
        </div>

        {concernCount > 0 && (
          <div style={{
            background: '#FEF9F8', border: '1px solid #E85D4A33',
            borderRadius: 12, padding: '12px 16px', marginBottom: 28,
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#E85D4A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <p style={{ fontSize: 13, color: '#E85D4A', margin: 0, fontWeight: 500 }}>
              {concernCount} visit{concernCount !== 1 ? 's' : ''} had a concern noted
            </p>
          </div>
        )}

        {/* Chronological diary — newest month first */}
        {sortedGroups.map(([key, monthNotes]) => (
          <div key={key} style={{ marginBottom: 40 }}>

            {/* Month heading */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20,
            }}>
              <h2 style={{
                fontFamily: 'Playfair Display, Georgia, serif',
                fontSize: 19, fontWeight: 600, color: '#1C2B3A',
                margin: 0, flexShrink: 0,
              }}>
                {formatMonthYear(monthNotes[0].session.scheduledDate)}
              </h2>
              <div style={{ flex: 1, height: 1, background: '#E8E0D8' }} />
              <span style={{ fontSize: 12, color: '#9CA3AF', flexShrink: 0 }}>
                {monthNotes.length} visit{monthNotes.length !== 1 ? 's' : ''}
              </span>
            </div>

            {/* Entries — newest first within month */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {[...monthNotes].reverse().map((note) => (
                <DiaryEntry key={note.id} note={note} />
              ))}
            </div>
          </div>
        ))}

        {/* Footer reflection */}
        <div style={{
          background: '#1C2B3A', borderRadius: 16, padding: 24,
          textAlign: 'center',
        }}>
          <p style={{
            fontFamily: 'Playfair Display, Georgia, serif',
            fontSize: 17, fontWeight: 600, color: '#FFFFFF',
            margin: '0 0 8px', lineHeight: 1.5,
          }}>
            {notes.length} visits. {totalMonths} month{totalMonths !== 1 ? 's' : ''} of care.
          </p>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', margin: '0 0 20px', lineHeight: 1.6 }}>
            Every note is a moment preserved. A record of presence, dignity, and care.
          </p>
          <a
            href={`/api/elder/${elderId}/care-report`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-block',
              background: '#E07B2F', color: '#FFFFFF',
              borderRadius: 10, padding: '11px 22px',
              fontWeight: 600, fontSize: 14, textDecoration: 'none',
            }}
          >
            Download full care report →
          </a>
        </div>

      </div>
    </div>
  )
}

// ─── Entry card ───────────────────────────────────────────────────────────────

type NoteWithSession = Awaited<ReturnType<typeof prisma.sessionNote.findMany>>[number] & {
  session: {
    scheduledDate: Date
    scheduledTime: string
    companion: { legalName: string }
    feedback: {
      overallScore: number | null
      wellbeingScore: number | null
      hasConcern: boolean
      concernText: string | null
    } | null
    request: {
      requestServices: {
        serviceCategory: { name: string }
      }[]
    }
  }
}

function DiaryEntry({ note }: { note: NoteWithSession }) {
  const companion = note.session.companion.legalName
  const service = note.session.request.requestServices[0]?.serviceCategory.name
  const wb = note.session.feedback?.wellbeingScore
  const score = note.session.feedback?.overallScore
  const hasConcern = note.hasConcern || note.session.feedback?.hasConcern
  const concernText = note.concernDetail ?? note.session.feedback?.concernText

  return (
    <div style={{
      background: '#FFFFFF',
      borderRadius: 16,
      border: hasConcern ? '1px solid #E85D4A33' : '1px solid #E8E0D8',
      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
      overflow: 'hidden',
    }}>
      {/* Entry header */}
      <div style={{
        padding: '16px 18px 14px',
        borderBottom: '1px solid #F3F4F6',
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
      }}>
        <div>
          <p style={{
            fontFamily: 'Playfair Display, Georgia, serif',
            fontSize: 16, fontWeight: 600, color: '#1C2B3A',
            margin: '0 0 3px',
          }}>
            {formatDayLong(note.session.scheduledDate)}
          </p>
          {service && (
            <span style={{
              background: '#F0FAF4', color: '#4A8C6F',
              borderRadius: 9999, padding: '2px 8px',
              fontSize: 11, fontWeight: 600,
            }}>
              {service}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {score && (
            <div style={{ display: 'flex', gap: 2 }}>
              {[1, 2, 3, 4, 5].map((s) => (
                <svg key={s} width="11" height="11" viewBox="0 0 24 24" fill={s <= score ? '#F0B429' : '#E8E0D8'}>
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
              ))}
            </div>
          )}
          {/* Companion initials */}
          <div style={{
            width: 30, height: 30, borderRadius: '50%',
            background: '#1A6B7A', color: '#FFFFFF',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, fontWeight: 700, flexShrink: 0,
          }}>
            {getInitials(companion)}
          </div>
        </div>
      </div>

      {/* Note body */}
      <div style={{ padding: '16px 18px' }}>

        {/* What was done */}
        <p style={{
          fontSize: 15, color: '#1C2B3A', lineHeight: 1.75,
          margin: '0 0 12px', fontStyle: 'italic',
        }}>
          &ldquo;{note.whatDoneToday}&rdquo;
        </p>

        {/* Wellbeing */}
        {(note.personWellbeing || wb) && (
          <div style={{
            background: '#FAFAFA', borderRadius: 10,
            padding: '10px 14px', marginBottom: 12,
            display: 'flex', alignItems: 'flex-start', gap: 10,
          }}>
            <div style={{
              width: 8, height: 8, borderRadius: '50%', flexShrink: 0, marginTop: 5,
              background: wb ? wellbeingLabel(wb).color : '#4A8C6F',
            }} />
            <div>
              {wb && (
                <span style={{
                  fontSize: 11, fontWeight: 600, color: wellbeingLabel(wb).color,
                  textTransform: 'uppercase', letterSpacing: '0.06em',
                  display: 'block', marginBottom: 3,
                }}>
                  {wellbeingLabel(wb).label}
                </span>
              )}
              {note.personWellbeing && (
                <p style={{ fontSize: 14, color: '#6B7280', margin: 0, lineHeight: 1.6 }}>
                  {note.personWellbeing}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Family observation */}
        {note.familyObservation && (
          <div style={{
            borderLeft: '2px solid #1A6B7A33', paddingLeft: 12, marginBottom: 12,
          }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: '#1A6B7A', margin: '0 0 3px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Companion note to family
            </p>
            <p style={{ fontSize: 14, color: '#374151', margin: 0, lineHeight: 1.6 }}>
              {note.familyObservation}
            </p>
          </div>
        )}

        {/* Concern */}
        {hasConcern && (
          <div style={{
            background: '#FEF9F8', border: '1px solid #E85D4A33',
            borderRadius: 10, padding: '10px 14px', marginBottom: 12,
            display: 'flex', alignItems: 'flex-start', gap: 8,
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#E85D4A" strokeWidth="2.5" strokeLinecap="round" style={{ flexShrink: 0, marginTop: 2 }}>
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            <div>
              <p style={{ fontSize: 12, fontWeight: 600, color: '#E85D4A', margin: '0 0 3px' }}>Concern noted</p>
              {concernText && (
                <p style={{ fontSize: 14, color: '#6B7280', margin: 0, lineHeight: 1.6 }}>{concernText}</p>
              )}
            </div>
          </div>
        )}

        {/* Next visit needed */}
        {note.nextVisitNeeded && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            borderTop: '1px solid #F3F4F6', paddingTop: 12, marginTop: 4,
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4A8C6F" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            <p style={{ fontSize: 13, color: '#4A8C6F', margin: 0, fontWeight: 500 }}>
              Companion recommended a follow-up visit
              {note.nextVisitDate ? ` · ${formatDateShort(note.nextVisitDate)}` : ''}
            </p>
          </div>
        )}

        {/* Companion + time footer */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          borderTop: '1px solid #F3F4F6', paddingTop: 10, marginTop: 12,
        }}>
          <p style={{ fontSize: 12, color: '#9CA3AF', margin: 0 }}>
            {companion} · {note.session.scheduledTime}
          </p>
        </div>
      </div>
    </div>
  )
}

function StatPill({ value, label, color }: { value: string; label: string; color: string }) {
  return (
    <div style={{
      background: '#FFFFFF', borderRadius: 14,
      border: '1px solid #E8E0D8', padding: '14px 10px',
      textAlign: 'center',
    }}>
      <p style={{
        fontSize: 22, fontWeight: 700, color,
        fontFamily: 'DM Mono, monospace',
        margin: '0 0 3px', letterSpacing: '-0.5px',
      }}>
        {value}
      </p>
      <p style={{ fontSize: 11, color: '#9CA3AF', margin: 0, fontWeight: 500 }}>{label}</p>
    </div>
  )
}

function EmptyDiary({ elder }: { elder: { id: string; name: string; city: string } }) {
  return (
    <div style={{ minHeight: '100vh', background: '#FEF8F0', fontFamily: 'DM Sans, sans-serif' }}>
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '60px 24px', textAlign: 'center' }}>
        <div style={{
          width: 64, height: 64, borderRadius: '50%',
          background: '#F0FAF4', border: '1.5px solid #4A8C6F',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 20px',
        }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#4A8C6F" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
        </div>
        <h1 style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: 24, fontWeight: 700, color: '#1C2B3A', margin: '0 0 10px' }}>
          {elder.name}&apos;s care diary
        </h1>
        <p style={{ fontSize: 15, color: '#9CA3AF', lineHeight: 1.7, margin: '0 0 28px' }}>
          No visit notes yet. Once a companion completes a session and submits their note, it will appear here — preserved for your family.
        </p>
        <Link href="/request/new" style={{
          display: 'inline-block', background: '#E07B2F', color: '#FFFFFF',
          borderRadius: 12, padding: '12px 24px',
          fontWeight: 600, fontSize: 15, textDecoration: 'none',
        }}>
          Book a visit for {elder.name.split(' ')[0]} →
        </Link>
      </div>
    </div>
  )
}
