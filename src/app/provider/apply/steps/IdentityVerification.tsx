'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import type { ApplicationData } from '../types'

interface Props {
  data: ApplicationData
  setData: (update: Partial<ApplicationData>) => void
  onNext: () => void
  onBack: () => void
}

const YEARS_OPTIONS = [
  { value: 'less_6m', label: 'Less than 6 months' },
  { value: '6_12m', label: '6–12 months' },
  { value: '1_3y', label: '1–3 years' },
  { value: '3_5y', label: '3–5 years' },
  { value: '5y_plus', label: '5+ years' },
]

// Verhoeff checksum — standard Aadhaar validation
const VERHOEFF_D = [
  [0,1,2,3,4,5,6,7,8,9],
  [1,2,3,4,0,6,7,8,9,5],
  [2,3,4,0,1,7,8,9,5,6],
  [3,4,0,1,2,8,9,5,6,7],
  [4,0,1,2,3,9,5,6,7,8],
  [5,9,8,7,6,0,4,3,2,1],
  [6,5,9,8,7,1,0,4,3,2],
  [7,6,5,9,8,2,1,0,4,3],
  [8,7,6,5,9,3,2,1,0,4],
  [9,8,7,6,5,4,3,2,1,0],
]
const VERHOEFF_P = [
  [0,1,2,3,4,5,6,7,8,9],
  [1,5,7,6,2,8,3,0,9,4],
  [5,8,0,3,7,9,6,1,4,2],
  [8,9,1,6,0,4,3,5,2,7],
  [9,4,5,3,1,2,6,8,7,0],
  [4,2,8,6,5,7,3,9,0,1],
  [2,7,9,3,8,0,6,4,1,5],
  [7,0,4,6,9,1,3,2,5,8],
]

function validateAadhaar(number: string): boolean {
  if (!/^\d{12}$/.test(number)) return false
  let c = 0
  const reversed = number.split('').reverse()
  for (let i = 0; i < reversed.length; i++) {
    c = VERHOEFF_D[c][VERHOEFF_P[i % 8][parseInt(reversed[i], 10)]]
  }
  return c === 0
}

export default function IdentityVerification({ data, setData, onNext }: Props) {
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({})
  const [aadhaarMasked, setAadhaarMasked] = useState(true)
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null)
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(data.selfieUrl || null)
  const [cameraError, setCameraError] = useState(false)
  const [uploading, setUploading] = useState<Record<string, boolean>>({})
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const addressProofInputRef = useRef<HTMLInputElement>(null)

  const stopCamera = useCallback(() => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((t) => t.stop())
      setCameraStream(null)
    }
  }, [cameraStream])

  useEffect(() => {
    return () => {
      stopCamera()
    }
  }, [stopCamera])

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } })
      setCameraStream(stream)
      setCameraError(false)
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
    } catch {
      setCameraError(true)
    }
  }

  async function takePhoto() {
    if (!videoRef.current || !canvasRef.current) return
    const video = videoRef.current
    const canvas = canvasRef.current
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.drawImage(video, 0, 0)

    canvas.toBlob(async (blob) => {
      if (!blob) return
      stopCamera()
      setUploading((prev) => ({ ...prev, selfie: true }))
      try {
        const res = await fetch('/api/upload/signed-url?type=selfie')
        const { uploadUrl, publicUrl } = await res.json() as { uploadUrl: string; publicUrl: string }
        await fetch(uploadUrl, {
          method: 'PUT',
          body: blob,
          headers: { 'Content-Type': 'image/jpeg' },
        })
        setCapturedPhoto(publicUrl)
        setData({ selfieUrl: publicUrl })
      } catch {
        // fallback — use data URL
        const dataUrl = canvas.toDataURL('image/jpeg')
        setCapturedPhoto(dataUrl)
        setData({ selfieUrl: dataUrl })
      } finally {
        setUploading((prev) => ({ ...prev, selfie: false }))
      }
    }, 'image/jpeg', 0.9)
  }

  async function uploadAddressProof(file: File) {
    if (file.size > 5 * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, addressProofUrl: 'File must be under 5MB' }))
      return
    }
    setUploading((prev) => ({ ...prev, addressProof: true }))
    try {
      const res = await fetch('/api/upload/signed-url?type=address_proof')
      const { uploadUrl, publicUrl } = await res.json() as { uploadUrl: string; publicUrl: string }
      await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type },
      })
      setData({ addressProofUrl: publicUrl })
      setErrors((prev) => ({ ...prev, addressProofUrl: undefined }))
    } catch {
      setErrors((prev) => ({ ...prev, addressProofUrl: 'Upload failed. Please try again.' }))
    } finally {
      setUploading((prev) => ({ ...prev, addressProof: false }))
    }
  }

  function validate(): boolean {
    const e: Partial<Record<string, string>> = {}
    if (!data.legalName.trim())
      e.legalName = 'Please enter your full name as it appears on your Aadhaar card'
    if (!data.aadhaarNumber || !/^\d{12}$/.test(data.aadhaarNumber))
      e.aadhaarNumber = 'Aadhaar number must be exactly 12 digits'
    else if (!validateAadhaar(data.aadhaarNumber))
      e.aadhaarNumber =
        'This does not appear to be a valid Aadhaar number. Please check and try again.'
    if (!capturedPhoto && !data.selfieUrl)
      e.selfieUrl = 'Please take a live selfie'
    if (!data.addressLine1.trim())
      e.addressLine1 = 'Address Line 1 is required'
    if (!data.state.trim())
      e.state = 'State is required'
    if (!data.pincode.trim() || !/^\d{6}$/.test(data.pincode))
      e.pincode = 'PIN code must be 6 digits'
    if (!data.yearsAtAddress)
      e.yearsAtAddress = 'Please select how long you have lived here'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleNext() {
    if (validate()) onNext()
  }

  const aadhaarDisplay = aadhaarMasked && data.aadhaarNumber.length === 12
    ? `XXXXXXXX${data.aadhaarNumber.slice(-4)}`
    : data.aadhaarNumber

  return (
    <div className="space-y-6 pt-2">
      <div>
        <h2 className="font-[family-name:var(--font-playfair)] text-xl font-semibold text-[#1A6B7A] mb-1">
          Your Identity
        </h2>
        <p className="text-sm text-[#6B7280]">
          This information is used only for verification. We store only the last 4 digits of your Aadhaar.
        </p>
      </div>

      {/* Name + Aadhaar */}
      <div className="bg-white rounded-2xl p-5 space-y-4" style={{ border: '1px solid #E8E0D8' }}>
        <div>
          <label className="block text-sm font-semibold text-[#1C2B3A] mb-1">
            Legal full name (as on Aadhaar) <span className="text-[#E85D4A]">*</span>
          </label>
          <input
            type="text"
            value={data.legalName}
            onChange={(e) => setData({ legalName: e.target.value })}
            placeholder="Full name"
            className="w-full rounded-xl px-4 py-3 text-[#1C2B3A] text-sm outline-none focus:ring-2 focus:ring-[#4A8C6F]"
            style={{ border: errors.legalName ? '1.5px solid #E85D4A' : '1.5px solid #E8E0D8' }}
          />
          <p className="text-xs text-[#9CA3AF] mt-1">
            Enter your name exactly as it appears on your Aadhaar card.
          </p>
          {errors.legalName && (
            <p className="text-xs text-[#E85D4A] mt-1">{errors.legalName}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-semibold text-[#1C2B3A] mb-1">
            Aadhaar number <span className="text-[#E85D4A]">*</span>
          </label>
          <div className="flex gap-2">
            <input
              type={aadhaarMasked && data.aadhaarNumber.length === 12 ? 'text' : 'tel'}
              value={aadhaarDisplay}
              onChange={(e) => {
                setAadhaarMasked(false)
                setData({ aadhaarNumber: e.target.value.replace(/\D/g, '').slice(0, 12) })
              }}
              onFocus={() => setAadhaarMasked(false)}
              onBlur={() => setAadhaarMasked(true)}
              placeholder="12-digit Aadhaar number"
              maxLength={12}
              className="flex-1 rounded-xl px-4 py-3 text-[#1C2B3A] text-sm outline-none focus:ring-2 focus:ring-[#4A8C6F] font-[family-name:var(--font-dm-mono)]"
              style={{ border: errors.aadhaarNumber ? '1.5px solid #E85D4A' : '1.5px solid #E8E0D8' }}
            />
          </div>
          <p className="text-xs text-[#9CA3AF] mt-1">
            We verify through the government system. Only last 4 digits stored by us.
          </p>
          {errors.aadhaarNumber && (
            <p className="text-xs text-[#E85D4A] mt-1">{errors.aadhaarNumber}</p>
          )}
        </div>
      </div>

      {/* Live Selfie */}
      <div className="bg-white rounded-2xl p-5 space-y-4" style={{ border: '1px solid #E8E0D8' }}>
        <div>
          <label className="block text-sm font-semibold text-[#1C2B3A] mb-2">
            Live selfie <span className="text-[#E85D4A]">*</span>
          </label>

          {capturedPhoto ? (
            <div className="space-y-3">
              <div className="flex justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={capturedPhoto}
                  alt="Your selfie"
                  className="rounded-full object-cover"
                  style={{ width: 120, height: 120, border: '3px solid #4A8C6F' }}
                />
              </div>
              <button
                type="button"
                onClick={() => { setCapturedPhoto(null); setData({ selfieUrl: '' }) }}
                className="w-full rounded-xl py-2 text-sm font-semibold text-[#4A8C6F] transition-opacity"
                style={{ border: '1.5px solid #4A8C6F' }}
              >
                Retake
              </button>
            </div>
          ) : cameraStream ? (
            <div className="space-y-3">
              <div className="flex justify-center">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="rounded-xl object-cover"
                  style={{ width: '100%', maxWidth: 320, height: 240, background: '#000' }}
                />
              </div>
              <canvas ref={canvasRef} className="hidden" />
              <button
                type="button"
                onClick={takePhoto}
                disabled={uploading.selfie}
                className="w-full rounded-xl py-3 text-white font-semibold text-sm transition-opacity hover:opacity-90 disabled:opacity-50"
                style={{ background: '#4A8C6F' }}
              >
                {uploading.selfie ? 'Uploading...' : 'Take Photo Now'}
              </button>
            </div>
          ) : cameraError ? (
            <div className="space-y-3">
              {process.env.NODE_ENV === 'development' ? (
                <>
                  <div
                    className="rounded-xl p-3 text-sm"
                    style={{ background: '#FFF8E7', border: '1px solid #F0B429', color: '#92600A' }}
                  >
                    📷 Camera blocked in development. Using file upload instead. Camera will work normally in production.
                  </div>
                  <label className="block text-sm font-medium text-[#1C2B3A]">
                    Upload a clear photo of your face
                    <span className="block text-xs font-normal text-[#6B7280] mt-0.5">
                      (camera not available in this browser — upload a photo instead)
                    </span>
                  </label>
                  <input
                    type="file"
                    accept="image/jpeg,image/png"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (!file) return
                      const url = URL.createObjectURL(file)
                      setCapturedPhoto(url)
                      setData({ selfieUrl: url })
                    }}
                    className="w-full text-sm text-[#6B7280]"
                  />
                </>
              ) : (
                <div
                  className="rounded-xl p-3 text-sm text-[#E85D4A]"
                  style={{ background: '#FFF5F4', border: '1px solid #E85D4A' }}
                >
                  Camera access is required. Please allow camera access in your browser settings and try again.
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <div
                className="rounded-xl p-4 text-center"
                style={{ border: '2px dashed #E8E0D8', background: '#F9F5F0' }}
              >
                <p className="text-sm text-[#6B7280] mb-3">We need a live photo — not from your gallery.</p>
                <button
                  type="button"
                  onClick={startCamera}
                  className="rounded-xl px-6 py-3 text-white font-semibold text-sm transition-opacity hover:opacity-90"
                  style={{ background: '#4A8C6F' }}
                >
                  Open Camera
                </button>
              </div>
            </div>
          )}
          {errors.selfieUrl && <p className="text-xs text-[#E85D4A] mt-1">{errors.selfieUrl}</p>}
        </div>
      </div>

      {/* Address */}
      <div className="bg-white rounded-2xl p-5 space-y-4" style={{ border: '1px solid #E8E0D8' }}>
        <h3 className="text-sm font-semibold text-[#1A6B7A]">Your address</h3>

        <div>
          <label className="block text-sm font-semibold text-[#1C2B3A] mb-1">
            Address Line 1 <span className="text-[#E85D4A]">*</span>
          </label>
          <input
            type="text"
            value={data.addressLine1}
            onChange={(e) => setData({ addressLine1: e.target.value })}
            placeholder="House / Flat / Building, Street"
            className="w-full rounded-xl px-4 py-3 text-[#1C2B3A] text-sm outline-none focus:ring-2 focus:ring-[#4A8C6F]"
            style={{ border: errors.addressLine1 ? '1.5px solid #E85D4A' : '1.5px solid #E8E0D8' }}
          />
          {errors.addressLine1 && <p className="text-xs text-[#E85D4A] mt-1">{errors.addressLine1}</p>}
        </div>

        <div>
          <label className="block text-sm font-semibold text-[#1C2B3A] mb-1">
            Address Line 2 <span className="text-[#9CA3AF] font-normal">(optional)</span>
          </label>
          <input
            type="text"
            value={data.addressLine2}
            onChange={(e) => setData({ addressLine2: e.target.value })}
            placeholder="Area, Locality"
            className="w-full rounded-xl px-4 py-3 text-[#1C2B3A] text-sm outline-none focus:ring-2 focus:ring-[#4A8C6F]"
            style={{ border: '1.5px solid #E8E0D8' }}
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-[#1C2B3A] mb-1">City</label>
          <input
            type="text"
            value={data.city}
            readOnly
            className="w-full rounded-xl px-4 py-3 text-[#6B7280] text-sm bg-[#F9F5F0]"
            style={{ border: '1.5px solid #E8E0D8' }}
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-[#1C2B3A] mb-1">
            State <span className="text-[#E85D4A]">*</span>
          </label>
          <input
            type="text"
            value={data.state}
            onChange={(e) => setData({ state: e.target.value })}
            placeholder="e.g. Gujarat"
            className="w-full rounded-xl px-4 py-3 text-[#1C2B3A] text-sm outline-none focus:ring-2 focus:ring-[#4A8C6F]"
            style={{ border: errors.state ? '1.5px solid #E85D4A' : '1.5px solid #E8E0D8' }}
          />
          {errors.state && <p className="text-xs text-[#E85D4A] mt-1">{errors.state}</p>}
        </div>

        <div>
          <label className="block text-sm font-semibold text-[#1C2B3A] mb-1">
            PIN code <span className="text-[#E85D4A]">*</span>
          </label>
          <input
            type="tel"
            value={data.pincode}
            onChange={(e) => setData({ pincode: e.target.value.replace(/\D/g, '').slice(0, 6) })}
            placeholder="6-digit PIN code"
            maxLength={6}
            className="w-full rounded-xl px-4 py-3 text-[#1C2B3A] text-sm outline-none focus:ring-2 focus:ring-[#4A8C6F] font-[family-name:var(--font-dm-mono)]"
            style={{ border: errors.pincode ? '1.5px solid #E85D4A' : '1.5px solid #E8E0D8' }}
          />
          {errors.pincode && <p className="text-xs text-[#E85D4A] mt-1">{errors.pincode}</p>}
        </div>
      </div>

      {/* Address proof */}
      <div className="bg-white rounded-2xl p-5 space-y-4" style={{ border: '1px solid #E8E0D8' }}>
        <div>
          <label className="block text-sm font-semibold text-[#1C2B3A] mb-1">
            Upload address proof <span className="text-[#9CA3AF] font-normal">(optional)</span>
          </label>
          <p className="text-xs text-[#9CA3AF] mb-2">Any one: utility bill, bank statement, rental agreement</p>
          <input
            ref={addressProofInputRef}
            type="file"
            accept=".jpg,.jpeg,.png,.pdf"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) uploadAddressProof(file)
            }}
          />
          <button
            type="button"
            onClick={() => addressProofInputRef.current?.click()}
            disabled={uploading.addressProof}
            className="w-full rounded-xl py-3 text-sm font-semibold text-[#4A8C6F] transition-opacity disabled:opacity-50"
            style={{ border: '1.5px solid #4A8C6F' }}
          >
            {uploading.addressProof ? 'Uploading...' : data.addressProofUrl ? 'Replace Document' : 'Choose File'}
          </button>
          {data.addressProofUrl && (
            <p className="text-xs text-[#4A8C6F] mt-1">Document uploaded successfully</p>
          )}
          {errors.addressProofUrl && <p className="text-xs text-[#E85D4A] mt-1">{errors.addressProofUrl}</p>}
        </div>
      </div>

      {/* Alternate phone + Years at address */}
      <div className="bg-white rounded-2xl p-5 space-y-4" style={{ border: '1px solid #E8E0D8' }}>
        <div>
          <label className="block text-sm font-semibold text-[#1C2B3A] mb-1">
            Alternate phone <span className="text-[#9CA3AF] font-normal">(optional)</span>
          </label>
          <div className="flex items-center rounded-xl overflow-hidden" style={{ border: '1.5px solid #E8E0D8' }}>
            <span className="px-3 py-3 text-sm text-[#6B7280] bg-[#F9F5F0] border-r border-[#E8E0D8] font-[family-name:var(--font-dm-mono)]">+91</span>
            <input
              type="tel"
              value={data.alternatePhone}
              onChange={(e) => setData({ alternatePhone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
              placeholder="10-digit number"
              maxLength={10}
              className="flex-1 px-4 py-3 text-[#1C2B3A] text-sm outline-none font-[family-name:var(--font-dm-mono)] bg-white"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-[#1C2B3A] mb-1">
            How long have you lived at this address? <span className="text-[#E85D4A]">*</span>
          </label>
          <select
            value={data.yearsAtAddress}
            onChange={(e) => setData({ yearsAtAddress: e.target.value })}
            className="w-full rounded-xl px-4 py-3 text-[#1C2B3A] text-sm outline-none focus:ring-2 focus:ring-[#4A8C6F] bg-white"
            style={{ border: errors.yearsAtAddress ? '1.5px solid #E85D4A' : '1.5px solid #E8E0D8' }}
          >
            <option value="">Select duration</option>
            {YEARS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          {errors.yearsAtAddress && <p className="text-xs text-[#E85D4A] mt-1">{errors.yearsAtAddress}</p>}
        </div>
      </div>

      <button
        onClick={handleNext}
        className="w-full rounded-xl py-4 text-white font-semibold text-base transition-opacity hover:opacity-90"
        style={{ background: '#4A8C6F' }}
      >
        Continue
      </button>
    </div>
  )
}
