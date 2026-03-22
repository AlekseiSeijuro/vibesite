'use client'

import Link from 'next/link'
import { Check, LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatPrice } from '@/lib/utils'

interface PricingCardProps {
  icon: LucideIcon
  slug: string
  name: string
  price: number | null
  priceLabel: string
  period: string | null
  priceYearly?: number | null
  features: string[]
  isCurrent: boolean
  isHighlighted: boolean
  ctaLabel: string
  ctaHref: string
}

export default function PricingCard({
  icon: Icon,
  name,
  price,
  priceLabel,
  period,
  priceYearly,
  features,
  isCurrent,
  isHighlighted,
  ctaLabel,
  ctaHref,
}: PricingCardProps) {
  return (
    <div
      className={cn(
        'relative rounded-2xl p-6 flex flex-col',
        isHighlighted
          ? 'bg-brand-600 text-white shadow-xl shadow-brand-200 scale-105'
          : 'bg-white border border-gray-200'
      )}
    >
      {isHighlighted && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="bg-yellow-400 text-yellow-900 text-xs font-bold px-3 py-1 rounded-full">
            Популярный
          </span>
        </div>
      )}

      {/* Иконка и название */}
      <div className="flex items-center gap-3 mb-4">
        <div
          className={cn(
            'w-10 h-10 rounded-xl flex items-center justify-center',
            isHighlighted ? 'bg-white/20' : 'bg-brand-50'
          )}
        >
          <Icon
            className={cn(
              'h-5 w-5',
              isHighlighted ? 'text-white' : 'text-brand-600'
            )}
          />
        </div>
        <h3
          className={cn(
            'text-lg font-bold',
            isHighlighted ? 'text-white' : 'text-gray-900'
          )}
        >
          {name}
        </h3>
      </div>

      {/* Цена */}
      <div className="mb-6">
        <div className="flex items-end gap-1">
          <span
            className={cn(
              'text-3xl font-bold',
              isHighlighted ? 'text-white' : 'text-gray-900'
            )}
          >
            {priceLabel}
          </span>
          {period && (
            <span
              className={cn(
                'text-sm mb-1',
                isHighlighted ? 'text-white/70' : 'text-gray-400'
              )}
            >
              /{period}
            </span>
          )}
        </div>
        {priceYearly && (
          <p
            className={cn(
              'text-xs mt-1',
              isHighlighted ? 'text-white/70' : 'text-gray-400'
            )}
          >
            или {formatPrice(priceYearly)}/год — экономия {formatPrice((price! * 12) - priceYearly)}
          </p>
        )}
      </div>

      {/* Фичи */}
      <ul className="space-y-3 mb-8 flex-1">
        {features.map((feature) => (
          <li key={feature} className="flex items-start gap-2.5">
            <Check
              className={cn(
                'h-4 w-4 mt-0.5 shrink-0',
                isHighlighted ? 'text-white' : 'text-brand-500'
              )}
            />
            <span
              className={cn(
                'text-sm',
                isHighlighted ? 'text-white/90' : 'text-gray-600'
              )}
            >
              {feature}
            </span>
          </li>
        ))}
      </ul>

      {/* CTA */}
      <Link
        href={ctaHref}
        className={cn(
          'w-full text-center py-2.5 px-4 rounded-xl text-sm font-medium transition-all',
          isCurrent
            ? 'bg-gray-100 text-gray-400 cursor-default pointer-events-none'
            : isHighlighted
            ? 'bg-white text-brand-600 hover:bg-brand-50'
            : 'bg-brand-600 text-white hover:bg-brand-700'
        )}
      >
        {isCurrent ? '✓ Текущий тариф' : ctaLabel}
      </Link>
    </div>
  )
}
