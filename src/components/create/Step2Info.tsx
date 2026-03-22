'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useCreateSiteStore } from '@/store/createSiteStore'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { ArrowLeft, ArrowRight } from 'lucide-react'

const schema = z.object({
  master_name: z.string().min(2, 'Минимум 2 символа').max(60, 'Максимум 60 символов'),
  studio_name: z.string().max(60, 'Максимум 60 символов').optional(),
  city: z.string().min(2, 'Укажите город').max(50, 'Максимум 50 символов'),
  address: z.string().max(100, 'Максимум 100 символов').optional(),
})

type FormData = z.infer<typeof schema>

export default function Step2Info() {
  const { formData, updateFormData, nextStep, prevStep } = useCreateSiteStore()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      master_name: formData.master_name ?? '',
      studio_name: formData.studio_name ?? '',
      city: formData.city ?? '',
      address: formData.address ?? '',
    },
  })

  const onSubmit = (data: FormData) => {
    updateFormData(data)
    nextStep()
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-1">Основная информация</h2>
      <p className="text-gray-500 text-sm mb-6">
        Как вас найдут клиенты
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Ваше имя или псевдоним"
          placeholder="Анна Иванова"
          error={errors.master_name?.message}
          required
          {...register('master_name')}
        />
        <Input
          label="Название студии"
          placeholder="Студия красоты «Лотос»"
          hint="Необязательно — если работаете как частный мастер"
          error={errors.studio_name?.message}
          {...register('studio_name')}
        />
        <Input
          label="Город"
          placeholder="Москва"
          error={errors.city?.message}
          required
          {...register('city')}
        />
        <Input
          label="Адрес"
          placeholder="ул. Пушкина, д. 10"
          hint="Необязательно — можно указать район или метро"
          error={errors.address?.message}
          {...register('address')}
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
