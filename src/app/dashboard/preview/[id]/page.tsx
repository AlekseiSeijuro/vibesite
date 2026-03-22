import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import PreviewClient from './PreviewClient'

interface Props {
  params: { id: string }
}

export default async function PreviewPage({ params }: Props) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: site } = await supabase
    .from('websites')
    .select('*')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single()

  if (!site) notFound()

  const { data: profile } = await supabase
    .from('users')
    .select('subscription_status, role')
    .eq('id', user.id)
    .single()

  // Проверяем есть ли выполненный заказ на исходники
  const { data: completedOrder } = await supabase
    .from('orders')
    .select('id')
    .eq('website_id', params.id)
    .eq('user_id', user.id)
    .eq('status', 'completed')
    .single()

  const isAdmin = profile?.role === 'admin'

  return (
    <PreviewClient
      site={site}
      isPaid={profile?.subscription_status === 'active'}
      hasCompletedOrder={!!completedOrder || isAdmin}
    />
  )
}
