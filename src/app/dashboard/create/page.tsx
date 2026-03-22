'use client'

import { useCreateSiteStore } from '@/store/createSiteStore'
import Step1Niche from '@/components/create/Step1Niche'
import Step2Info from '@/components/create/Step2Info'
import Step3Contacts from '@/components/create/Step3Contacts'
import Step4Services from '@/components/create/Step4Services'
import Step5Style from '@/components/create/Step5Style'
import Step6Photos from '@/components/create/Step6Photos'

export default function CreatePage() {
  const step = useCreateSiteStore((s) => s.step)

  return (
    <>
      {step === 1 && <Step1Niche />}
      {step === 2 && <Step2Info />}
      {step === 3 && <Step3Contacts />}
      {step === 4 && <Step4Services />}
      {step === 5 && <Step5Style />}
      {step === 6 && <Step6Photos />}
    </>
  )
}
