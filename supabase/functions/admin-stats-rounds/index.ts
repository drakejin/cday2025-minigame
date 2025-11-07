import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { verifyAdmin } from '../_shared/adminAuth.ts'
import { errorResponse, successResponse } from '../_shared/response.ts'
import { withLogging } from '../_shared/withLogging.ts'
import { keysToCamelCase } from '../_shared/camelCase.ts'

serve(
  withLogging('admin-stats-rounds', async (req, logger) => {
    try {
      const { error, status, admin, supabase } = await verifyAdmin(req)
      logger.setUser(admin?.id, admin?.email)

      if (error || !admin || !supabase) {
        logger.logError(status, error!)
        return errorResponse(error!, status)
      }

      const { round_number } = await req.json()
      logger.setRequestBody({ round_number })

      if (!round_number) {
        logger.logError(400, 'round_number가 필요합니다')
        return errorResponse('INVALID_REQUEST', 400, 'round_number가 필요합니다')
      }

      // 1. 시련 정보
      const { data: round } = await supabase
        .from('game_rounds')
        .select('*')
        .eq('round_number', round_number)
        .single()

      if (!round) {
        logger.logError(404, '시련를 찾을 수 없습니다')
        return errorResponse('ROUND_NOT_FOUND', 404, '시련를 찾을 수 없습니다')
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

      const responseData = keysToCamelCase({
        round,
        stats: {
          total_prompts: promptCount || 0,
          unique_users: uniqueUsers || 0,
          average_scores: averages,
        },
        top_prompts: topPrompts || [],
      })
      logger.logSuccess(200, responseData)
      return successResponse(responseData)
    } catch (error) {
      logger.logError(500, (error as Error).message)
      return errorResponse('INTERNAL_ERROR', 500, (error as Error).message)
    }
  })
)
