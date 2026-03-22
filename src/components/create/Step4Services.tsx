'use client'

import { useState } from 'react'
import { useCreateSiteStore } from '@/store/createSiteStore'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { ArrowLeft, ArrowRight, Plus, Trash2, GripVertical } from 'lucide-react'
import type { ServiceItem } from '@/types'

function generateId() {
  return Math.random().toString(36).slice(2, 9)
}

export default function Step4Services() {
  const { formData, updateFormData, nextStep, prevStep } = useCreateSiteStore()

  const [services, setServices] = useState<ServiceItem[]>(
    formData.services?.length
      ? formData.services
      : [{ id: generateId(), name: '', price: '', description: '' }]
  )
  const [errors, setErrors] = useState<Record<string, string>>({})

  const addService = () => {
    if (services.length >= 20) return
    setServices([...services, { id: generateId(), name: '', price: '', description: '' }])
  }

  const removeService = (id: string) => {
    if (services.length === 1) return
    setServices(services.filter((s) => s.id !== id))
  }

  const updateService = (id: string, field: keyof ServiceItem, value: string) => {
    setServices(services.map((s) => (s.id === id ? { ...s, [field]: value } : s)))
    // Сбрасываем ошибку при вводе
    setErrors((prev) => {
      const next = { ...prev }
      delete next[`${id}_${field}`]
      return next
    })
  }

  const validate = () => {
    const newErrors: Record<string, string> = {}
    services.forEach((s) => {
      if (!s.name.trim()) newErrors[`${s.id}_name`] = 'Укажите название'
      if (!s.price.trim()) newErrors[`${s.id}_price`] = 'Укажите цену'
    })
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const onNext = () => {
    if (!validate()) return
    updateFormData({ services })
    nextStep()
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-1">Услуги и цены</h2>
      <p className="text-gray-500 text-sm mb-6">
        Добавьте услуги которые вы предоставляете — они появятся на сайте
      </p>

      <div className="space-y-3 mb-4">
        {services.map((service, index) => (
          <div
            key={service.id}
            className="p-4 rounded-xl border border-gray-200 bg-gray-50 space-y-3"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                Услуга {index + 1}
              </span>
              {services.length > 1 && (
                <button
                  onClick={() => removeService(service.id)}
                  className="text-gray-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 sm:col-span-1">
                <Input
                  label="Название"
                  placeholder="Маникюр классический"
                  value={service.name}
                  onChange={(e) => updateService(service.id, 'name', e.target.value)}
                  error={errors[`${service.id}_name`]}
                />
              </div>
              <div className="col-span-2 sm:col-span-1">
                <Input
                  label="Цена"
                  placeholder="1 500 ₽"
                  value={service.price}
                  onChange={(e) => updateService(service.id, 'price', e.target.value)}
                  error={errors[`${service.id}_price`]}
                />
              </div>
            </div>

            <Input
              label="Описание"
              placeholder="Короткое описание (необязательно)"
              value={service.description ?? ''}
              onChange={(e) => updateService(service.id, 'description', e.target.value)}
            />
          </div>
        ))}
      </div>

      {services.length < 20 && (
        <button
          onClick={addService}
          className="w-full py-3 rounded-xl border-2 border-dashed border-gray-200 text-sm text-gray-400 hover:border-brand-300 hover:text-brand-500 transition-colors flex items-center justify-center gap-2 mb-6"
        >
          <Plus className="h-4 w-4" />
          Добавить услугу
        </button>
      )}

      <div className="flex gap-3">
        <Button type="button" variant="secondary" onClick={prevStep}>
          <ArrowLeft className="h-4 w-4" />
          Назад
        </Button>
        <Button onClick={onNext} className="flex-1">
          Далее
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
