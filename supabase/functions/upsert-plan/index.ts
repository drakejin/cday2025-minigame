// @ts-nocheck
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { withLogging } from '../_shared/withLogging.ts'
import { errorResponse, successResponse } from '../_shared/response.ts'
import { verifyUser } from '../_shared/auth.ts'
import { createSupabaseClient } from '../_shared/db.ts'

serve(
  withLogging('upsert-plan', async (req, logger) => {
    try {
      const { error, status, user } = await verifyUser(req)
      logger.setUser(user?.id, user?.email)
      if (error || !user) return errorResponse(error || 'UNAUTHORIZED', status || 401)

      const payload = await req.json()
      logger.setRequestBody(payload)

      const requiredFields = [
        'lv1_str',
        'lv1_dex',
        'lv1_con',
        'lv1_int',
        'lv1_skill',
        'lv2_str',
        'lv2_dex',
        'lv2_con',
        'lv2_int',
        'lv2_skill',
        'lv3_str',
        'lv3_dex',
        'lv3_con',
        'lv3_int',
        'lv3_skill',
      ]
      for (const f of requiredFields) {
        if (payload[f] === undefined || payload[f] === null) {
          return errorResponse('INVALID_REQUEST', 400, `필수 필드 누락: ${f}`)
        }
      }

      const lv1 = [payload.lv1_str, payload.lv1_dex, payload.lv1_con, payload.lv1_int]
      const lv2 = [payload.lv2_str, payload.lv2_dex, payload.lv2_con, payload.lv2_int]
      const lv3 = [payload.lv3_str, payload.lv3_dex, payload.lv3_con, payload.lv3_int]

      // Validate max <= 20
      const allStats = [...lv1, ...lv2, ...lv3]
      if (allStats.some((s) => s > 20 || s < 1)) {
        return errorResponse('INVALID_STATS_RANGE', 400, '스탯은 1~20 범위여야 합니다')
      }

      // Validate +1 split rule: lv2 - lv1 has exactly two +1, others 0
      const d12 = lv2.map((v, i) => v - lv1[i])
      if (!(d12.filter((d) => d === 1).length === 2 && d12.every((d) => d === 0 || d === 1))) {
        return errorResponse(
          'INVALID_LV2_ALLOCATION',
          400,
          'Lv2는 서로 다른 2개 능력치에 +1씩 분배해야 합니다'
        )
      }
      // Validate +1 split rule: lv3 - lv2 has exactly two +1, others 0
      const d23 = lv3.map((v, i) => v - lv2[i])
      if (!(d23.filter((d) => d === 1).length === 2 && d23.every((d) => d === 0 || d === 1))) {
        return errorResponse(
          'INVALID_LV3_ALLOCATION',
          400,
          'Lv3는 서로 다른 2개 능력치에 +1씩 분배해야 합니다'
        )
      }

      const supabase = createSupabaseClient()

      // Ensure active character belongs to user
      const { data: character } = await supabase
        .from('characters')
        .select('id')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle()
      if (!character) return errorResponse('CHARACTER_NOT_FOUND', 404, '활성 캐릭터가 없습니다')

      const upsertBody = {
        character_id: character.id,
        lv1_str: payload.lv1_str,
        lv1_dex: payload.lv1_dex,
        lv1_con: payload.lv1_con,
        lv1_int: payload.lv1_int,
        lv1_skill: String(payload.lv1_skill || ''),
        lv2_str: payload.lv2_str,
        lv2_dex: payload.lv2_dex,
        lv2_con: payload.lv2_con,
        lv2_int: payload.lv2_int,
        lv2_skill: String(payload.lv2_skill || ''),
        lv3_str: payload.lv3_str,
        lv3_dex: payload.lv3_dex,
        lv3_con: payload.lv3_con,
        lv3_int: payload.lv3_int,
        lv3_skill: String(payload.lv3_skill || ''),
      }

      const { data: plan, error: upErr } = await supabase
        .from('character_plans')
        .upsert(upsertBody, { onConflict: 'character_id' })
        .select('*')
        .single()

      if (upErr || !plan) {
        return errorResponse('PLAN_SAVE_FAILED', 500, upErr?.message || '플랜 저장 실패')
      }

      return successResponse({ plan })
    } catch (e) {
      return errorResponse('INTERNAL_ERROR', 500, (e as Error).message)
    }
  })
)
