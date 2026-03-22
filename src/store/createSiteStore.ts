import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { WebsiteFormData, BeautyNiche, SiteStyle, ServiceItem, ContactInfo } from '@/types'

interface CreateSiteStore {
  // Текущий шаг (1–6)
  step: number
  // ID сайта если уже создан в БД (для редактирования)
  websiteId: string | null
  // Данные формы
  formData: Partial<WebsiteFormData>

  // Действия
  setStep: (step: number) => void
  nextStep: () => void
  prevStep: () => void
  setWebsiteId: (id: string) => void
  updateFormData: (data: Partial<WebsiteFormData>) => void
  reset: () => void
}

const initialFormData: Partial<WebsiteFormData> = {
  services: [],
  contacts: {},
  style: 'friendly',
  photo_urls: [],
}

export const useCreateSiteStore = create<CreateSiteStore>()(
  persist(
    (set) => ({
      step: 1,
      websiteId: null,
      formData: initialFormData,

      setStep: (step) => set({ step }),
      nextStep: () => set((s) => ({ step: Math.min(s.step + 1, 6) })),
      prevStep: () => set((s) => ({ step: Math.max(s.step - 1, 1) })),
      setWebsiteId: (id) => set({ websiteId: id }),
      updateFormData: (data) =>
        set((s) => ({ formData: { ...s.formData, ...data } })),
      reset: () => set({ step: 1, websiteId: null, formData: initialFormData }),
    }),
    {
      name: 'vibesite-create-form', // ключ в localStorage
    }
  )
)
