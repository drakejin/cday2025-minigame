import { supabase } from './supabase'
import { handleEdgeFunctionResponse } from '@/utils/edgeFunction'
import type { LeaderboardResponse } from '@/types'

export const leaderboardService = {
  /**
   * Get current characters ranking from characters table (Edge Function)
   */
  async getCurrentLeaderboard(limit = 100, offset = 0): Promise<LeaderboardResponse> {
    const { data, error } = await supabase.functions.invoke('get-characters-ranking', {
      body: { limit, offset },
    })

    return handleEdgeFunctionResponse<LeaderboardResponse>(
      data,
      error,
      'Failed to get characters ranking'
    )
  },

  /**
   * Get past round leaderboard snapshot (Edge Function)
   */
  async getPastLeaderboard(roundNumber: number, limit = 100, offset = 0) {
    const { data, error } = await supabase.functions.invoke('get-leaderboard-snapshot', {
      body: { roundNumber, limit, offset },
    })

    return handleEdgeFunctionResponse(data, error, 'Failed to get leaderboard snapshot')
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
