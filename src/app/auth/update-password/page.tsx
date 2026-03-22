'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { Sparkles } from 'lucide-react'
import Link from 'next/link'

const schema = z
  .object({
    password: z
      .string()
      .min(8, 'Минимум 8 символов')
      .regex(/[A-Za-z]/, 'Должен содержать буквы')
      .regex(/[0-9]/, 'Должен содержать цифры'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Пароли не совпадают',
    path: ['confirmPassword'],
  })

type FormData = z.infer<typeof schema>

export default function UpdatePasswordPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    const { error } = await supabase.auth.updateUser({
      password: data.password,
    })

    if (error) {
      toast.error('Не удалось обновить пароль')
      setLoading(false)
      return
    }

    toast.success('Пароль успешно обновлён')
    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
      <Link href="/" className="flex items-center gap-2 mb-8">
        <Sparkles className="h-5 w-5 text-brand-600" />
        <span className="font-bold text-gray-900">Vibesite</span>
      </Link>

      <div className="card shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Новый пароль</h1>
        <p className="text-gray-500 text-sm mb-6">Придумайте надёжный пароль</p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Новый пароль"
            type="password"
            placeholder="Минимум 8 символов"
            hint="Буквы + цифры"
            error={errors.password?.message}
            {...register('password')}
          />
          <Input
            label="Повторите пароль"
            type="password"
            placeholder="••••••••"
            error={errors.confirmPassword?.message}
            {...register('confirmPassword')}
          />
          <Button type="submit" loading={loading} className="w-full">
            Сохранить пароль
          </Button>
        </form>
      </div>
    </div>
  )
}
