// @ts-nocheck
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { verifyUser } from '../_shared/auth.ts'
import { createSupabaseClient } from '../_shared/db.ts'
import { errorResponse, successResponse } from '../_shared/response.ts'
import { withLogging } from '../_shared/withLogging.ts'

serve(
  withLogging('get-my-trials', async (req, logger) => {
    try {
      const { error, status, user } = await verifyUser(req)
      logger.setUser(user?.id, user?.email)
      if (error || !user) return errorResponse(error || 'UNAUTHORIZED', status || 401)

      const supabase = createSupabaseClient()

      // Find user's active character
      const { data: character } = await supabase
        .from('characters')
        .select('id')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle()
      if (!character) return errorResponse('CHARACTER_NOT_FOUND', 404, '활성 캐릭터가 없습니다')

      // Join trial_results with trials and game_rounds
      const { data, error: qErr } = await supabase
        .from('trial_results')
        .select(
          `
          id,
          trial_id,
          total_score,
          weighted_total,
          created_at,
          trials:trial_id (
            trial_no,
            level,
            round_id,
            game_rounds:round_id (
              round_number
            )
          )
        `
        )
        .eq('character_id', character.id)
        .order('created_at', { ascending: false })

      if (qErr) return errorResponse('LIST_FAILED', 500, qErr.message)

      interface TrialResult {
        id: string
        trial_id: string
        total_score: number
        weighted_total: number
        created_at: string
        trials?: {
          trial_no: number
          level: number
          game_rounds?: {
            round_number: number
          }
        }
      }

      const items =
        data?.map((r: TrialResult) => ({
          id: r.id,
          trial_id: r.trial_id,
          round_number: r.trials?.game_rounds?.round_number || null,
          trial_no: r.trials?.trial_no,
          level: r.trials?.level,
          total_score: r.total_score,
          weighted_total: r.weighted_total,
          created_at: r.created_at,
        })) || []

      return successResponse({ trials: items })
    } catch (e) {
      return errorResponse('INTERNAL_ERROR', 500, (e as Error).message)
    }
  })
)
