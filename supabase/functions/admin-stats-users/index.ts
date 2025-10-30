import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { handleCors } from '../_shared/cors.ts'
import { errorResponse, successResponse } from '../_shared/response.ts'
import { verifyAdmin } from '../_shared/adminAuth.ts'
import { keysToCamelCase } from '../_shared/camelCase.ts'

serve(async (req) => {
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  try {
    const { error, status, admin, supabase } = await verifyAdmin(req, 'stats')
    if (error || !admin || !supabase) {
      return errorResponse(error!, status)
    }

    // 1. 총 사용자 수
    const { count: totalUsers } = await supabase
      .from('characters')
      .select('*', { count: 'exact', head: true })

    // 2. 활성 사용자 (최근 7일)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    const { data: activeUsers } = await supabase
      .from('prompt_history')
      .select('user_id')
      .gte('created_at', sevenDaysAgo)

    const uniqueActiveUsers = new Set(activeUsers?.map((u) => u.user_id) || []).size

    // 3. 총 프롬프트 수
    const { count: totalPrompts } = await supabase
      .from('prompt_history')
      .select('*', { count: 'exact', head: true })

    // 4. 평균 프롬프트/유저
    const avgPromptsPerUser = totalUsers ? (totalPrompts || 0) / totalUsers : 0

    // 5. Top 10 사용자
    const { data: topUsers } = await supabase
      .from('characters')
      .select('*')
      .order('total_score', { ascending: false })
      .limit(10)

    // 6. 신규 가입 (최근 7일)
    const { count: newUsers } = await supabase
      .from('characters')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', sevenDaysAgo)

    return successResponse({
      total_users: totalUsers || 0,
      active_users_7d: uniqueActiveUsers,
      new_users_7d: newUsers || 0,
      total_prompts: totalPrompts || 0,
      avg_prompts_per_user: avgPromptsPerUser.toFixed(2),
      top_users: topUsers || [],
    })
  } catch (error) {
    return errorResponse('INTERNAL_ERROR', 500, (error as Error).message)
  }
})
