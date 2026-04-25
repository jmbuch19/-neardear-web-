'use client'

import { useState } from 'react'
import Header from '@/components/hero/Header'
import Footer from '@/components/hero/Footer'

type Status = 'idle' | 'sending' | 'sent' | 'error'

function inputClass(hasError: boolean) {
  return [
    'w-full rounded-lg px-4 py-3 text-[#1C2B3A] text-sm outline-none transition-colors',
    'border',
    hasError ? 'border-[#E85D4A]' : 'border-[#E8E0D8]',
    'focus:border-[#1A6B7A]',
    'bg-white',
  ].join(' ')
}

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null
  return (
    <p className="text-sm mt-1" style={{ color: '#E85D4A' }}>
      {msg}
    </p>
  )
}

export default function ContactPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [message, setMessage] = useState('')
  const [honeypot, setHoneypot] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [status, setStatus] = useState<Status>('idle')
  const [serverError, setServerError] = useState<string>('')

  function validate() {
    const e: Record<string, string> = {}
    if (!name.trim()) e.name = 'Please enter your name'
    if (!email.trim()) e.email = 'Please enter your email'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) e.email = 'Please enter a valid email'
    if (phone.trim() && !/^[0-9+\-\s()]{6,20}$/.test(phone.trim()))
      e.phone = 'Please enter a valid phone number'
    if (!message.trim()) e.message = 'Please share a short message'
    else if (message.trim().length < 10) e.message = 'Please add a few more details'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault()
    setServerError('')
    if (!validate()) return
    setStatus('sending')
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone, message, honeypot }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setStatus('error')
        setServerError(data.error ?? 'Something went wrong. Please try again.')
        return
      }
      setStatus('sent')
      setName('')
      setEmail('')
      setPhone('')
      setMessage('')
    } catch {
      setStatus('error')
      setServerError('Network error. Please try again.')
    }
  }

  return (
    <>
      <Header />
      <main className="bg-[#FAF5EC] min-h-screen">
        {/* Hero */}
        <section className="bg-[#1C2B3A] text-white py-20 px-4">
          <div className="max-w-2xl mx-auto text-center">
            <p className="text-xs font-semibold tracking-widest uppercase text-[#F0B429] mb-4">
              GET IN TOUCH
            </p>
            <h1 className="font-[family-name:var(--font-playfair)] text-4xl sm:text-5xl leading-tight mb-4">
              We&rsquo;d love to hear from you.
            </h1>
            <p className="text-lg text-white/80">
              Questions, feedback, partnership — write to us and we&rsquo;ll respond within one business day.
            </p>
          </div>
        </section>

        {/* Form */}
        <section className="py-16 px-4">
          <div className="max-w-xl mx-auto">
            {status === 'sent' ? (
              <div
                className="rounded-2xl p-8 text-center"
                style={{ background: '#F0F7F4', border: '1.5px solid #4A8C6F' }}
              >
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#4A8C6F] mb-4">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M5 12l5 5 9-9"
                      stroke="#fff"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <h2 className="font-[family-name:var(--font-playfair)] text-2xl text-[#1C2B3A] mb-2">
                  Message sent.
                </h2>
                <p className="text-[#1C2B3A]/80">
                  Thank you for reaching out. Our team will get back to you soon.
                </p>
                <button
                  type="button"
                  onClick={() => setStatus('idle')}
                  className="mt-6 text-sm font-semibold text-[#1A6B7A] hover:underline"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm"
                style={{ border: '1px solid #E8E0D8' }}
                noValidate
              >
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-[#1A6B7A] mb-1.5">
                      Your name <span style={{ color: '#E85D4A' }}>*</span>
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Full name"
                      className={inputClass(!!errors.name)}
                      autoComplete="name"
                      maxLength={100}
                    />
                    <FieldError msg={errors.name} />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-[#1A6B7A] mb-1.5">
                      Email address <span style={{ color: '#E85D4A' }}>*</span>
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className={inputClass(!!errors.email)}
                      autoComplete="email"
                      maxLength={200}
                    />
                    <FieldError msg={errors.email} />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-[#1A6B7A] mb-1.5">
                      Phone <span className="text-[#6B7C85] font-normal">(optional)</span>
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className={inputClass(!!errors.phone)}
                      autoComplete="tel"
                      maxLength={20}
                    />
                    <FieldError msg={errors.phone} />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-[#1A6B7A] mb-1.5">
                      How can we help? <span style={{ color: '#E85D4A' }}>*</span>
                    </label>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Tell us a little about what you need…"
                      rows={6}
                      className={inputClass(!!errors.message)}
                      maxLength={2000}
                    />
                    <FieldError msg={errors.message} />
                  </div>

                  {/* Honeypot for bots */}
                  <input
                    type="text"
                    tabIndex={-1}
                    autoComplete="off"
                    value={honeypot}
                    onChange={(e) => setHoneypot(e.target.value)}
                    className="absolute left-[-9999px]"
                    aria-hidden="true"
                  />

                  {serverError && (
                    <div
                      className="rounded-lg px-4 py-3 text-sm"
                      style={{ background: '#FDECE9', color: '#9B2F1E', border: '1px solid #E85D4A' }}
                    >
                      {serverError}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={status === 'sending'}
                    className="w-full rounded-lg py-3 text-sm font-semibold text-white transition-colors disabled:opacity-60"
                    style={{ background: '#1A6B7A' }}
                  >
                    {status === 'sending' ? 'Sending…' : 'Send message'}
                  </button>

                  <p className="text-xs text-[#6B7C85] text-center">
                    Or email us directly at{' '}
                    <a
                      href="mailto:admin@neardear.in"
                      className="font-semibold text-[#1A6B7A] hover:underline"
                    >
                      admin@neardear.in
                    </a>
                  </p>
                </div>
              </form>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
