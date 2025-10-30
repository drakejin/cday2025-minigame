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

    const { round_number } = await req.json()

    if (!round_number) {
      return errorResponse('INVALID_REQUEST', 400, 'round_number가 필요합니다')
    }

    // 1. 라운드 정보
    const { data: round } = await supabase
      .from('game_rounds')
      .select('*')
      .eq('round_number', round_number)
      .single()

    if (!round) {
      return errorResponse('ROUND_NOT_FOUND', 404, '라운드를 찾을 수 없습니다')
    }

    // 2. 프롬프트 통계
    const { data: prompts, count: promptCount } = await supabase
      .from('prompt_history')
      .select('*, characters!inner(name)', { count: 'exact' })
      .eq('round_number', round_number)

    // 3. 참여자 수
    const { count: uniqueUsers } = await supabase
      .from('prompt_history')
      .select('user_id', { count: 'exact', head: true })
      .eq('round_number', round_number)

    // 4. 평균 점수
    const avgScores = prompts?.reduce(
      (acc, p) => ({
        strength: acc.strength + p.strength_gained,
        charm: acc.charm + p.charm_gained,
        creativity: acc.creativity + p.creativity_gained,
        total: acc.total + p.total_score_gained,
      }),
      { strength: 0, charm: 0, creativity: 0, total: 0 }
    )

    const count = promptCount || 1
    const averages = {
      strength: avgScores ? avgScores.strength / count : 0,
      charm: avgScores ? avgScores.charm / count : 0,
      creativity: avgScores ? avgScores.creativity / count : 0,
      total: avgScores ? avgScores.total / count : 0,
    }

    // 5. Top 프롬프트
    const topPrompts = prompts
      ?.sort((a, b) => b.total_score_gained - a.total_score_gained)
      .slice(0, 10)

    return successResponse({
      round,
      stats: {
        total_prompts: promptCount || 0,
        unique_users: uniqueUsers || 0,
        average_scores: averages,
      },
      top_prompts: topPrompts || [],
    })
  } catch (error) {
    return errorResponse('INTERNAL_ERROR', 500, (error as Error).message)
  }
})
