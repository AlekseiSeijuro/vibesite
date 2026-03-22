import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import PreviewClient from './PreviewClient'

interface Props {
  params: { id: string }
}

export default async function PreviewPage({ params }: Props) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

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
    .select('subscription_status')
    .eq('id', user.id)
    .single()

  return (
    <PreviewClient
      site={site}
      isPaid={profile?.subscription_status === 'active'}
    />
  )
}
