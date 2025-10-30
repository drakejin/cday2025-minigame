import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { handleCors } from '../_shared/cors.ts'
import { successResponse, errorResponse } from '../_shared/response.ts'
import { verifyAdmin } from '../_shared/adminAuth.ts'
import { keysToCamelCase } from '../_shared/camelCase.ts'

serve(async (req) => {
  // Handle CORS
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  try {
    // 1. Admin 권한 확인
    const { error, status, admin, supabase } = await verifyAdmin(req, 'stats')
    if (error || !admin || !supabase) {
      return errorResponse(error!, status)
    }

    // 2. 통계 데이터 수집
    const [
      { count: totalUsers },
      { count: totalCharacters },
      { count: activeCharacters },
      { count: totalPrompts },
      { count: totalRounds },
      { data: currentRound },
    ] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('characters').select('*', { count: 'exact', head: true }),
      supabase.from('characters').select('*', { count: 'exact', head: true }).eq('is_active', true),
      supabase
        .from('prompt_history')
        .select('*', { count: 'exact', head: true })
        .eq('is_deleted', false),
      supabase.from('game_rounds').select('*', { count: 'exact', head: true }),
      supabase.from('game_rounds').select('*').eq('is_active', true).maybeSingle(),
    ])

    // 3. 현재 라운드 참가자 수
    let currentRoundStats = null
    if (currentRound) {
      const { count: participants } = await supabase
        .from('prompt_history')
        .select('*', { count: 'exact', head: true })
        .eq('round_number', currentRound.round_number)

      currentRoundStats = {
        round_number: currentRound.round_number,
        status: currentRound.status,
        participants: participants || 0,
        submissionRate:
          activeCharacters && activeCharacters > 0
            ? Math.round(((participants || 0) / activeCharacters) * 100) / 100
            : 0,
      }
    }

    // 4. 최근 활동 (1시간, 24시간)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

    const [{ count: last1Hour }, { count: last24Hours }] = await Promise.all([
      supabase
        .from('prompt_history')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', oneHourAgo),
      supabase
        .from('prompt_history')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', oneDayAgo),
    ])

    return successResponse({
      totalUsers: totalUsers || 0,
      totalCharacters: totalCharacters || 0,
      totalPrompts: totalPrompts || 0,
      totalRounds: totalRounds || 0,
      activeRound: currentRound
        ? keysToCamelCase({
            id: currentRound.id,
            round_number: currentRound.round_number,
            start_time: currentRound.start_time,
            end_time: currentRound.end_time,
            status: currentRound.status,
            is_active: currentRound.is_active,
            participants: currentRoundStats?.participants || 0,
            submission_rate: currentRoundStats?.submissionRate || 0,
          })
        : null,
      recentActivity: {
        last1Hour: last1Hour || 0,
        last24Hours: last24Hours || 0,
      },
    })
  } catch (error) {
    return errorResponse('INTERNAL_ERROR', 500, (error as Error).message)
  }
})
