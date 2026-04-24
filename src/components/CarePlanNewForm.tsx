'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { calculatePlan, DISCOUNT_MATRIX, UPFRONT_EXTRA_DISCOUNT } from '@/lib/carePlan'

// Window.Razorpay is declared globally in src/types/razorpay.d.ts

interface CarePlanNewFormProps {
  prefill: {
    companionId?: string
    companionName?: string
    serviceId?: string
    serviceName?: string
    serviceFee?: number
    elderProfileId?: string
    elderName?: string
  }
}

const FREQUENCY_OPTIONS = [
  { value: 'ONCE_WEEKLY',    label: 'Once a week' },
  { value: 'TWICE_WEEKLY',   label: 'Twice a week' },
  { value: 'THREE_WEEKLY',   label: 'Three times a week' },
  { value: 'DAILY_WEEKDAYS', label: 'Daily (Mon–Fri)' },
]

const DURATION_OPTIONS = [
  { value: 'ONE_MONTH',    label: '1 month',  months: 1 },
  { value: 'THREE_MONTHS', label: '3 months', months: 3 },
  { value: 'SIX_MONTHS',   label: '6 months', months: 6 },
]

const ALL_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

const DAY_ABBR: Record<string, string> = {
  Monday: 'Mon', Tuesday: 'Tue', Wednesday: 'Wed',
  Thursday: 'Thu', Friday: 'Fri', Saturday: 'Sat', Sunday: 'Sun',
}

const REQUIRED_DAYS: Record<string, number> = {
  ONCE_WEEKLY: 1,
  TWICE_WEEKLY: 2,
  THREE_WEEKLY: 3,
  DAILY_WEEKDAYS: 5,
}

const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']

const TIME_OPTIONS = [
  { value: 'MORNING', label: 'Morning (7am – 12pm)' },
  { value: 'AFTERNOON', label: 'Afternoon (12pm – 5pm)' },
  { value: 'EVENING', label: 'Evening (5pm – 9pm)' },
]

function fmt(n: number) {
  return n.toLocaleString('en-IN')
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window !== 'undefined' && window.Razorpay) {
      resolve(true)
      return
    }
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

export default function CarePlanNewForm({ prefill }: CarePlanNewFormProps) {
  const router = useRouter()
  const fee = prefill.serviceFee ?? 700

  const [frequency, setFrequency] = useState('TWICE_WEEKLY')
  const [duration, setDuration] = useState('THREE_MONTHS')
  const [billing, setBilling] = useState<'MONTHLY' | 'UPFRONT'>('MONTHLY')
  const [preferredDays, setPreferredDays] = useState<string[]>(['Monday', 'Wednesday'])
  const [preferredTime, setPreferredTime] = useState<'MORNING' | 'AFTERNOON' | 'EVENING'>('MORNING')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Live plan preview
  const plan = calculatePlan(fee, frequency, duration, billing)

  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Reset preferred days when frequency changes
  useEffect(() => {
    if (frequency === 'ONCE_WEEKLY') setPreferredDays(['Monday'])
    else if (frequency === 'TWICE_WEEKLY') setPreferredDays(['Monday', 'Wednesday'])
    else if (frequency === 'THREE_WEEKLY') setPreferredDays(['Monday', 'Wednesday', 'Friday'])
    else if (frequency === 'DAILY_WEEKDAYS') setPreferredDays(WEEKDAYS)
  }, [frequency])

  // Debounced preview fetch (no-op — we use calculatePlan client-side directly)
  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current)
    debounceTimer.current = setTimeout(() => {
      // Client-side calculation via calculatePlan is instant; no server fetch needed for preview
    }, 300)
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current)
    }
  }, [frequency, duration, billing])

  function toggleDay(day: string) {
    if (frequency === 'DAILY_WEEKDAYS') return
    const required = REQUIRED_DAYS[frequency] ?? 1
    if (preferredDays.includes(day)) {
      setPreferredDays((prev) => prev.filter((d) => d !== day))
    } else if (preferredDays.length < required) {
      setPreferredDays((prev) => [...prev, day])
    }
  }

  const canSubmit = useCallback(() => {
    if (!prefill.serviceId || !prefill.companionId) return false
    if (frequency === 'DAILY_WEEKDAYS') return true
    const required = REQUIRED_DAYS[frequency] ?? 1
    return preferredDays.length === required
  }, [frequency, preferredDays, prefill.serviceId, prefill.companionId])

  async function handleCreatePlan() {
    if (!canSubmit()) return
    setSubmitting(true)
    setError(null)

    try {
      const res = await fetch('/api/care-plans/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          providerProfileId: prefill.companionId,
          serviceCategoryId: prefill.serviceId,
          elderProfileId: prefill.elderProfileId || undefined,
          frequency,
          duration,
          billing,
          preferredDays: frequency === 'DAILY_WEEKDAYS' ? WEEKDAYS : preferredDays,
          preferredTime,
        }),
      })

      const data = await res.json() as {
        planId?: string
        orderId?: string
        amount?: number
        keyId?: string
        error?: string
      }

      if (!res.ok || !data.planId) {
        setError(data.error ?? 'Something went wrong. Please try again.')
        setSubmitting(false)
        return
      }

      const loaded = await loadRazorpayScript()
      if (!loaded) {
        setError('Could not load payment gateway. Please try again.')
        setSubmitting(false)
        return
      }

      const planSummary = `${FREQUENCY_OPTIONS.find(f => f.value === frequency)?.label}, ${DURATION_OPTIONS.find(d => d.value === duration)?.label}`

      const rzp = new window.Razorpay({
        key: data.keyId ?? '',
        amount: data.amount ?? 0,
        currency: 'INR',
        name: 'NearDear',
        description: `Care Plan — ${planSummary}`,
        order_id: data.orderId ?? '',
        handler: (_response) => {
          router.push(`/care-plan/${data.planId}?payment=success`)
        },
        prefill: { name: '', contact: '' },
        modal: {
          ondismiss: () => {
            setSubmitting(false)
          },
        },
      })
      rzp.open()
    } catch {
      setError('Something went wrong. Please try again.')
      setSubmitting(false)
    }
  }

  const durationLabel = DURATION_OPTIONS.find((d) => d.value === duration)?.label ?? ''
  const requiredDaysCount = REQUIRED_DAYS[frequency] ?? 1

  return (
    <div style={{ minHeight: '100vh', background: '#FEF8F0', padding: '32px 16px', fontFamily: 'DM Sans, sans-serif' }}>
      <div style={{ maxWidth: 960, margin: '0 auto' }}>

        {/* Page header */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{
            fontFamily: 'Playfair Display, Georgia, serif',
            fontWeight: 700, fontSize: 28, color: '#1C2B3A',
            marginBottom: 6, lineHeight: 1.3,
          }}>
            Create a care plan
          </h1>
          <p style={{ color: '#6B7280', fontSize: 15 }}>
            Lock in regular visits at a lower rate — adjust frequency and duration below.
          </p>
        </div>

        {/* Two-column layout */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 360px)',
          gap: 24,
          alignItems: 'start',
        }}>

          {/* LEFT: Configuration */}
          <div>

            {/* Service + Companion summary */}
            <div style={{
              background: '#FFFFFF', borderRadius: 16,
              border: '1px solid #E8E0D8', padding: 16, marginBottom: 20,
            }}>
              <p style={{
                fontSize: 11, fontWeight: 600, textTransform: 'uppercase' as const,
                letterSpacing: '0.08em', color: '#1A6B7A', marginBottom: 12,
              }}>
                For this service
              </p>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: '50%', background: '#4A8C6F',
                  color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 700, fontSize: 15, flexShrink: 0,
                }}>
                  {prefill.companionName?.charAt(0).toUpperCase() ?? '?'}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: 600, fontSize: 15, color: '#1C2B3A', margin: 0 }}>
                    {prefill.companionName ?? 'Select a companion'}
                  </p>
                  <p style={{ fontSize: 13, color: '#6B7280', margin: 0 }}>
                    {prefill.serviceName ?? 'Select a service'}
                  </p>
                </div>
                {(!prefill.companionId || !prefill.serviceId) && (
                  <a
                    href="/request/new"
                    style={{ fontSize: 13, color: '#E07B2F', fontWeight: 600, textDecoration: 'none' }}
                  >
                    Change →
                  </a>
                )}
              </div>
              {prefill.elderName && (
                <p style={{ fontSize: 13, color: '#6B7280', margin: 0 }}>
                  For: {prefill.elderName}
                </p>
              )}
              {prefill.serviceFee && (
                <p style={{ fontSize: 13, color: '#6B7280', margin: 0, fontFamily: 'DM Mono, monospace' }}>
                  ₹{fmt(prefill.serviceFee)} per visit (regular rate)
                </p>
              )}
            </div>

            {/* Frequency */}
            <Section label="How often?">
              {FREQUENCY_OPTIONS.map((opt) => {
                const disc = DISCOUNT_MATRIX[duration]?.[opt.value] ?? 0
                return (
                  <RadioRow
                    key={opt.value}
                    label={opt.label}
                    badge={disc > 0 ? `${disc}% off` : undefined}
                    selected={frequency === opt.value}
                    onClick={() => setFrequency(opt.value)}
                  />
                )
              })}
            </Section>

            {/* Duration */}
            <Section label="For how long?">
              {DURATION_OPTIONS.map((opt) => {
                const disc = DISCOUNT_MATRIX[opt.value]?.[frequency] ?? 0
                return (
                  <RadioRow
                    key={opt.value}
                    label={opt.label}
                    badge={disc > 0 ? `${disc}% off` : undefined}
                    selected={duration === opt.value}
                    onClick={() => setDuration(opt.value)}
                  />
                )
              })}
            </Section>

            {/* Preferred days */}
            <Section label={
              frequency === 'DAILY_WEEKDAYS'
                ? 'Days (Monday – Friday)'
                : `Preferred days (pick ${requiredDaysCount})`
            }>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' as const, padding: '4px 0' }}>
                {ALL_DAYS.map((day) => {
                  const isWeekend = day === 'Saturday' || day === 'Sunday'
                  const locked = frequency === 'DAILY_WEEKDAYS'
                  const active = locked ? !isWeekend : preferredDays.includes(day)
                  const disabled = locked || (isWeekend && locked)
                  return (
                    <button
                      key={day}
                      onClick={() => !disabled && toggleDay(day)}
                      style={{
                        padding: '6px 12px', borderRadius: 9999, fontSize: 13, fontWeight: 600,
                        border: `1.5px solid ${active ? '#E07B2F' : '#E8E0D8'}`,
                        background: active ? '#E07B2F' : '#FFFFFF',
                        color: active ? '#FFFFFF' : '#6B7280',
                        cursor: locked || disabled ? 'default' : 'pointer',
                        opacity: isWeekend && frequency === 'DAILY_WEEKDAYS' ? 0.35 : 1,
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {DAY_ABBR[day]}
                    </button>
                  )
                })}
              </div>
              {frequency !== 'DAILY_WEEKDAYS' && preferredDays.length < requiredDaysCount && (
                <p style={{ fontSize: 12, color: '#9CA3AF', marginTop: 8, marginBottom: 0 }}>
                  Select {requiredDaysCount - preferredDays.length} more day
                  {requiredDaysCount - preferredDays.length !== 1 ? 's' : ''}
                </p>
              )}
            </Section>

            {/* Preferred time */}
            <Section label="Preferred time of day">
              {TIME_OPTIONS.map((opt) => (
                <RadioRow
                  key={opt.value}
                  label={opt.label}
                  selected={preferredTime === opt.value}
                  onClick={() => setPreferredTime(opt.value as 'MORNING' | 'AFTERNOON' | 'EVENING')}
                />
              ))}
            </Section>

            {/* Error */}
            {error && (
              <div style={{
                background: '#FEF2F2', border: '1px solid #FECACA',
                borderRadius: 12, padding: '12px 16px', marginBottom: 16,
                color: '#E85D4A', fontSize: 14,
              }}>
                {error}
              </div>
            )}

            {/* CTA */}
            <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 10, marginBottom: 32 }}>
              <button
                onClick={handleCreatePlan}
                disabled={submitting || !canSubmit()}
                style={{
                  background: submitting || !canSubmit() ? '#C4600A' : '#E07B2F',
                  color: '#FFFFFF', borderRadius: 12, padding: '15px 0',
                  fontWeight: 600, fontSize: 16, border: 'none',
                  cursor: submitting || !canSubmit() ? 'not-allowed' : 'pointer',
                  opacity: !canSubmit() ? 0.6 : 1,
                  transition: 'all 0.15s ease',
                  fontFamily: 'DM Sans, sans-serif',
                }}
              >
                {submitting
                  ? 'Creating plan…'
                  : `Create Care Plan — save ₹${fmt(plan.totalSavings)}`}
              </button>
              <button
                onClick={() => router.back()}
                style={{
                  background: 'transparent', color: '#6B7280', border: 'none',
                  fontSize: 14, cursor: 'pointer', padding: '10px 0',
                  fontFamily: 'DM Sans, sans-serif',
                }}
              >
                Continue without a plan
              </button>
            </div>
          </div>

          {/* RIGHT: Sticky plan summary */}
          <div style={{ position: 'sticky', top: 24 }}>
            <div style={{
              background: '#FFFFFF', borderRadius: 16,
              border: '1px solid #E8E0D8', padding: 24,
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            }}>
              <p style={{
                fontSize: 11, fontWeight: 600, textTransform: 'uppercase' as const,
                letterSpacing: '0.08em', color: '#1A6B7A', marginBottom: 16,
              }}>
                Your plan summary
              </p>

              {/* Visit count */}
              <p style={{
                fontFamily: 'Playfair Display, Georgia, serif',
                fontSize: 20, fontWeight: 700, color: '#1C2B3A', marginBottom: 4,
              }}>
                {plan.totalSessions} visits over {durationLabel}
              </p>
              <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 20 }}>
                {frequency === 'DAILY_WEEKDAYS'
                  ? 'Monday through Friday each week'
                  : `${preferredDays.join(', ')} — ${TIME_OPTIONS.find(t => t.value === preferredTime)?.label}`}
              </p>

              {/* Pricing */}
              <div style={{ borderBottom: '1px solid #F3F4F6', paddingBottom: 16, marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 14, color: '#9CA3AF' }}>Regular price</span>
                  <span style={{
                    fontSize: 14, color: '#9CA3AF',
                    fontFamily: 'DM Mono, monospace',
                    textDecoration: 'line-through',
                  }}>
                    ₹{fmt(plan.totalRegularPrice)}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 14, color: '#1C2B3A', fontWeight: 600 }}>Plan price</span>
                  <span style={{
                    fontSize: 16, color: '#1C2B3A', fontWeight: 700,
                    fontFamily: 'DM Mono, monospace',
                  }}>
                    ₹{fmt(plan.totalPlanPrice)}
                  </span>
                </div>
                <div style={{
                  background: '#F0FAF4', borderRadius: 10, padding: '10px 14px',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#4A8C6F' }}>You save</span>
                  <span style={{
                    fontSize: 15, fontWeight: 700, color: '#4A8C6F',
                    fontFamily: 'DM Mono, monospace',
                  }}>
                    ₹{fmt(plan.totalSavings)} ({plan.totalDiscountPercent}%)
                  </span>
                </div>
              </div>

              {/* Free visits equivalent */}
              {plan.totalDiscountPercent > 0 && (
                <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 16, lineHeight: 1.5 }}>
                  That&apos;s approximately{' '}
                  <strong style={{ color: '#4A8C6F' }}>
                    {Math.round(plan.totalSavings / plan.regularPricePerVisit)} free visits
                  </strong>{' '}
                  at regular price.
                </p>
              )}

              {/* Discount label */}
              <div style={{
                background: '#FFF7F0', borderRadius: 8, padding: '8px 12px',
                marginBottom: 20,
              }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#E07B2F' }}>
                  {plan.totalDiscountPercent}% discount applied
                </span>
              </div>

              {/* Billing toggle */}
              <p style={{ fontSize: 13, fontWeight: 600, color: '#1C2B3A', marginBottom: 10 }}>
                Billing
              </p>
              <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 6 }}>
                <button
                  onClick={() => setBilling('MONTHLY')}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 12px', borderRadius: 10, border: 'none',
                    background: billing === 'MONTHLY' ? '#FFF7F0' : 'transparent',
                    cursor: 'pointer', textAlign: 'left' as const, width: '100%',
                    outline: billing === 'MONTHLY' ? '1.5px solid #E07B2F' : '1px solid #E8E0D8',
                  }}
                >
                  <div style={{
                    width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
                    border: `2px solid ${billing === 'MONTHLY' ? '#E07B2F' : '#D1D5DB'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {billing === 'MONTHLY' && (
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#E07B2F' }} />
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: 14, fontWeight: 500, color: '#1C2B3A' }}>Monthly</span>
                    {plan.monthlyAmount && (
                      <span style={{ fontSize: 13, color: '#6B7280', marginLeft: 6, fontFamily: 'DM Mono, monospace' }}>
                        ₹{fmt(plan.monthlyAmount)}/month
                      </span>
                    )}
                  </div>
                </button>

                <button
                  onClick={() => setBilling('UPFRONT')}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 12px', borderRadius: 10, border: 'none',
                    background: billing === 'UPFRONT' ? '#FFF7F0' : 'transparent',
                    cursor: 'pointer', textAlign: 'left' as const, width: '100%',
                    outline: billing === 'UPFRONT' ? '1.5px solid #E07B2F' : '1px solid #E8E0D8',
                  }}
                >
                  <div style={{
                    width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
                    border: `2px solid ${billing === 'UPFRONT' ? '#E07B2F' : '#D1D5DB'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {billing === 'UPFRONT' && (
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#E07B2F' }} />
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: 14, fontWeight: 500, color: '#1C2B3A' }}>Full upfront</span>
                    <span style={{ fontSize: 13, color: '#6B7280', marginLeft: 6, fontFamily: 'DM Mono, monospace' }}>
                      ₹{fmt(plan.totalPlanPrice)} total
                    </span>
                  </div>
                  <span style={{
                    background: '#F0FAF4', color: '#4A8C6F',
                    borderRadius: 9999, padding: '2px 8px', fontSize: 12, fontWeight: 600,
                    flexShrink: 0,
                  }}>
                    Extra {UPFRONT_EXTRA_DISCOUNT}% off
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile responsive styles */}
      <style>{`
        @media (max-width: 768px) {
          .care-plan-grid {
            grid-template-columns: 1fr !important;
          }
          .plan-summary-sticky {
            position: static !important;
          }
        }
      `}</style>
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <p style={{ fontSize: 13, fontWeight: 600, color: '#1C2B3A', marginBottom: 10 }}>
        {label}
      </p>
      <div style={{
        background: '#FFFFFF', borderRadius: 16,
        border: '1px solid #E8E0D8', overflow: 'hidden',
        padding: 12, display: 'flex', flexDirection: 'column' as const, gap: 4,
      }}>
        {children}
      </div>
    </div>
  )
}

function RadioRow({
  label, sublabel, badge, selected, onClick,
}: {
  label: string
  sublabel?: string
  badge?: string
  selected: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '10px 12px', borderRadius: 10, border: 'none',
        background: selected ? '#FFF7F0' : 'transparent',
        cursor: 'pointer', textAlign: 'left' as const, width: '100%',
        outline: selected ? '1.5px solid #E07B2F' : '1px solid transparent',
        transition: 'all 0.15s ease',
        fontFamily: 'DM Sans, sans-serif',
      }}
    >
      <div style={{
        width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
        border: `2px solid ${selected ? '#E07B2F' : '#D1D5DB'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {selected && (
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#E07B2F' }} />
        )}
      </div>
      <div style={{ flex: 1 }}>
        <span style={{ fontSize: 14, fontWeight: 500, color: '#1C2B3A' }}>{label}</span>
        {sublabel && (
          <span style={{ fontSize: 13, color: '#6B7280', marginLeft: 6 }}>{sublabel}</span>
        )}
      </div>
      {badge && (
        <span style={{
          background: '#F0FAF4', color: '#4A8C6F',
          borderRadius: 9999, padding: '2px 8px', fontSize: 12, fontWeight: 600, flexShrink: 0,
        }}>
          {badge}
        </span>
      )}
    </button>
  )
}
