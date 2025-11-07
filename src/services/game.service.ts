import { supabase } from './supabase'
import { handleEdgeFunctionResponse } from '@/utils/edgeFunction'
import type { CurrentRound } from '@/types/game.types'

interface GetCurrentRoundResponse {
  current_round: CurrentRound | null
  next_round: CurrentRound | null
}

export const gameService = {
  /**
   * Get current active round (Edge Function)
   */
  async getCurrentRound(): Promise<GetCurrentRoundResponse> {
    const { data, error } = await supabase.functions.invoke('get-current-round', {})
    return handleEdgeFunctionResponse<GetCurrentRoundResponse>(
      data,
      error,
      'Failed to get current round'
    )
  },
}
