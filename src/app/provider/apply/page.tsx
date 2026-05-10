'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import LanguageToggle from '@/components/LanguageToggle'
import ExpressionOfInterest from './steps/ExpressionOfInterest'
import IdentityVerification from './steps/IdentityVerification'
import PoliceVerification from './steps/PoliceVerification'
import CharacterReferences from './steps/CharacterReferences'
import ServiceSelection from './steps/ServiceSelection'
import AvailabilityLocation from './steps/AvailabilityLocation'
import SkillsOccupation from './steps/SkillsOccupation'
import Declaration from './steps/Declaration'
import ApplicationSubmitted from './steps/ApplicationSubmitted'
import type { ApplicationStep, ApplicationData } from './types'
import { DEFAULT_APPLICATION } from './types'

const STEPS: ApplicationStep[] = [
  'INTEREST',
  'IDENTITY',
  'POLICE',
  'REFERENCES',
  'SERVICES',
  'AVAILABILITY',
  'SKILLS',
  'DECLARATION',
]

const LS_KEY = 'nd_companion_application'

export default function CompanionApplyPage() {
  const { data: session } = useSession()
  const [step, setStep] = useState<ApplicationStep>('INTEREST')
  const [data, setDataState] = useState<ApplicationData>(DEFAULT_APPLICATION)
  const [applicationId, setApplicationId] = useState<string>('')
  const [mounted, setMounted] = useState(false)

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LS_KEY)
      if (saved) {
        const parsed = JSON.parse(saved) as Partial<ApplicationData>
        setDataState((prev) => ({ ...prev, ...parsed }))
      }
    } catch {
      // ignore
    }
    setMounted(true)
  }, [])

  // Pre-fill phone from session
  useEffect(() => {
    if (session?.user?.phone && !data.phone) {
      setDataState((prev) => ({ ...prev, phone: session.user.phone ?? '' }))
    }
  }, [session, data.phone])

  // Save to localStorage whenever data changes
  useEffect(() => {
    if (!mounted) return
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(data))
    } catch {
      // ignore
    }
  }, [data, mounted])

  function setData(update: Partial<ApplicationData>) {
    setDataState((prev) => ({ ...prev, ...update }))
  }

  function onNext() {
    const current = STEPS.indexOf(step as Exclude<ApplicationStep, 'SUBMITTED'>)
    if (current >= 0 && current < STEPS.length - 1) {
      setStep(STEPS[current + 1])
    }
  }

  function onBack() {
    const current = STEPS.indexOf(step as Exclude<ApplicationStep, 'SUBMITTED'>)
    if (current > 0) {
      setStep(STEPS[current - 1])
    }
  }

  function onSubmitted(id: string) {
    setApplicationId(id)
    localStorage.removeItem(LS_KEY)
    setStep('SUBMITTED')
  }

  const isSubmitted = step === 'SUBMITTED'
  const isFirstStep = step === 'INTEREST'

  const stepIndex = STEPS.indexOf(step as Exclude<ApplicationStep, 'SUBMITTED'>)
  const progressPct = isSubmitted ? 100 : ((stepIndex + 1) / STEPS.length) * 100

  const stepNumber = isSubmitted ? STEPS.length : stepIndex + 1

  if (!mounted) return null

  return (
    <div className="min-h-screen" style={{ background: '#FEF8F0' }}>
      {/* Header */}
      <header
        className="sticky top-0 z-10 flex items-center justify-between px-5 py-3"
        style={{ background: '#FEF8F0', borderBottom: '1px solid #E8E0D8' }}
      >
        <div>
          <span
            className="font-[family-name:var(--font-playfair)] font-bold text-[#E07B2F]"
            style={{ fontSize: 22 }}
          >
            NearDear
          </span>
          {!isSubmitted && (
            <p className="text-xs text-[#1A6B7A] font-semibold tracking-wide">
              Companion Application
            </p>
          )}
        </div>
        <LanguageToggle />
      </header>

      {/* Progress bar */}
      <div className="w-full" style={{ height: 4, background: '#E8E0D8' }}>
        <div
          className="h-full transition-all duration-300"
          style={{ width: `${progressPct}%`, background: '#4A8C6F' }}
        />
      </div>

      {/* Step indicator + Back button */}
      {!isSubmitted && (
        <div className="flex items-center gap-3 px-5 pt-4 pb-1">
          {!isFirstStep && (
            <button
              onClick={onBack}
              className="text-[#4A8C6F] text-sm font-semibold flex items-center gap-1"
              aria-label="Go back"
            >
              <span>&#8592;</span> Back
            </button>
          )}
          <p className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-widest ml-auto">
            Step {stepNumber} of {STEPS.length}
          </p>
        </div>
      )}

      {/* Content */}
      <main className="px-5 pb-10 pt-2 max-w-lg mx-auto">
        {step === 'INTEREST' && (
          <ExpressionOfInterest
            data={data}
            setData={setData}
            onNext={onNext}
            session={session}
          />
        )}
        {step === 'IDENTITY' && (
          <IdentityVerification
            data={data}
            setData={setData}
            onNext={onNext}
            onBack={onBack}
          />
        )}
        {step === 'POLICE' && (
          <PoliceVerification
            data={data}
            setData={setData}
            onNext={onNext}
            onBack={onBack}
          />
        )}
        {step === 'REFERENCES' && (
          <CharacterReferences
            data={data}
            setData={setData}
            onNext={onNext}
            onBack={onBack}
          />
        )}
        {step === 'SERVICES' && (
          <ServiceSelection
            data={data}
            setData={setData}
            onNext={onNext}
            onBack={onBack}
          />
        )}
        {step === 'AVAILABILITY' && (
          <AvailabilityLocation
            data={data}
            setData={setData}
            onNext={onNext}
            onBack={onBack}
          />
        )}
        {step === 'SKILLS' && (
          <SkillsOccupation
            data={data}
            setData={setData}
            onNext={onNext}
            onBack={onBack}
          />
        )}
        {step === 'DECLARATION' && (
          <Declaration
            data={data}
            setData={setData}
            onSubmitted={onSubmitted}
            onBack={onBack}
            session={session}
          />
        )}
        {step === 'SUBMITTED' && (
          <ApplicationSubmitted
            legalName={data.legalName}
            applicationId={applicationId}
          />
        )}
      </main>
    </div>
  )
}
