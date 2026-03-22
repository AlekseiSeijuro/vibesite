import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

type AuthResult =
  | { user: { id: string; email: string }; error: null }
  | { user: null; error: NextResponse }

type AdminResult =
  | { user: { id: string }; error: null }
  | { user: null; error: NextResponse }

/**
 * Проверяет авторизацию. Возвращает user или готовый 401 Response.
 */
export async function requireAuth(): Promise<AuthResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return {
      user: null,
      error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    }
  }

  return { user: { id: user.id, email: user.email! }, error: null }
}

/**
 * Проверяет что пользователь — администратор.
 * Возвращает user или готовый 401/403 Response.
 */
export async function requireAdmin(): Promise<AdminResult> {
  const authResult = await requireAuth()
  if (authResult.error) return authResult

  const supabase = await createClient()
  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', authResult.user.id)
    .single()

  if (profile?.role !== 'admin') {
    return {
      user: null,
      error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }),
    }
  }

  return { user: authResult.user, error: null }
}
