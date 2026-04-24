'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import LanguageToggle from '@/components/LanguageToggle'
import { useLanguage } from '@/lib/language'
import NearDearLogo from '@/components/NearDearLogo'

const copy = {
  EN: {
    brand: 'NearDear',
    tagline: 'Someone near. Someone dear.',
    heading: 'Welcome back',
    subtext: 'New here? No account needed — just enter your number to get started',
    phonePlaceholder: '10-digit mobile number',
    sendOtp: 'Send OTP',
    sending: 'Sending…',
    otpLabel: 'Enter 6-digit OTP',
    otpPlaceholder: '______',
    verify: 'Verify & Continue',
    verifying: 'Verifying…',
    resend: 'Resend OTP',
  },
  GU: {
    brand: 'નિયરડિયર',
    tagline: 'નજીક કોઈ. પ્રિય કોઈ.',
    heading: 'સ્વાગત છે',
    subtext: 'નવા છો? ખાતું જરૂરી નથી — ફક્ત તમારો નંબર નાખો',
    phonePlaceholder: '10 અંકનો મોબાઇલ નંબર',
    sendOtp: 'OTP મોકલો',
    sending: 'મોકલાઈ રહ્યું છે…',
    otpLabel: '6 અંકનો OTP દાખલ કરો',
    otpPlaceholder: '______',
    verify: 'ચકાસો અને આગળ વધો',
    verifying: 'ચકાસી રહ્યા છે…',
    resend: 'OTP ફરી મોકલો',
  },
  HI: {
    brand: 'NearDear',
    tagline: 'कोई पास। कोई प्रिय।',
    heading: 'वापस स्वागत है',
    subtext: 'नए हैं? कोई खाता जरूरी नहीं — बस अपना नंबर डालें',
    phonePlaceholder: '10 अंकों का मोबाइल नंबर',
    sendOtp: 'OTP भेजें',
    sending: 'भेज रहे हैं…',
    otpLabel: '6 अंकों का OTP दर्ज करें',
    otpPlaceholder: '______',
    verify: 'सत्यापित करें और आगे बढ़ें',
    verifying: 'सत्यापित हो रहा है…',
    resend: 'OTP दोबारा भेजें',
  },
}

export default function LoginPage() {
  const { lang } = useLanguage()
  const t = copy[lang]
  const router = useRouter()

  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [step, setStep] = useState<'phone' | 'otp'>('phone')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function normalizePhone(raw: string): string {
    return raw.replace(/^\+91/, '').replace(/\s/g, '')
  }

  async function handleSendOtp() {
    setError('')
    const normalized = normalizePhone(phone)
    if (!/^\d{10}$/.test(normalized)) {
      setError(lang === 'GU' ? 'કૃપા કરી માન્ય 10 અંકનો ફોન નંબર દાખલ કરો' : 'Please enter a valid 10-digit phone number')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: normalized }),
      })

      const data = (await res.json()) as { error?: string; success?: boolean }

      if (!res.ok) {
        setError(data.error ?? (lang === 'GU' ? 'કંઈક ખોટું થયું. ફરી પ્રયાસ કરો' : 'Something went wrong. Please try again'))
        return
      }

      setStep('otp')
    } catch {
      setError(lang === 'GU' ? 'કંઈક ખોટું થયું. ફરી પ્રયાસ કરો' : 'Something went wrong. Please try again')
    } finally {
      setLoading(false)
    }
  }

  async function handleVerify() {
    setError('')
    const normalized = normalizePhone(phone)

    if (otp.length !== 6 || !/^\d{6}$/.test(otp)) {
      setError(lang === 'GU' ? '6 અંકનો OTP દાખલ કરો' : 'Please enter a valid 6-digit OTP')
      return
    }

    setLoading(true)
    try {
      // Sign in via NextAuth — credentials provider handles OTP verification
      const result = await signIn('credentials', {
        phone: normalized,
        otp,
        redirect: false,
      })

      if (result?.error) {
        setError(lang === 'GU' ? 'અમાન્ય OTP. ફરી પ્રયાસ કરો' : 'Invalid or expired OTP. Please try again')
        return
      }

      // Fetch session to get role for redirect
      const sessionRes = await fetch('/api/auth/session')
      const session = await sessionRes.json() as { user?: { role?: string } }
      const role = session?.user?.role ?? 'RECEIVER'

      if (role === 'COMPANION') {
        router.push('/provider/dashboard')
      } else if (role === 'ADMIN') {
        router.push('/admin')
      } else {
        router.push('/dashboard')
      }
    } catch {
      setError(lang === 'GU' ? 'કંઈક ખોટું થયું. ફરી પ્રયાસ કરો' : 'Something went wrong. Please try again')
    } finally {
      setLoading(false)
    }
  }

  async function handleResend() {
    setOtp('')
    setStep('phone')
    await handleSendOtp()
  }

  return (
    <div className="w-full max-w-sm">
      {/* Language toggle */}
      <div className="flex justify-end mb-6">
        <LanguageToggle />
      </div>

      {/* Brand */}
      <div className="flex flex-col items-center mb-8">
        <NearDearLogo width={200} variant="full" />
      </div>

      {/* Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-orange-100 px-6 py-8">
        <h2
          className="text-2xl font-semibold mb-1"
          style={{ color: '#1C2B3A', fontFamily: 'Georgia, serif' }}
        >
          {t.heading}
        </h2>
        <p className="text-sm text-gray-500 mb-6">{t.subtext}</p>

        {/* Phone input */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1" style={{ color: '#1C2B3A' }}>
            {lang === 'GU' ? 'ફોન નંબર' : 'Phone number'}
          </label>
          <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-[#E07B2F] focus-within:border-transparent transition-all">
            <span
              className="px-3 py-3 text-sm font-medium bg-gray-50 border-r border-gray-200 select-none"
              style={{ color: '#1C2B3A' }}
            >
              +91
            </span>
            <input
              type="tel"
              inputMode="numeric"
              maxLength={10}
              value={phone}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '').slice(0, 10)
                setPhone(val)
              }}
              placeholder={t.phonePlaceholder}
              disabled={step === 'otp'}
              className="flex-1 px-3 py-3 text-sm outline-none bg-white disabled:bg-gray-50 disabled:text-gray-400"
              style={{ color: '#1C2B3A' }}
            />
          </div>
        </div>

        {/* Send OTP button */}
        {step === 'phone' && (
          <button
            onClick={handleSendOtp}
            disabled={loading || phone.length !== 10}
            className="w-full py-3 rounded-xl text-white font-semibold text-sm transition-opacity disabled:opacity-50"
            style={{ backgroundColor: '#E07B2F' }}
          >
            {loading ? t.sending : t.sendOtp}
          </button>
        )}

        {/* OTP input */}
        {step === 'otp' && (
          <div className="mt-2">
            <label className="block text-sm font-medium mb-1" style={{ color: '#1C2B3A' }}>
              {t.otpLabel}
            </label>
            <input
              type="tel"
              inputMode="numeric"
              maxLength={6}
              value={otp}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '').slice(0, 6)
                setOtp(val)
              }}
              placeholder={t.otpPlaceholder}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-center text-xl tracking-[0.5em] outline-none focus:ring-2 focus:ring-[#E07B2F] focus:border-transparent transition-all"
              style={{ color: '#1C2B3A' }}
              autoFocus
            />

            <button
              onClick={handleVerify}
              disabled={loading || otp.length !== 6}
              className="w-full mt-4 py-3 rounded-xl text-white font-semibold text-sm transition-opacity disabled:opacity-50"
              style={{ backgroundColor: '#E07B2F' }}
            >
              {loading ? t.verifying : t.verify}
            </button>

            <button
              onClick={handleResend}
              disabled={loading}
              className="w-full mt-3 py-2 rounded-xl text-sm font-medium transition-colors hover:bg-orange-50 disabled:opacity-50"
              style={{ color: '#E07B2F' }}
            >
              {t.resend}
            </button>
          </div>
        )}

        {/* Error message */}
        {error && (
          <p className="mt-4 text-sm text-red-600 text-center">{error}</p>
        )}
      </div>

      {/* Footer trust line */}
      <p className="mt-6 text-center text-xs text-gray-400">
        {lang === 'GU'
          ? 'બધા સાથીઓ કડક ચકાસણી કરાયેલ · 100% સુરક્ષિત'
          : 'All companions strictly verified · 100% secure'}
      </p>
    </div>
  )
}
