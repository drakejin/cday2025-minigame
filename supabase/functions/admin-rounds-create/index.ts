import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { handleCors } from '../_shared/cors.ts'
import { errorResponse, successResponse } from '../_shared/response.ts'
import { verifyAdmin } from '../_shared/adminAuth.ts'

serve(async (req) => {
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  try {
    // 1. Admin 권한 확인
    const { error, status, admin, supabase } = await verifyAdmin(req, 'rounds')
    if (error || !admin || !supabase) {
      return errorResponse(error!, status)
    }

    // 2. Request Body 파싱
    const { start_time, end_time, notes } = await req.json()

    if (!start_time || !end_time) {
      return errorResponse('INVALID_REQUEST', 400, 'start_time과 end_time이 필요합니다')
    }

    // 3. 시간 검증
    const startDate = new Date(start_time)
    const endDate = new Date(end_time)

    if (startDate >= endDate) {
      return errorResponse('INVALID_TIME_RANGE', 400, 'start_time은 end_time보다 이전이어야 합니다')
    }

    // 4. 다음 라운드 번호 계산
    const { data: lastRound } = await supabase
      .from('game_rounds')
      .select('round_number')
      .order('round_number', { ascending: false })
      .limit(1)
      .maybeSingle()

    const nextRoundNumber = lastRound ? lastRound.round_number + 1 : 1

    // 5. 라운드 생성
    const { data: round, error: createError } = await supabase
      .from('game_rounds')
      .insert({
        round_number: nextRoundNumber,
        start_time: start_time,
        end_time: end_time,
        is_active: false,
        status: 'scheduled',
        notes: notes || null,
      })
      .select()
      .single()

    if (createError || !round) {
      return errorResponse('ROUND_CREATE_FAILED', 500, createError?.message || '라운드 생성 실패')
    }

    // 6. Audit log 기록
    await supabase.from('admin_audit_log').insert({
      admin_id: admin.id,
      action: 'CREATE_ROUND',
      resource_type: 'game_rounds',
      resource_id: round.id,
      changes: { round_number: nextRoundNumber, start_time, end_time },
      ip_address: req.headers.get('x-forwarded-for') || 'unknown',
      user_agent: req.headers.get('user-agent'),
    })

    return successResponse({ round })
  } catch (error) {
    return errorResponse('INTERNAL_ERROR', 500, (error as Error).message)
  }
})
