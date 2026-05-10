'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import type { Session } from 'next-auth'
import type { ApplicationData } from '../types'

interface Props {
  data: ApplicationData
  setData: (update: Partial<ApplicationData>) => void
  onSubmitted: (applicationId: string) => void
  onBack: () => void
  session: Session | null
}

const HARD_RULES = [
  'No cash accepted. Ever. All payments through platform only. Cash transaction = immediate suspension.',
  'No gifts accepted. Declination is mandatory.',
  'No personal financial information. No bank details, passwords, PINs. Violation = permanent removal.',
  'No contact outside the platform. No WhatsApp. No private phone exchange.',
  'Scope is presence and errands only. Not medical. Not legal. Not financial.',
  'Medical observations reported through platform. Emergency: call 112 FIRST.',
  'No decisions on behalf of the elder. No signing. No consenting.',
]

const CONSENTS: {
  key: keyof Pick<ApplicationData,
    'consentCodeOfConduct' | 'consentHardRules' | 'consentViolations' | 'consentAccuracy' | 'consentVerification'
  >
  label: string
}[] = [
  { key: 'consentCodeOfConduct', label: 'I have read and understood the Code of Conduct' },
  { key: 'consentHardRules', label: 'I agree to all Hard Rules above' },
  { key: 'consentViolations', label: 'I understand that violations result in immediate suspension' },
  { key: 'consentAccuracy', label: 'I confirm all information I have provided is true and accurate' },
  { key: 'consentVerification', label: 'I consent to NearDear verifying my identity and background' },
]

export default function Declaration({ data, setData, onSubmitted, session }: Props) {
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  // Phone OTP sub-flow — applicants typically arrive without a session,
  // and the apply API requires an authenticated user. We bind the application
  // to the phone they entered in Step 1 by sending an OTP and signing them in.
  const phoneAuthed = !!session?.user?.phone && session.user.phone === data.phone
  const [otpSent, setOtpSent] = useState(false)
  const [otp, setOtp] = useState('')
  const [sendingOtp, setSendingOtp] = useState(false)

  const signatureMatches = data.digitalSignature.trim().toLowerCase() === data.legalName.trim().toLowerCase()

  function validate(): boolean {
    const e: Partial<Record<string, string>> = {}
    if (!data.consentCodeOfConduct) e.consentCodeOfConduct = 'Required'
    if (!data.consentHardRules) e.consentHardRules = 'Required'
    if (!data.consentViolations) e.consentViolations = 'Required'
    if (!data.consentAccuracy) e.consentAccuracy = 'Required'
    if (!data.consentVerification) e.consentVerification = 'Required'
    if (!data.digitalSignature.trim()) {
      e.digitalSignature = 'Please sign your application'
    } else if (!signatureMatches) {
      e.digitalSignature = 'Your signature must exactly match your legal name from Step 1'
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function postApplication() {
    const res = await fetch('/api/provider/apply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) {
      const body = await res.json() as { error?: string }
      throw new Error(body.error ?? 'Submission failed')
    }
    const result = await res.json() as { applicationId: string }
    onSubmitted(result.applicationId)
  }

  async function handleSendOtp() {
    setSubmitError('')
    if (!validate()) return
    setSendingOtp(true)
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: data.phone }),
      })
      const body = await res.json() as { error?: string }
      if (!res.ok) {
        throw new Error(body.error ?? 'Could not send OTP. Please try again.')
      }
      setOtpSent(true)
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Could not send OTP. Please try again.')
    } finally {
      setSendingOtp(false)
    }
  }

  async function handleVerifyAndSubmit() {
    setSubmitError('')
    if (!/^\d{6}$/.test(otp)) {
      setSubmitError('Please enter the 6-digit OTP we sent to your phone.')
      return
    }
    setSubmitting(true)
    try {
      const result = await signIn('credentials', {
        phone: data.phone,
        otp,
        redirect: false,
      })
      if (result?.error) {
        throw new Error('Invalid or expired OTP. Please try again.')
      }
      await postApplication()
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleSubmitAuthed() {
    if (!validate()) return
    setSubmitting(true)
    setSubmitError('')
    try {
      await postApplication()
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 pt-2">
      <div>
        <h2 className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-[#1C2B3A] mb-1">
          Before we proceed
        </h2>
        <p className="text-sm text-[#6B7280]">
          Please read and understand the NearDear Companion Code of Conduct.
        </p>
      </div>

      {/* Hard Rules */}
      <div className="bg-white rounded-2xl p-5 space-y-3" style={{ border: '1px solid #E8E0D8' }}>
        <h3 className="text-sm font-semibold text-[#1A6B7A] mb-3">Hard Rules — Non-negotiable</h3>
        <ol className="space-y-3">
          {HARD_RULES.map((rule, i) => (
            <li key={i} className="flex gap-3 text-sm text-[#1C2B3A]">
              <span
                className="flex-shrink-0 font-[family-name:var(--font-dm-mono)] font-semibold text-[#1A6B7A] min-w-[20px]"
              >
                {i + 1}.
              </span>
              <span>{rule}</span>
            </li>
          ))}
        </ol>
      </div>

      {/* Checkboxes */}
      <div className="bg-white rounded-2xl p-5 space-y-3" style={{ border: '1px solid #E8E0D8' }}>
        <h3 className="text-sm font-semibold text-[#1A6B7A] mb-1">Your declaration</h3>
        {CONSENTS.map(({ key, label }) => {
          const checked = data[key] as boolean
          return (
            <label
              key={key}
              className="flex items-start gap-3 cursor-pointer rounded-xl px-4 py-3 transition-all"
              style={{
                border: errors[key] ? '1.5px solid #E85D4A' : checked ? '1.5px solid #4A8C6F' : '1.5px solid #E8E0D8',
                background: checked ? '#F0F7F4' : '#FFFFFF',
              }}
            >
              <div
                onClick={() => setData({ [key]: !checked })}
                className="flex-shrink-0 mt-0.5 rounded flex items-center justify-center cursor-pointer"
                style={{
                  width: 20, height: 20,
                  background: checked ? '#4A8C6F' : '#FFFFFF',
                  border: checked ? '2px solid #4A8C6F' : errors[key] ? '2px solid #E85D4A' : '2px solid #E8E0D8',
                }}
              >
                {checked && (
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
              <span className="text-sm text-[#1C2B3A] flex-1">{label}</span>
            </label>
          )
        })}
      </div>

      {/* Digital Signature */}
      <div className="bg-white rounded-2xl p-5 space-y-3" style={{ border: '1px solid #E8E0D8' }}>
        <div>
          <label className="block text-sm font-semibold text-[#1C2B3A] mb-1">
            Sign your application
          </label>
          <p className="text-xs text-[#6B7280] mb-2">
            Type your full legal name exactly as you entered in Step 1
          </p>
          <div className="relative">
            <input
              type="text"
              value={data.digitalSignature}
              onChange={(e) => setData({ digitalSignature: e.target.value })}
              placeholder={data.legalName || 'Your full legal name'}
              className="w-full rounded-xl px-4 py-3 pr-10 text-[#1C2B3A] text-sm outline-none focus:ring-2 focus:ring-[#4A8C6F]"
              style={{
                border: errors.digitalSignature ? '1.5px solid #E85D4A' : signatureMatches && data.digitalSignature ? '1.5px solid #4A8C6F' : '1.5px solid #E8E0D8',
              }}
            />
            {signatureMatches && data.digitalSignature && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <circle cx="10" cy="10" r="10" fill="#4A8C6F" />
                  <path d="M5 10l4 4 6-7" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            )}
          </div>
          {errors.digitalSignature && <p className="text-xs text-[#E85D4A] mt-1">{errors.digitalSignature}</p>}
        </div>
      </div>

      {/* Phone verification — required so the application binds to a real, OTP-verified phone */}
      {!phoneAuthed && (
        <div className="bg-white rounded-2xl p-5 space-y-3" style={{ border: '1px solid #E8E0D8' }}>
          <div>
            <h3 className="text-sm font-semibold text-[#1A6B7A] mb-1">Verify your phone</h3>
            <p className="text-xs text-[#6B7280]">
              We&apos;ll send a 6-digit code to <span className="font-[family-name:var(--font-dm-mono)] text-[#1C2B3A]">+91 {data.phone || '...'}</span> to confirm it&apos;s yours.
            </p>
          </div>

          {!otpSent ? (
            <button
              type="button"
              onClick={handleSendOtp}
              disabled={sendingOtp || !data.phone}
              className="w-full rounded-xl py-3 font-semibold text-sm transition-opacity hover:opacity-90 disabled:opacity-60"
              style={{ background: '#FFF5EC', color: '#E07B2F', border: '1.5px solid #E07B2F' }}
            >
              {sendingOtp ? 'Sending OTP…' : 'Send verification code'}
            </button>
          ) : (
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-[#1C2B3A]">Enter 6-digit code</label>
              <input
                type="tel"
                inputMode="numeric"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="______"
                className="w-full rounded-xl px-4 py-3 text-center text-xl tracking-[0.5em] outline-none focus:ring-2 focus:ring-[#4A8C6F]"
                style={{ border: '1.5px solid #E8E0D8', color: '#1C2B3A' }}
                autoFocus
              />
              <button
                type="button"
                onClick={handleSendOtp}
                disabled={sendingOtp}
                className="text-xs font-semibold disabled:opacity-50"
                style={{ color: '#E07B2F' }}
              >
                {sendingOtp ? 'Resending…' : 'Resend code'}
              </button>
            </div>
          )}
        </div>
      )}

      {submitError && (
        <div
          className="rounded-xl p-3 text-sm text-[#E85D4A]"
          style={{ background: '#FFF5F4', border: '1px solid #E85D4A' }}
        >
          {submitError}
        </div>
      )}

      <button
        onClick={phoneAuthed ? handleSubmitAuthed : handleVerifyAndSubmit}
        disabled={submitting || (!phoneAuthed && !otpSent)}
        className="w-full rounded-xl py-4 text-white font-semibold text-base transition-opacity hover:opacity-90 disabled:opacity-60"
        style={{ background: '#4A8C6F' }}
      >
        {submitting
          ? 'Submitting...'
          : phoneAuthed
            ? 'Submit My Application'
            : otpSent
              ? 'Verify & Submit My Application'
              : 'Submit My Application'}
      </button>
    </div>
  )
}
