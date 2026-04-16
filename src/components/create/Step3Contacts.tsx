'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useCreateSiteStore } from '@/store/createSiteStore'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { track } from '@/lib/analytics'

const schema = z
  .object({
    whatsapp:  z.string().max(20).optional(),
    telegram:  z.string().max(50).optional(),
    phone:     z.string().max(20).optional(),
    email:     z.union([z.string().email('Некорректный email'), z.literal('')]).optional(),
    instagram: z.string().max(50).optional(),
  })
  .refine(
    (d) => d.whatsapp || d.telegram || d.phone || d.email || d.instagram,
    {
      message: 'Укажите хотя бы один способ связи',
      path: ['whatsapp'],
    }
  )

type FormData = z.infer<typeof schema>

export default function Step3Contacts() {
  const { formData, updateFormData, nextStep, prevStep } = useCreateSiteStore()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      whatsapp:  formData.contacts?.whatsapp  ?? '',
      telegram:  formData.contacts?.telegram  ?? '',
      phone:     formData.contacts?.phone     ?? '',
      email:     formData.contacts?.email     ?? '',
      instagram: formData.contacts?.instagram ?? '',
    },
  })

  const onSubmit = (data: FormData) => {
    // Убираем пустые значения
    const contacts = Object.fromEntries(
      Object.entries(data).filter(([, v]) => v && v.trim() !== '')
    )
    updateFormData({ contacts })
    track('wizard_step_completed', { step: 3 })
    nextStep()
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-1">Контактные данные</h2>
      <p className="text-gray-500 text-sm mb-6">
        Укажите хотя бы один способ связи — клиенты смогут записаться
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="WhatsApp"
          placeholder="+7 999 123-45-67"
          hint="Номер телефона с кодом страны"
          error={errors.whatsapp?.message}
          {...register('whatsapp')}
        />
        <Input
          label="Telegram"
          placeholder="@username"
          hint="Без @ тоже подойдёт"
          error={errors.telegram?.message}
          {...register('telegram')}
        />
        <Input
          label="Телефон"
          placeholder="+7 999 123-45-67"
          error={errors.phone?.message}
          {...register('phone')}
        />
        <Input
          label="Email"
          type="email"
          placeholder="you@example.com"
          error={errors.email?.message}
          {...register('email')}
        />
        <Input
          label="Instagram"
          placeholder="@your_account"
          error={errors.instagram?.message}
          {...register('instagram')}
        />

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={prevStep}>
            <ArrowLeft className="h-4 w-4" />
            Назад
          </Button>
          <Button type="submit" className="flex-1">
            Далее
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </div>
  )
}
