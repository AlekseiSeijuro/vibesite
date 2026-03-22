'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { Shield, Trash2, AlertTriangle } from 'lucide-react'
import { useRouter } from 'next/navigation'

const passwordSchema = z
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

type PasswordFormData = z.infer<typeof passwordSchema>

export default function SettingsPage() {
  const supabase = createClient()
  const router = useRouter()
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteInput, setDeleteInput] = useState('')

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PasswordFormData>({ resolver: zodResolver(passwordSchema) })

  const handlePasswordChange = async (data: PasswordFormData) => {
    setPasswordLoading(true)
    const { error } = await supabase.auth.updateUser({ password: data.password })
    if (error) {
      toast.error('Не удалось обновить пароль')
    } else {
      toast.success('Пароль успешно обновлён')
      reset()
    }
    setPasswordLoading(false)
  }

  const handleDeleteAccount = async () => {
    if (deleteInput !== 'УДАЛИТЬ') return
    setDeleteLoading(true)

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    const res = await fetch('/api/account/delete', { method: 'DELETE' })
    if (res.ok) {
      await supabase.auth.signOut()
      toast.success('Аккаунт удалён')
      router.push('/')
    } else {
      toast.error('Не удалось удалить аккаунт')
      setDeleteLoading(false)
    }
  }

  return (
    <div className="space-y-8 max-w-2xl animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Настройки</h1>
        <p className="text-gray-500 text-sm mt-1">Управление аккаунтом</p>
      </div>

      {/* Смена пароля */}
      <div className="card">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-9 h-9 rounded-xl bg-brand-50 flex items-center justify-center">
            <Shield className="h-5 w-5 text-brand-600" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">Безопасность</h2>
            <p className="text-xs text-gray-500">Смена пароля</p>
          </div>
        </div>

        <form onSubmit={handleSubmit(handlePasswordChange)} className="space-y-4">
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
          <Button type="submit" loading={passwordLoading} variant="secondary">
            Обновить пароль
          </Button>
        </form>
      </div>

      {/* Удаление аккаунта */}
      <div className="card border-red-100">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center">
            <Trash2 className="h-5 w-5 text-red-500" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">Удаление аккаунта</h2>
            <p className="text-xs text-gray-500">Это действие необратимо</p>
          </div>
        </div>

        {!showDeleteConfirm ? (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="text-sm text-red-500 hover:text-red-700 font-medium transition-colors"
          >
            Удалить аккаунт и все данные
          </button>
        ) : (
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-3 rounded-xl bg-red-50">
              <AlertTriangle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">
                Будут удалены все ваши сайты, фотографии и данные.
                Восстановление невозможно.
              </p>
            </div>
            <div>
              <label className="label">
                Введите <span className="font-mono font-bold">УДАЛИТЬ</span> для подтверждения
              </label>
              <input
                className="input"
                value={deleteInput}
                onChange={(e) => setDeleteInput(e.target.value)}
                placeholder="УДАЛИТЬ"
              />
            </div>
            <div className="flex gap-3">
              <Button
                variant="danger"
                loading={deleteLoading}
                disabled={deleteInput !== 'УДАЛИТЬ'}
                onClick={handleDeleteAccount}
              >
                Удалить навсегда
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  setShowDeleteConfirm(false)
                  setDeleteInput('')
                }}
              >
                Отмена
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
