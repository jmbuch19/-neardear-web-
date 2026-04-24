'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Script from 'next/script'
import Link from 'next/link'
import NearDearLogo from '@/components/NearDearLogo'

interface OrderData {
  orderId: string
  amount: number
  currency: string
  keyId: string
  companionName: string
  serviceName: string
  sessionId: string
  fee: number
  companionEarnings: number
}

// RazorpayOptions, RazorpayInstance, and Window.Razorpay declared in src/types/razorpay.d.ts

export default function PaymentPage() {
  const { id: sessionId } = useParams<{ id: string }>()
  const router = useRouter()

  const [order, setOrder] = useState<OrderData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [scriptReady, setScriptReady] = useState(false)

  async function createOrder() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      })
      const data = await res.json() as OrderData & { error?: string }
      if (!res.ok) {
        setError(data.error ?? 'Failed to create payment order')
        return
      }
      setOrder(data)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    createOrder()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId])

  async function handlePayment() {
    if (!order || !scriptReady) return

    const options: RazorpayOptions = {
      key: order.keyId,
      amount: order.amount,
      currency: order.currency,
      name: 'NearDear',
      description: order.serviceName,
      order_id: order.orderId,
      theme: { color: '#E07B2F' },
      handler: async function (response) {
        try {
          const res = await fetch('/api/payments/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              razorpayOrderId: order.orderId,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              sessionId: order.sessionId,
            }),
          })
          const result = await res.json() as { success?: boolean; error?: string }
          if (result.success) {
            router.push(`/session/${sessionId}/confirmed`)
          } else {
            setError(result.error ?? 'Payment verification failed. Please contact support.')
          }
        } catch {
          setError('Verification failed. Please contact support@neardear.in.')
        }
      },
      modal: {
        ondismiss: function () {
          // User closed — let them try again
        },
      },
    }

    const rzp = new window.Razorpay(options)
    rzp.open()
  }

  const companionFirstName = order?.companionName.split(' ')[0] ?? ''

  return (
    <>
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="lazyOnload"
        onReady={() => setScriptReady(true)}
      />

      <div style={{ minHeight: '100vh', background: '#FEF8F0', padding: '40px 24px' }}>
        <div style={{ maxWidth: 480, margin: '0 auto' }}>

          {/* Header */}
          <div style={{ marginBottom: 32 }}>
            <Link href="/" aria-label="NearDear home" style={{ textDecoration: 'none', display: 'inline-block' }}>
              <NearDearLogo width={140} variant="compact" />
            </Link>
          </div>

          <h1
            style={{
              fontFamily: 'Playfair Display, Georgia, serif',
              fontWeight: 700,
              fontSize: 26,
              color: '#1C2B3A',
              marginBottom: 8,
            }}
          >
            Complete your payment
          </h1>
          <p style={{ color: '#6B7280', fontSize: 15, marginBottom: 32 }}>
            Your session will be confirmed immediately after payment.
          </p>

          {error && (
            <div
              style={{
                background: '#FEF2F2',
                border: '1px solid #FECACA',
                borderRadius: 12,
                padding: 16,
                marginBottom: 20,
                color: '#DC2626',
                fontSize: 14,
              }}
            >
              {error}
            </div>
          )}

          {loading && (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#9CA3AF' }}>
              Preparing your payment…
            </div>
          )}

          {order && !loading && (
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
              <p
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  textTransform: 'uppercase' as const,
                  letterSpacing: '0.08em',
                  color: '#1A6B7A',
                  marginBottom: 16,
                }}
              >
                Payment Summary
              </p>

              <div style={{ marginBottom: 12 }}>
                <p style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 2 }}>Service</p>
                <p style={{ fontSize: 14, color: '#1C2B3A', fontWeight: 500 }}>{order.serviceName}</p>
              </div>

              <div style={{ marginBottom: 12 }}>
                <p style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 2 }}>Companion</p>
                <p style={{ fontSize: 14, color: '#1C2B3A', fontWeight: 500 }}>{order.companionName}</p>
              </div>

              <div
                style={{
                  borderTop: '1px solid #F3F4F6',
                  paddingTop: 16,
                  marginTop: 16,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <p style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 2 }}>Total amount</p>
                  <p style={{ fontSize: 22, fontWeight: 700, color: '#1C2B3A' }}>₹{order.fee}</p>
                </div>
                <p style={{ fontSize: 13, color: '#4A8C6F' }}>
                  {companionFirstName} receives ₹{order.companionEarnings}
                </p>
              </div>

              <button
                onClick={handlePayment}
                disabled={!scriptReady}
                style={{
                  display: 'block',
                  width: '100%',
                  background: scriptReady ? '#E07B2F' : '#D1D5DB',
                  color: '#FFFFFF',
                  borderRadius: 12,
                  padding: '14px 0',
                  fontWeight: 600,
                  fontSize: 15,
                  textAlign: 'center' as const,
                  border: 'none',
                  cursor: scriptReady ? 'pointer' : 'not-allowed',
                  marginTop: 20,
                  boxSizing: 'border-box' as const,
                  transition: 'opacity 0.2s',
                }}
              >
                Complete Payment →
              </button>

              <p
                style={{
                  textAlign: 'center' as const,
                  fontSize: 12,
                  color: '#9CA3AF',
                  marginTop: 10,
                }}
              >
                🔒 Secure payment via Razorpay
              </p>
            </div>
          )}

          <Link
            href={`/session/${sessionId}`}
            style={{ display: 'block', textAlign: 'center', color: '#9CA3AF', fontSize: 13, textDecoration: 'none' }}
          >
            ← Back to session details
          </Link>

        </div>
      </div>
    </>
  )
}
