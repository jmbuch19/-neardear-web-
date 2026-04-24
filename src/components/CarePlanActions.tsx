'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface CarePlanActionsProps {
  planId: string
}

export default function CarePlanActions({ planId }: CarePlanActionsProps) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const [showPauseModal, setShowPauseModal] = useState(false)
  const [showTimeModal, setShowTimeModal] = useState(false)
  const [pausedUntil, setPausedUntil] = useState('')
  const [cancelReason, setCancelReason] = useState('')
  const [newTime, setNewTime] = useState('MORNING')

  async function callPatch(body: Record<string, string | undefined>) {
    setLoading(body.action ?? null)
    setError(null)
    try {
      const res = await fetch(`/api/care-plans/${planId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json() as { error?: string }
      if (!res.ok) {
        setError(data.error ?? 'Something went wrong.')
      } else {
        router.refresh()
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(null)
      setShowCancelConfirm(false)
      setShowPauseModal(false)
      setShowTimeModal(false)
    }
  }

  return (
    <div style={{ marginBottom: 24 }}>
      <p style={{
        fontSize: 11, fontWeight: 600, textTransform: 'uppercase' as const,
        letterSpacing: '0.08em', color: '#6B7280', marginBottom: 12,
      }}>
        Plan actions
      </p>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' as const }}>
        <button
          onClick={() => setShowPauseModal(true)}
          disabled={loading !== null}
          style={{
            background: '#FFFFFF', color: '#1A6B7A',
            border: '1.5px solid #1A6B7A',
            borderRadius: 10, padding: '10px 18px',
            fontWeight: 600, fontSize: 14, cursor: 'pointer',
            opacity: loading ? 0.6 : 1,
            fontFamily: 'DM Sans, sans-serif',
          }}
        >
          {loading === 'pause' ? 'Pausing…' : 'Pause plan'}
        </button>

        <button
          onClick={() => setShowTimeModal(true)}
          disabled={loading !== null}
          style={{
            background: '#FFFFFF', color: '#1C2B3A',
            border: '1.5px solid #E8E0D8',
            borderRadius: 10, padding: '10px 18px',
            fontWeight: 600, fontSize: 14, cursor: 'pointer',
            opacity: loading ? 0.6 : 1,
            fontFamily: 'DM Sans, sans-serif',
          }}
        >
          Change time
        </button>

        <button
          onClick={() => setShowCancelConfirm(true)}
          disabled={loading !== null}
          style={{
            background: '#FFFFFF', color: '#E85D4A',
            border: '1.5px solid #FECACA',
            borderRadius: 10, padding: '10px 18px',
            fontWeight: 600, fontSize: 14, cursor: 'pointer',
            opacity: loading ? 0.6 : 1,
            fontFamily: 'DM Sans, sans-serif',
          }}
        >
          {loading === 'cancel' ? 'Cancelling…' : 'Cancel plan'}
        </button>
      </div>

      {error && (
        <div style={{
          background: '#FEF2F2', border: '1px solid #FECACA',
          borderRadius: 10, padding: '10px 14px', marginTop: 12,
          color: '#E85D4A', fontSize: 14,
        }}>
          {error}
        </div>
      )}

      {/* Pause modal */}
      {showPauseModal && (
        <Modal onClose={() => setShowPauseModal(false)}>
          <h3 style={{
            fontFamily: 'Playfair Display, Georgia, serif',
            fontWeight: 700, fontSize: 20, color: '#1C2B3A', marginBottom: 12,
          }}>
            Pause your care plan
          </h3>
          <p style={{ fontSize: 14, color: '#6B7280', marginBottom: 16 }}>
            Your sessions will be paused. You can resume at any time.
          </p>
          <label style={{ fontSize: 13, fontWeight: 600, color: '#1C2B3A', display: 'block', marginBottom: 6 }}>
            Pause until (optional)
          </label>
          <input
            type="date"
            value={pausedUntil}
            onChange={(e) => setPausedUntil(e.target.value)}
            style={{
              width: '100%', padding: '10px 12px', borderRadius: 10,
              border: '1.5px solid #E8E0D8', fontSize: 14, color: '#1C2B3A',
              background: '#FFFFFF', marginBottom: 16, boxSizing: 'border-box' as const,
            }}
          />
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => callPatch({ action: 'pause', pausedUntil: pausedUntil || undefined })}
              disabled={loading !== null}
              style={{
                background: '#1A6B7A', color: '#FFFFFF', border: 'none',
                borderRadius: 10, padding: '10px 20px', fontWeight: 600, fontSize: 14,
                cursor: 'pointer', flex: 1,
              }}
            >
              {loading === 'pause' ? 'Pausing…' : 'Pause plan'}
            </button>
            <button
              onClick={() => setShowPauseModal(false)}
              style={{
                background: '#FFFFFF', color: '#6B7280', border: '1px solid #E8E0D8',
                borderRadius: 10, padding: '10px 20px', fontWeight: 500, fontSize: 14,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
          </div>
        </Modal>
      )}

      {/* Change time modal */}
      {showTimeModal && (
        <Modal onClose={() => setShowTimeModal(false)}>
          <h3 style={{
            fontFamily: 'Playfair Display, Georgia, serif',
            fontWeight: 700, fontSize: 20, color: '#1C2B3A', marginBottom: 12,
          }}>
            Change preferred time
          </h3>
          <p style={{ fontSize: 14, color: '#6B7280', marginBottom: 16 }}>
            All future sessions will be adjusted to the new preferred time.
          </p>
          {[
            { value: 'MORNING', label: 'Morning (7am – 12pm)' },
            { value: 'AFTERNOON', label: 'Afternoon (12pm – 5pm)' },
            { value: 'EVENING', label: 'Evening (5pm – 9pm)' },
          ].map((opt) => (
            <button
              key={opt.value}
              onClick={() => setNewTime(opt.value)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                padding: '10px 12px', borderRadius: 10, border: 'none', marginBottom: 6,
                background: newTime === opt.value ? '#FFF7F0' : '#FFFFFF',
                cursor: 'pointer', textAlign: 'left' as const,
                outline: newTime === opt.value ? '1.5px solid #E07B2F' : '1px solid #E8E0D8',
              }}
            >
              <span style={{ fontSize: 14, fontWeight: 500, color: '#1C2B3A' }}>{opt.label}</span>
            </button>
          ))}
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button
              onClick={() => callPatch({ action: 'update_time', preferredTime: newTime })}
              disabled={loading !== null}
              style={{
                background: '#E07B2F', color: '#FFFFFF', border: 'none',
                borderRadius: 10, padding: '10px 20px', fontWeight: 600, fontSize: 14,
                cursor: 'pointer', flex: 1,
              }}
            >
              {loading === 'update_time' ? 'Saving…' : 'Save change'}
            </button>
            <button
              onClick={() => setShowTimeModal(false)}
              style={{
                background: '#FFFFFF', color: '#6B7280', border: '1px solid #E8E0D8',
                borderRadius: 10, padding: '10px 20px', fontWeight: 500, fontSize: 14,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
          </div>
        </Modal>
      )}

      {/* Cancel confirm modal */}
      {showCancelConfirm && (
        <Modal onClose={() => setShowCancelConfirm(false)}>
          <h3 style={{
            fontFamily: 'Playfair Display, Georgia, serif',
            fontWeight: 700, fontSize: 20, color: '#1C2B3A', marginBottom: 8,
          }}>
            Cancel care plan?
          </h3>
          <p style={{ fontSize: 14, color: '#6B7280', marginBottom: 16, lineHeight: 1.6 }}>
            Cancelling will stop all future sessions. A refund will be calculated based on remaining sessions.
          </p>
          <label style={{ fontSize: 13, fontWeight: 600, color: '#1C2B3A', display: 'block', marginBottom: 6 }}>
            Reason (optional)
          </label>
          <textarea
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            rows={3}
            placeholder="Let us know why you're cancelling…"
            style={{
              width: '100%', padding: '10px 12px', borderRadius: 10,
              border: '1.5px solid #E8E0D8', fontSize: 14, color: '#1C2B3A',
              background: '#FFFFFF', marginBottom: 16, resize: 'vertical' as const,
              boxSizing: 'border-box' as const, fontFamily: 'DM Sans, sans-serif',
            }}
          />
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => callPatch({ action: 'cancel', cancelReason: cancelReason || undefined })}
              disabled={loading !== null}
              style={{
                background: '#E85D4A', color: '#FFFFFF', border: 'none',
                borderRadius: 10, padding: '10px 20px', fontWeight: 600, fontSize: 14,
                cursor: 'pointer', flex: 1,
              }}
            >
              {loading === 'cancel' ? 'Cancelling…' : 'Yes, cancel plan'}
            </button>
            <button
              onClick={() => setShowCancelConfirm(false)}
              style={{
                background: '#FFFFFF', color: '#6B7280', border: '1px solid #E8E0D8',
                borderRadius: 10, padding: '10px 20px', fontWeight: 500, fontSize: 14,
                cursor: 'pointer',
              }}
            >
              Keep plan
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}

function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed' as const, inset: 0, background: 'rgba(0,0,0,0.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000, padding: 24,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#FFFFFF', borderRadius: 16, padding: 24,
          maxWidth: 420, width: '100%',
          boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
        }}
      >
        {children}
      </div>
    </div>
  )
}
