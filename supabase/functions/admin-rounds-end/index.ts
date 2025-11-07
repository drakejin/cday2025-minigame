import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { errorResponse, successResponse } from '../_shared/response.ts'
import { verifyAdmin } from '../_shared/adminAuth.ts'
import { withLogging } from '../_shared/withLogging.ts'

serve(
  withLogging('admin-rounds-end', async (req, logger) => {
    try {
      const { error, status, admin, supabase } = await verifyAdmin(req)
      logger.setUser(admin?.id, admin?.email)

      if (error || !admin || !supabase) {
        logger.logError(status, error!)
        return errorResponse(error!, status)
      }

      const { notes } = await req.json()
      logger.setRequestBody({ notes })

      const { data: currentRound } = await supabase
        .from('game_rounds')
        .select('*')
        .eq('is_active', true)
        .maybeSingle()

      if (!currentRound) {
        logger.logError(400, '활성화된 시련가 없습니다')
        return errorResponse('NO_ACTIVE_ROUND', 400, '활성화된 시련가 없습니다')
      }

      const { data: round, error: updateError } = await supabase
        .from('game_rounds')
        .update({
          is_active: false,
          status: 'completed',
          actual_end_time: new Date().toISOString(),
          ended_by: admin.id,
          notes: notes || null,
        })
        .eq('id', currentRound.id)
        .select()
        .single()

      if (updateError || !round) {
        logger.logError(400, '시련 종료에 실패했습니다')
        return errorResponse('ROUND_END_FAILED', 400, '시련 종료에 실패했습니다')
      }

      const { data: characters } = await supabase
        .from('characters')
        .select('*')
        .eq('is_active', true)
        .order('total_score', { ascending: false })

      if (characters && characters.length > 0) {
        const snapshots = characters.map((char, index) => ({
          round_number: currentRound.round_number,
          character_id: char.id,
          user_id: char.user_id,
          rank: index + 1,
          total_score: char.total_score,
          strength: char.strength,
          charm: char.charm,
          creativity: char.creativity,
        }))

        await supabase.from('leaderboard_snapshots').insert(snapshots)
      }

      await supabase.from('admin_audit_log').insert({
        admin_id: admin.id,
        action: 'END_ROUND',
        resource_type: 'game_rounds',
        resource_id: currentRound.id,
        changes: {
          status: 'active -> completed',
          snapshot_count: characters?.length || 0,
        },
        ip_address: req.headers.get('x-forwarded-for') || 'unknown',
        user_agent: req.headers.get('user-agent'),
      })

      const responseData = {
        round,
        snapshot_created: true,
        leaderboard_count: characters?.length || 0,
      }

      logger.logSuccess(200, responseData)
      return successResponse(responseData)
    } catch (error) {
      const errorMsg = (error as Error).message
      logger.logError(500, errorMsg)
      return errorResponse('INTERNAL_ERROR', 500, errorMsg)
    }
  })
)
