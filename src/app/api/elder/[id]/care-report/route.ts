import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  }).format(date)
}

function formatMonthYear(date: Date): string {
  return new Intl.DateTimeFormat('en-IN', { month: 'long', year: 'numeric' }).format(date)
}

function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

function wellbeingLabel(score: number): string {
  if (score >= 5) return 'Thriving'
  if (score >= 4) return 'Good'
  if (score >= 3) return 'Okay'
  if (score >= 2) return 'Struggling'
  return 'Needs attention'
}

function stars(score: number): string {
  return '★'.repeat(score) + '☆'.repeat(5 - score)
}

function esc(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authSession = await auth()
  if (!authSession?.user?.id) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const { id: elderId } = await params
  const userId = authSession.user.id

  const elder = await prisma.elderProfile.findUnique({
    where: { id: elderId },
    select: { id: true, name: true, city: true, ageRange: true, familyUserId: true },
  })

  if (!elder || elder.familyUserId !== userId) {
    return new NextResponse('Not found', { status: 404 })
  }

  const notes = await prisma.sessionNote.findMany({
    where: {
      session: {
        request: { elderProfileId: elderId, userId },
        status: { in: ['NOTE_SUBMITTED', 'COMPLETED', 'CHECKED_OUT'] },
      },
    },
    include: {
      session: {
        include: {
          companion: { select: { legalName: true } },
          feedback: {
            select: { overallScore: true, wellbeingScore: true, hasConcern: true, concernText: true },
          },
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

  const generatedOn = new Intl.DateTimeFormat('en-IN', {
    day: 'numeric', month: 'long', year: 'numeric',
  }).format(new Date())

  // Group by month
  const groups = new Map<string, typeof notes>()
  for (const note of notes) {
    const key = monthKey(note.session.scheduledDate)
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(note)
  }
  const sortedGroups = Array.from(groups.entries()).sort((a, b) => a[0].localeCompare(b[0]))

  const firstDate = notes[0]?.session.scheduledDate
  const lastDate = notes[notes.length - 1]?.session.scheduledDate
  const months = firstDate && lastDate
    ? Math.max(1,
        (lastDate.getFullYear() - firstDate.getFullYear()) * 12 +
        (lastDate.getMonth() - firstDate.getMonth()) + 1
      )
    : 0

  const concernCount = notes.filter((n) => n.hasConcern || n.session.feedback?.hasConcern).length

  // Build entry HTML for each note
  function noteHtml(note: typeof notes[number]): string {
    const companion = note.session.companion.legalName
    const service = note.session.request.requestServices[0]?.serviceCategory.name ?? ''
    const wb = note.session.feedback?.wellbeingScore
    const score = note.session.feedback?.overallScore
    const hasConcern = note.hasConcern || note.session.feedback?.hasConcern
    const concernText = note.concernDetail ?? note.session.feedback?.concernText

    return `
      <div class="entry">
        <div class="entry-header">
          <div>
            <div class="entry-date">${esc(formatDate(note.session.scheduledDate))}</div>
            ${service ? `<span class="badge">${esc(service)}</span>` : ''}
          </div>
          <div class="entry-meta">
            ${score ? `<span class="stars">${stars(score)}</span>` : ''}
            <span class="companion">${esc(companion)}</span>
          </div>
        </div>

        <p class="note-text">&ldquo;${esc(note.whatDoneToday)}&rdquo;</p>

        ${note.personWellbeing || wb ? `
        <div class="wellbeing-row">
          ${wb ? `<span class="wb-label">${wellbeingLabel(wb)}</span>` : ''}
          ${note.personWellbeing ? `<span class="wb-text">${esc(note.personWellbeing)}</span>` : ''}
        </div>` : ''}

        ${note.familyObservation ? `
        <div class="observation">
          <div class="obs-label">Companion note to family</div>
          <div class="obs-text">${esc(note.familyObservation)}</div>
        </div>` : ''}

        ${hasConcern ? `
        <div class="concern">
          ⚠ Concern noted${concernText ? `: ${esc(concernText)}` : ''}
        </div>` : ''}

        ${note.nextVisitNeeded ? `
        <div class="next-visit">
          ✓ Companion recommended a follow-up visit${note.nextVisitDate
            ? ` · ${new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }).format(note.nextVisitDate)}`
            : ''}
        </div>` : ''}

        <div class="entry-footer">
          ${esc(companion)} · ${esc(note.session.scheduledTime ?? '')}
        </div>
      </div>`
  }

  function monthHtml([, monthNotes]: [string, typeof notes]): string {
    return `
      <div class="month-group">
        <h2 class="month-heading">${esc(formatMonthYear(monthNotes[0].session.scheduledDate))}</h2>
        ${monthNotes.map(noteHtml).join('\n')}
      </div>`
  }

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Care Diary — ${esc(elder.name)}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=DM+Sans:wght@400;500;600&display=swap');

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: 'DM Sans', 'Helvetica Neue', Arial, sans-serif;
      font-size: 14px;
      color: #1C2B3A;
      background: #FEF8F0;
      line-height: 1.6;
    }

    .page {
      max-width: 680px;
      margin: 0 auto;
      padding: 48px 32px 64px;
    }

    /* Cover */
    .cover {
      text-align: center;
      padding: 48px 0 40px;
      border-bottom: 1px solid #E8E0D8;
      margin-bottom: 40px;
    }
    .cover-brand {
      font-family: 'Playfair Display', Georgia, serif;
      font-size: 22px;
      font-weight: 700;
      letter-spacing: -0.5px;
      margin-bottom: 32px;
    }
    .cover-brand .near { color: #1C2B3A; }
    .cover-brand .dear { color: #E07B2F; }
    .cover-label {
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: #1A6B7A;
      margin-bottom: 8px;
    }
    .cover-name {
      font-family: 'Playfair Display', Georgia, serif;
      font-size: 34px;
      font-weight: 700;
      color: #1C2B3A;
      margin-bottom: 6px;
    }
    .cover-sub {
      font-size: 15px;
      color: #6B7280;
      margin-bottom: 32px;
    }
    .stats-row {
      display: flex;
      justify-content: center;
      gap: 40px;
      margin-top: 24px;
    }
    .stat { text-align: center; }
    .stat-value {
      font-size: 26px;
      font-weight: 700;
      color: #E07B2F;
      font-family: 'DM Sans', sans-serif;
    }
    .stat-label { font-size: 12px; color: #9CA3AF; margin-top: 3px; }

    /* Month group */
    .month-group { margin-bottom: 40px; }
    .month-heading {
      font-family: 'Playfair Display', Georgia, serif;
      font-size: 20px;
      font-weight: 600;
      color: #1C2B3A;
      padding-bottom: 12px;
      border-bottom: 1px solid #E8E0D8;
      margin-bottom: 20px;
    }

    /* Entry card */
    .entry {
      background: #FFFFFF;
      border: 1px solid #E8E0D8;
      border-radius: 12px;
      margin-bottom: 16px;
      overflow: hidden;
      page-break-inside: avoid;
    }
    .entry-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding: 14px 16px 12px;
      border-bottom: 1px solid #F3F4F6;
    }
    .entry-date {
      font-family: 'Playfair Display', Georgia, serif;
      font-size: 15px;
      font-weight: 600;
      color: #1C2B3A;
      margin-bottom: 5px;
    }
    .badge {
      display: inline-block;
      background: #F0FAF4;
      color: #4A8C6F;
      border-radius: 9999px;
      padding: 2px 8px;
      font-size: 11px;
      font-weight: 600;
    }
    .entry-meta { text-align: right; }
    .stars { font-size: 13px; color: #F0B429; display: block; margin-bottom: 4px; }
    .companion { font-size: 12px; color: #9CA3AF; }

    /* Note text */
    .note-text {
      font-size: 15px;
      color: #1C2B3A;
      font-style: italic;
      line-height: 1.75;
      padding: 14px 16px;
    }

    /* Wellbeing */
    .wellbeing-row {
      background: #FAFAFA;
      border-radius: 8px;
      padding: 8px 12px;
      margin: 0 16px 12px;
      display: flex;
      gap: 8px;
      align-items: flex-start;
    }
    .wb-label {
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: #4A8C6F;
      flex-shrink: 0;
      padding-top: 1px;
    }
    .wb-text { font-size: 13px; color: #6B7280; }

    /* Observation */
    .observation {
      border-left: 2px solid #1A6B7A55;
      padding-left: 12px;
      margin: 0 16px 12px;
    }
    .obs-label {
      font-size: 11px;
      font-weight: 600;
      color: #1A6B7A;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 4px;
    }
    .obs-text { font-size: 13px; color: #374151; line-height: 1.6; }

    /* Concern */
    .concern {
      background: #FEF9F8;
      border: 1px solid #E85D4A33;
      border-radius: 8px;
      padding: 8px 12px;
      margin: 0 16px 12px;
      font-size: 13px;
      color: #E85D4A;
      font-weight: 500;
    }

    /* Next visit */
    .next-visit {
      padding: 0 16px 12px;
      font-size: 13px;
      color: #4A8C6F;
      font-weight: 500;
    }

    /* Entry footer */
    .entry-footer {
      border-top: 1px solid #F3F4F6;
      padding: 10px 16px;
      font-size: 12px;
      color: #9CA3AF;
    }

    /* Page footer */
    .report-footer {
      text-align: center;
      padding-top: 32px;
      border-top: 1px solid #E8E0D8;
      margin-top: 40px;
    }
    .report-footer p { font-size: 12px; color: #9CA3AF; line-height: 1.7; }
    .report-footer strong { color: #1C2B3A; }

    @media print {
      body { background: #FFFFFF; }
      .page { padding: 24px 20px; }
      .no-print { display: none !important; }
      .entry { page-break-inside: avoid; }
      .month-group { page-break-inside: auto; }
    }
  </style>
</head>
<body>
  <div class="page">

    <!-- Print button (hidden when printing) -->
    <div class="no-print" style="text-align:right;margin-bottom:24px;">
      <button onclick="window.print()" style="
        background:#E07B2F;color:#FFFFFF;border:none;border-radius:10px;
        padding:10px 20px;font-size:14px;font-weight:600;cursor:pointer;
        font-family:'DM Sans',sans-serif;
      ">
        Save as PDF / Print
      </button>
    </div>

    <!-- Cover -->
    <div class="cover">
      <div class="cover-brand">
        <span class="near">Near</span><span class="dear">Dear</span>
      </div>
      <div class="cover-label">Care Diary</div>
      <div class="cover-name">${esc(elder.name)}</div>
      <div class="cover-sub">${esc(elder.city)}${elder.ageRange ? ` · ${esc(elder.ageRange)}` : ''}</div>

      <div class="stats-row">
        <div class="stat">
          <div class="stat-value">${notes.length}</div>
          <div class="stat-label">visits documented</div>
        </div>
        <div class="stat">
          <div class="stat-value">${months}</div>
          <div class="stat-label">month${months !== 1 ? 's' : ''} of care</div>
        </div>
        ${concernCount > 0 ? `
        <div class="stat">
          <div class="stat-value" style="color:#E85D4A">${concernCount}</div>
          <div class="stat-label">concerns noted</div>
        </div>` : ''}
      </div>

      <p style="font-size:12px;color:#9CA3AF;margin-top:24px;">
        Generated on ${generatedOn} · NearDear.in
      </p>
    </div>

    ${notes.length === 0
      ? '<p style="text-align:center;color:#9CA3AF;padding:40px 0;">No visit notes recorded yet.</p>'
      : sortedGroups.map(monthHtml).join('\n')
    }

    <!-- Footer -->
    <div class="report-footer">
      <p>
        This care report was generated by <strong>NearDear.in</strong>.<br/>
        It documents ${notes.length} verified companion visits with ${esc(elder.name)}.<br/>
        Every entry was submitted by a verified companion immediately after their visit.<br/><br/>
        <em>Every note is a moment preserved. A record of presence, dignity, and care.</em>
      </p>
    </div>

  </div>
</body>
</html>`

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  })
}
