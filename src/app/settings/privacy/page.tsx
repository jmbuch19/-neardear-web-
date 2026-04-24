'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { signOut } from 'next-auth/react'
import Link from 'next/link'
import NearDearLogo from '@/components/NearDearLogo'

// ─── Types ────────────────────────────────────────────────────────────────────

interface UserData {
  name: string
  phone: string
  email: string | null
  city: string
  role: string
  createdAt: string
  sessionCount: number
  elderProfiles: { id: string; name: string; city: string; isActive: boolean }[]
  hasPendingEarnings?: boolean
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <p style={{
        fontSize: 11, fontWeight: 600, textTransform: 'uppercase',
        letterSpacing: '0.08em', color: '#1A6B7A', margin: '0 0 14px',
      }}>
        {label}
      </p>
      <div style={{
        background: '#FFFFFF', borderRadius: 16,
        border: '1px solid #E8E0D8',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        overflow: 'hidden',
      }}>
        {children}
      </div>
    </div>
  )
}

function Row({
  icon, title, description, action, danger,
}: {
  icon: React.ReactNode
  title: string
  description?: string
  action: React.ReactNode
  danger?: boolean
}) {
  return (
    <div style={{
      padding: '16px 18px',
      borderBottom: '1px solid #F3F4F6',
      display: 'flex', alignItems: 'flex-start', gap: 14,
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
        background: danger ? '#FEF9F8' : '#F0FAF4',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginTop: 2,
      }}>
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontWeight: 600, fontSize: 14, color: danger ? '#E85D4A' : '#1C2B3A', margin: '0 0 3px' }}>
          {title}
        </p>
        {description && (
          <p style={{ fontSize: 12, color: '#9CA3AF', margin: '0 0 10px', lineHeight: 1.5 }}>
            {description}
          </p>
        )}
        {action}
      </div>
    </div>
  )
}

function ActionButton({
  label, onClick, danger, disabled, small,
}: {
  label: string; onClick: () => void; danger?: boolean; disabled?: boolean; small?: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        background: danger ? '#E85D4A' : '#FFFFFF',
        color: danger ? '#FFFFFF' : '#1C2B3A',
        border: danger ? 'none' : '1.5px solid #E8E0D8',
        borderRadius: 10,
        padding: small ? '7px 14px' : '9px 16px',
        fontWeight: 600,
        fontSize: small ? 12 : 13,
        cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        fontFamily: 'inherit',
      }}
    >
      {label}
    </button>
  )
}

// ─── Modals ───────────────────────────────────────────────────────────────────

function ConfirmDeleteAccountModal({ onClose, sessionCount, planCount }: {
  onClose: () => void
  sessionCount: number
  planCount: number
}) {
  const router = useRouter()
  const [confirmText, setConfirmText] = useState('')
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleDelete() {
    if (confirmText !== 'DELETE') return
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/user/deletion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestType: 'ACCOUNT_DELETE', reason }),
      })
      const data = await res.json() as { error?: string; code?: string; success?: boolean }
      if (!res.ok) {
        setError(data.error ?? 'Something went wrong')
        return
      }
      await signOut({ redirect: false })
      router.push('/?deleted=1')
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Overlay onClose={onClose}>
      <p style={{
        fontSize: 11, fontWeight: 600, textTransform: 'uppercase',
        letterSpacing: '0.08em', color: '#E85D4A', margin: '0 0 12px',
      }}>
        Delete account
      </p>
      <h2 style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: 22, fontWeight: 700, color: '#1C2B3A', margin: '0 0 16px' }}>
        Are you sure?
      </h2>

      <div style={{ background: '#FAFAFA', borderRadius: 12, padding: '14px 16px', marginBottom: 16 }}>
        {[
          { label: 'Happens immediately', items: ['Your account is closed', 'You are logged out', 'Your profile is hidden from searches'] },
          { label: 'Within 30 days', items: ['Your name, phone, email, address removed', 'Elder profile details anonymised'] },
          { label: 'Kept as required by law', items: [`${sessionCount} session records (anonymised — companion's work history)`, 'Payment records (7 years — financial law)', 'Concern records (permanent — safety law)'] },
        ].map((group) => (
          <div key={group.label} style={{ marginBottom: 14 }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: '#1A6B7A', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 6px' }}>
              {group.label}
            </p>
            {group.items.map((item) => (
              <div key={item} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 4 }}>
                <span style={{ fontSize: 12, color: '#9CA3AF', flexShrink: 0, lineHeight: 1.6 }}>·</span>
                <p style={{ fontSize: 13, color: '#6B7280', margin: 0, lineHeight: 1.6 }}>{item}</p>
              </div>
            ))}
          </div>
        ))}
      </div>

      {planCount > 0 && (
        <div style={{ background: '#FEF9F8', border: '1px solid #E85D4A33', borderRadius: 10, padding: '10px 14px', marginBottom: 16 }}>
          <p style={{ fontSize: 13, color: '#E85D4A', margin: 0, fontWeight: 500 }}>
            You have {planCount} active care plan{planCount !== 1 ? 's' : ''}. These must be completed or cancelled before closing your account.
          </p>
        </div>
      )}

      <label style={{ display: 'block', marginBottom: 8, fontSize: 13, color: '#6B7280' }}>
        Reason (optional)
      </label>
      <textarea
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Let us know why you're leaving..."
        rows={2}
        style={{
          width: '100%', border: '1.5px solid #E8E0D8', borderRadius: 10,
          padding: '10px 12px', fontSize: 14, color: '#1C2B3A',
          background: '#FAFAFA', marginBottom: 16, fontFamily: 'inherit',
          resize: 'none', boxSizing: 'border-box',
        }}
      />

      <label style={{ display: 'block', marginBottom: 8, fontSize: 13, color: '#6B7280' }}>
        Type <strong style={{ color: '#E85D4A' }}>DELETE</strong> to confirm
      </label>
      <input
        value={confirmText}
        onChange={(e) => setConfirmText(e.target.value)}
        placeholder="DELETE"
        style={{
          width: '100%', border: '1.5px solid #E8E0D8', borderRadius: 10,
          padding: '10px 12px', fontSize: 14, color: '#1C2B3A',
          background: '#FAFAFA', marginBottom: 16, fontFamily: 'inherit',
          boxSizing: 'border-box',
        }}
      />

      {error && (
        <p style={{ fontSize: 13, color: '#E85D4A', margin: '0 0 12px', fontWeight: 500 }}>{error}</p>
      )}

      <div style={{ display: 'flex', gap: 10 }}>
        <button onClick={onClose} style={{
          flex: 1, background: '#FFFFFF', color: '#1C2B3A',
          border: '1.5px solid #E8E0D8', borderRadius: 10, padding: '11px 0',
          fontWeight: 600, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit',
        }}>
          Cancel
        </button>
        <button
          onClick={handleDelete}
          disabled={confirmText !== 'DELETE' || loading || planCount > 0}
          style={{
            flex: 1, background: confirmText === 'DELETE' && planCount === 0 ? '#E85D4A' : '#E8E0D8',
            color: '#FFFFFF', border: 'none', borderRadius: 10, padding: '11px 0',
            fontWeight: 600, fontSize: 14,
            cursor: confirmText === 'DELETE' && planCount === 0 ? 'pointer' : 'default',
            fontFamily: 'inherit',
          }}
        >
          {loading ? 'Deleting…' : 'Delete my account'}
        </button>
      </div>
    </Overlay>
  )
}

function ConfirmElderDeleteModal({ elder, onClose, onSuccess }: {
  elder: { id: string; name: string }
  onClose: () => void
  onSuccess: () => void
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handle() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/user/elder-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ elderProfileId: elder.id }),
      })
      if (!res.ok) {
        const d = await res.json() as { error?: string }
        setError(d.error ?? 'Something went wrong')
        return
      }
      onSuccess()
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Overlay onClose={onClose}>
      <h2 style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: 20, fontWeight: 700, color: '#1C2B3A', margin: '0 0 12px' }}>
        Remove {elder.name}&apos;s profile?
      </h2>
      <p style={{ fontSize: 14, color: '#6B7280', margin: '0 0 16px', lineHeight: 1.6 }}>
        Their personal details (name, health notes, contact) will be removed immediately. Past session records are kept anonymously — your companion&apos;s work history depends on them.
      </p>
      {error && <p style={{ fontSize: 13, color: '#E85D4A', margin: '0 0 12px' }}>{error}</p>}
      <div style={{ display: 'flex', gap: 10 }}>
        <button onClick={onClose} style={{
          flex: 1, background: '#FFFFFF', color: '#1C2B3A',
          border: '1.5px solid #E8E0D8', borderRadius: 10, padding: '11px 0',
          fontWeight: 600, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit',
        }}>
          Cancel
        </button>
        <button onClick={handle} disabled={loading} style={{
          flex: 1, background: '#E85D4A', color: '#FFFFFF',
          border: 'none', borderRadius: 10, padding: '11px 0',
          fontWeight: 600, fontSize: 14, cursor: loading ? 'default' : 'pointer',
          fontFamily: 'inherit', opacity: loading ? 0.7 : 1,
        }}>
          {loading ? 'Removing…' : 'Remove profile'}
        </button>
      </div>
    </Overlay>
  )
}

function Overlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(28,43,58,0.5)',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
        padding: '0 0 0 0',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#FFFFFF', borderRadius: '20px 20px 0 0',
          padding: '28px 24px 40px', width: '100%', maxWidth: 520,
          maxHeight: '90vh', overflowY: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PrivacyPage() {
  const [userData, setUserData] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)
  const [showDeleteAccount, setShowDeleteAccount] = useState(false)
  const [elderToDelete, setElderToDelete] = useState<{ id: string; name: string } | null>(null)
  const [toast, setToast] = useState('')
  const [activePlans, setActivePlans] = useState(0)

  useEffect(() => {
    async function load() {
      try {
        const [profileRes, plansRes] = await Promise.all([
          fetch('/api/user/profile'),
          fetch('/api/care-plans'),
        ])
        if (profileRes.ok) {
          const d = await profileRes.json() as UserData
          setUserData(d)
        }
        if (plansRes.ok) {
          const d = await plansRes.json() as { carePlans?: unknown[] }
          setActivePlans(Array.isArray(d.carePlans) ? d.carePlans.length : 0)
        }
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [])

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  async function clearNotifications() {
    await fetch('/api/user/deletion', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requestType: 'NOTIFICATION_CLEAR' }),
    })
    showToast('Notification history cleared')
  }

  function handleElderDeleted(elderId: string) {
    setElderToDelete(null)
    setUserData((prev) => prev
      ? { ...prev, elderProfiles: prev.elderProfiles.filter((e) => e.id !== elderId) }
      : prev
    )
    showToast('Elder profile removed')
  }

  if (loading) return <LoadingSkeleton />

  const activeElders = userData?.elderProfiles.filter((e) => e.isActive) ?? []

  return (
    <div style={{ minHeight: '100vh', background: '#FEF8F0', fontFamily: 'DM Sans, sans-serif' }}>

      {/* Header */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 40,
        background: '#FFFFFF', borderBottom: '1px solid #E8E0D8',
        padding: '12px 20px',
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <Link href="/dashboard" style={{ color: '#6B7280', textDecoration: 'none' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
        </Link>
        <div style={{ flex: 1 }}>
          <p style={{ fontWeight: 700, fontSize: 15, color: '#1C2B3A', margin: 0 }}>Privacy & Data</p>
          <p style={{ fontSize: 12, color: '#9CA3AF', margin: 0 }}>Your rights. Your control.</p>
        </div>
        <NearDearLogo width={90} variant="compact" />
      </div>

      <div style={{ maxWidth: 520, margin: '0 auto', padding: '28px 20px 80px' }}>

        {/* Principle statement */}
        <div style={{
          background: '#1A6B7A', borderRadius: 16, padding: '20px 22px', marginBottom: 32,
        }}>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.9)', lineHeight: 1.7, margin: 0, fontStyle: 'italic' }}>
            &ldquo;Your personal identity is yours. You can take it back. A record of care given or received belongs to both parties. A safety record belongs to the platform and the public.&rdquo;
          </p>
        </div>

        {/* Personal Information */}
        <Section label="Personal Information">
          <Row
            icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4A8C6F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>}
            title="Your profile"
            description={userData ? `${userData.name} · ${userData.phone} · ${userData.city}` : ''}
            action={
              <Link href="/settings" style={{ display: 'inline-block', background: '#FFFFFF', color: '#1C2B3A', border: '1.5px solid #E8E0D8', borderRadius: 10, padding: '7px 14px', fontWeight: 600, fontSize: 12, textDecoration: 'none' }}>
                Edit details
              </Link>
            }
          />
          <Row
            icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4A8C6F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>}
            title="Download all your data"
            description="Everything NearDear holds: sessions, notes, payments, notifications — in a single JSON file."
            action={
              <a href="/api/user/export" download style={{ display: 'inline-block', background: '#FFFFFF', color: '#1C2B3A', border: '1.5px solid #E8E0D8', borderRadius: 10, padding: '7px 14px', fontWeight: 600, fontSize: 12, textDecoration: 'none' }}>
                Download my data
              </a>
            }
          />
        </Section>

        {/* Elder Profiles */}
        <Section label="Elder Profiles">
          {activeElders.length === 0 ? (
            <div style={{ padding: '20px 18px', textAlign: 'center' }}>
              <p style={{ fontSize: 14, color: '#9CA3AF', margin: 0 }}>No active elder profiles</p>
            </div>
          ) : (
            activeElders.map((elder, i) => (
              <div key={elder.id} style={{ borderBottom: i < activeElders.length - 1 ? '1px solid #F3F4F6' : 'none' }}>
                <Row
                  icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4A8C6F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>}
                  title={elder.name}
                  description={`${elder.city} · Past session records are kept anonymously for your companion's work history.`}
                  action={
                    <div style={{ display: 'flex', gap: 8 }}>
                      <Link href={`/elder/${elder.id}/care-diary`} style={{ display: 'inline-block', background: '#FFFFFF', color: '#4A8C6F', border: '1.5px solid #4A8C6F', borderRadius: 10, padding: '7px 14px', fontWeight: 600, fontSize: 12, textDecoration: 'none' }}>
                        View diary
                      </Link>
                      <button onClick={() => setElderToDelete(elder)} style={{ background: '#FEF9F8', color: '#E85D4A', border: '1.5px solid #E85D4A33', borderRadius: 10, padding: '7px 14px', fontWeight: 600, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>
                        Remove
                      </button>
                    </div>
                  }
                />
              </div>
            ))
          )}
        </Section>

        {/* Session History */}
        <Section label="Session History">
          <Row
            icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="16" y1="2" x2="16" y2="6"/></svg>}
            title={`${userData?.sessionCount ?? 0} sessions recorded`}
            description="Session records cannot be deleted — your companion's work history depends on them. If you close your account, your name is replaced with 'Anonymous User'."
            action={
              <div style={{ display: 'flex', gap: 8 }}>
                <Link href="/sessions" style={{ display: 'inline-block', background: '#FFFFFF', color: '#1C2B3A', border: '1.5px solid #E8E0D8', borderRadius: 10, padding: '7px 14px', fontWeight: 600, fontSize: 12, textDecoration: 'none' }}>
                  View sessions
                </Link>
              </div>
            }
          />
        </Section>

        {/* Notification History */}
        <Section label="Notification History">
          <Row
            icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4A8C6F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>}
            title="Clear notification history"
            description="Removes all in-app notifications immediately. This does not affect SMS or WhatsApp messages already sent."
            action={
              <ActionButton label="Clear history" onClick={clearNotifications} small />
            }
          />
        </Section>

        {/* Account Deletion */}
        <Section label="Account">
          <Row
            icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#E85D4A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>}
            title="Delete my account"
            description="Immediately closes your account. Personal details removed within 30 days. Financial and safety records kept as required by law."
            action={
              <ActionButton
                label="Delete account"
                onClick={() => setShowDeleteAccount(true)}
                danger
                small
              />
            }
            danger
          />
        </Section>

        {/* What is never deleted */}
        <div style={{
          background: '#FFFFFF', borderRadius: 16,
          border: '1px solid #E8E0D8', padding: '18px 20px',
        }}>
          <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9CA3AF', margin: '0 0 12px' }}>
            What is always kept
          </p>
          {[
            { label: 'Session records', note: 'Anonymised — companion\'s work history', icon: '📋' },
            { label: 'Payment records', note: '7 years — required by financial law', icon: '💳' },
            { label: 'Concern records', note: 'Permanent — safety accountability', icon: '⚠️' },
            { label: 'Conduct violations', note: 'Permanent — public safety', icon: '🔒' },
          ].map((item) => (
            <div key={item.label} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 10 }}>
              <span style={{ fontSize: 14, flexShrink: 0, lineHeight: 1.6 }}>{item.icon}</span>
              <div>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>{item.label} </span>
                <span style={{ fontSize: 13, color: '#9CA3AF' }}>— {item.note}</span>
              </div>
            </div>
          ))}
        </div>

      </div>

      {/* Modals */}
      {showDeleteAccount && (
        <ConfirmDeleteAccountModal
          onClose={() => setShowDeleteAccount(false)}
          sessionCount={userData?.sessionCount ?? 0}
          planCount={activePlans}
        />
      )}
      {elderToDelete && (
        <ConfirmElderDeleteModal
          elder={elderToDelete}
          onClose={() => setElderToDelete(null)}
          onSuccess={() => handleElderDeleted(elderToDelete.id)}
        />
      )}

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
          background: '#1C2B3A', color: '#FFFFFF',
          borderRadius: 12, padding: '12px 20px',
          fontSize: 14, fontWeight: 500,
          boxShadow: '0 4px 20px rgba(0,0,0,0.2)', zIndex: 300,
          whiteSpace: 'nowrap',
        }}>
          {toast}
        </div>
      )}
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div style={{ minHeight: '100vh', background: '#FEF8F0', padding: '80px 24px' }}>
      <div style={{ maxWidth: 520, margin: '0 auto' }}>
        {[1, 2, 3].map((i) => (
          <div key={i} style={{
            background: '#E8E0D8', borderRadius: 16, height: 120,
            marginBottom: 20, animation: 'pulse 1.5s ease-in-out infinite',
          }} />
        ))}
      </div>
    </div>
  )
}
