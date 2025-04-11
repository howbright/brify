// app/auth/callback/page.tsx
'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

export default function AuthCallbackPage() {
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const handleLogin = async () => {
      const { error } = await supabase.auth.getSession()
      if (error) {
        console.error('로그인 실패:', error.message)
      } else {
        router.push('/') // 로그인 후 이동할 페이지
      }
    }

    handleLogin()
  }, [router, supabase])

  return <p className="text-center mt-10">로그인 중입니다... 잠시만 기다려주세요.</p>
}
