'use client'

import { useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useCreateSiteStore } from '@/store/createSiteStore'
import Step1Niche from '@/components/create/Step1Niche'
import Step2Info from '@/components/create/Step2Info'
import Step3Contacts from '@/components/create/Step3Contacts'
import Step4Services from '@/components/create/Step4Services'
import Step5Style from '@/components/create/Step5Style'
import Step6Photos from '@/components/create/Step6Photos'
import type { WebsiteFormData } from '@/types'

export default function CreatePage() {
  const step = useCreateSiteStore((s) => s.step)
  const { setWebsiteId, updateFormData, setStep, reset } = useCreateSiteStore()
  const searchParams = useSearchParams()
  const idFromUrl = searchParams.get('id')
  const loadedId = useRef<string | null>(null)

  useEffect(() => {
    // Если нет id в URL — сбрасываем форму для создания нового сайта
    if (!idFromUrl) {
      reset()
      return
    }

    // Уже загружали данные для этого id — не загружаем повторно
    if (loadedId.current === idFromUrl) return
    loadedId.current = idFromUrl

    const load = async () => {
      const supabase = createClient()
      const { data: site } = await supabase
        .from('websites')
        .select('id, meta_data')
        .eq('id', idFromUrl)
        .single()

      if (!site?.meta_data) return

      const meta = site.meta_data as WebsiteFormData

      // Заполняем стор данными из БД и переходим на шаг 1
      reset()
      updateFormData(meta)
      setWebsiteId(site.id)
      setStep(1)
    }

    load()
  }, [idFromUrl])

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
