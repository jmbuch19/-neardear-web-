'use client'

import { useState } from 'react'
import LanguageToggle from '@/components/LanguageToggle'
import NearDearLogo from '@/components/NearDearLogo'
import WhoNeedsHelp from './steps/WhoNeedsHelp'
import ElderProfile from './steps/ElderProfile'
import WhatNeeded from './steps/WhatNeeded'
import WhenNeeded from './steps/WhenNeeded'
import ReviewSubmit from './steps/ReviewSubmit'
import type { Step, FlowData } from './types'
import { DEFAULT_FLOW_DATA } from './types'

// Steps in order — ELDER_PROFILE is conditional
const ALL_STEPS: Step[] = ['WHO', 'ELDER_PROFILE', 'WHAT_NEEDED', 'WHEN', 'REVIEW']
const SELF_STEPS: Step[] = ['WHO', 'WHAT_NEEDED', 'WHEN', 'REVIEW']

function getStepList(flowData: FlowData): Step[] {
  if (flowData.whoNeedsHelp === 'MYSELF') return SELF_STEPS
  return ALL_STEPS
}

function getStepNumber(step: Step, flowData: FlowData): number {
  return getStepList(flowData).indexOf(step) + 1
}

function getTotalSteps(flowData: FlowData): number {
  return getStepList(flowData).length
}

export default function NewRequestPage() {
  const [step, setStep] = useState<Step>('WHO')
  const [flowData, setFlowDataState] = useState<FlowData>(DEFAULT_FLOW_DATA)

  function setFlowData(update: Partial<FlowData>) {
    setFlowDataState((prev) => ({ ...prev, ...update }))
  }

  function onNext() {
    const steps = getStepList(flowData)
    const current = steps.indexOf(step)
    if (current < steps.length - 1) {
      setStep(steps[current + 1])
    }
  }

  function onBack() {
    const steps = getStepList(flowData)
    const current = steps.indexOf(step)
    if (current > 0) {
      setStep(steps[current - 1])
    }
  }

  function goToStep(target: 'WHO' | 'ELDER_PROFILE' | 'WHAT_NEEDED' | 'WHEN') {
    setStep(target)
  }

  // When WHO step advances — check if we need to skip elder profile
  function handleWhoNext() {
    if (flowData.whoNeedsHelp === 'MYSELF') {
      setStep('WHAT_NEEDED')
    } else {
      setStep('ELDER_PROFILE')
    }
  }

  const currentStepNum = getStepNumber(step, flowData)
  const totalSteps = getTotalSteps(flowData)
  const progressPct = (currentStepNum / totalSteps) * 100

  return (
    <div
      className="min-h-screen"
      style={{ background: '#FEF8F0' }}
    >
      {/* Header */}
      <header
        className="sticky top-0 z-10 flex items-center justify-between px-5 py-3"
        style={{ background: '#FEF8F0', borderBottom: '1px solid #E8E0D8' }}
      >
        <NearDearLogo width={120} variant="compact" />
        <LanguageToggle />
      </header>

      {/* Progress bar */}
      <div className="w-full" style={{ height: 4, background: '#E8E0D8' }}>
        <div
          className="h-full transition-all duration-300"
          style={{ width: `${progressPct}%`, background: '#E07B2F' }}
        />
      </div>

      {/* Step indicator */}
      <div className="px-5 pt-4 pb-1">
        <p className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-widest">
          Step {currentStepNum} of {totalSteps}
        </p>
      </div>

      {/* Content */}
      <main className="px-5 pb-10 pt-2 max-w-lg mx-auto">
        {step === 'WHO' && (
          <WhoNeedsHelp
            flowData={flowData}
            setFlowData={setFlowData}
            onNext={handleWhoNext}
          />
        )}

        {step === 'ELDER_PROFILE' && (
          <ElderProfile
            flowData={flowData}
            setFlowData={setFlowData}
            onNext={onNext}
            onBack={onBack}
            isForSelf={flowData.whoNeedsHelp === 'MYSELF'}
          />
        )}

        {step === 'WHAT_NEEDED' && (
          <WhatNeeded
            flowData={flowData}
            setFlowData={setFlowData}
            onNext={onNext}
            onBack={() => {
              if (flowData.whoNeedsHelp === 'MYSELF') {
                setStep('WHO')
              } else {
                setStep('ELDER_PROFILE')
              }
            }}
          />
        )}

        {step === 'WHEN' && (
          <WhenNeeded
            flowData={flowData}
            setFlowData={setFlowData}
            onNext={onNext}
            onBack={onBack}
          />
        )}

        {step === 'REVIEW' && (
          <ReviewSubmit
            flowData={flowData}
            onBack={onBack}
            goToStep={goToStep}
          />
        )}
      </main>
    </div>
  )
}
