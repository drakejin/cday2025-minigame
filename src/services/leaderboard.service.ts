import { supabase } from './supabase'
import { handleEdgeFunctionResponse } from '@/utils/edgeFunction'

export const leaderboardService = {
  /**
   * Get current leaderboard (Edge Function)
   */
  async getCurrentLeaderboard(limit = 100, offset = 0) {
    const { data, error } = await supabase.functions.invoke('get-leaderboard', {
      body: { limit, offset },
    })

    const result = handleEdgeFunctionResponse<{ data: unknown }>(
      data,
      error,
      'Failed to get leaderboard'
    )
    return result.data
  },

  /**
   * Get my rank (Edge Function)
   */
  async getMyRank(characterId: string) {
    const { data, error } = await supabase.functions.invoke('get-my-rank', {
      body: { character_id: characterId },
    })

    return handleEdgeFunctionResponse(data, error, 'Failed to get rank')
  },
}
