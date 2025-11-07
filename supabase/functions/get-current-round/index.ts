import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createSupabaseClient } from '../_shared/db.ts'
import { errorResponse, successResponse } from '../_shared/response.ts'
import { withLogging } from '../_shared/withLogging.ts'

interface GameRound {
  id: string
  round_number: number
  start_time: string
  end_time: string
  status: string
  is_active: boolean
}

type SupabaseClient = ReturnType<typeof createSupabaseClient>

/**
 * Format round data for response
 */
function formatRoundData(round: GameRound | null) {
  if (!round) return null

  return {
    id: round.id,
    round_number: round.round_number,
    start_time: round.start_time,
    end_time: round.end_time,
    status: round.status,
  }
}

/**
 * Calculate time remaining for a round
 */
function calculateTimeRemaining(endTime: string): string {
  const end = new Date(endTime).getTime()
  const diff = Math.max(0, end - Date.now())

  const hours = Math.floor(diff / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((diff % (1000 * 60)) / 1000)

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

/**
 * Get next scheduled round
 */
async function getNextRound(supabase: SupabaseClient, now: string) {
  const { data: nextRound } = await supabase
    .from('game_rounds')
    .select('*')
    .eq('is_active', true)
    .gt('start_time', now)
    .order('start_time', { ascending: true })
    .limit(1)
    .maybeSingle()

  return formatRoundData(nextRound)
}

serve(
  withLogging('get-current-round', async (_req, logger) => {
    try {
      const supabase = createSupabaseClient()
      const now = new Date().toISOString()

      // Get current active round (is_active=true AND start_time <= now <= end_time)
      const { data: currentRound, error } = await supabase
        .from('game_rounds')
        .select('*')
        .eq('is_active', true)
        .lte('start_time', now)
        .gte('end_time', now)
        .maybeSingle()

      if (error) {
        logger.logError(500, error.message)
        return errorResponse('DATABASE_ERROR', 500, error.message)
      }

      // No active round - return next scheduled round
      if (!currentRound) {
        const nextRound = await getNextRound(supabase, now)
        const responseData = { current_round: null, next_round: nextRound }

        logger.logSuccess(200, responseData)
        return successResponse(responseData)
      }

      // Active round found
      const responseData = {
        current_round: {
          ...formatRoundData(currentRound),
          time_remaining: calculateTimeRemaining(currentRound.end_time),
          is_active: currentRound.is_active,
        },
        next_round: null,
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
