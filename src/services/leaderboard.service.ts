import { supabase } from './supabase'
import { handleEdgeFunctionResponse } from '@/utils/edgeFunction'
import type { LeaderboardResponse, LeaderboardEntry } from '@/types'

export const leaderboardService = {
  /**
   * Get current characters ranking from characters table (Edge Function)
   */
  async getCurrentLeaderboard(limit = 100, offset = 0): Promise<LeaderboardResponse> {
    const { data, error } = await supabase.functions.invoke('get-characters-ranking', {
      body: { limit, offset },
    })

    const raw = handleEdgeFunctionResponse<{
      data: Array<{
        rank: number
        character_id: string
        character_name: string
        display_name: string
        avatar_url: string | null
        weighted_total: number
        current_prompt: string | null
      }>
      pagination: { total: number; limit: number; offset: number }
    }>(data, error, 'Failed to get leaderboard')

    const mapped: LeaderboardEntry[] = (raw.data || []).map((item) => ({
      rank: item.rank,
      character_id: item.character_id,
      character_name: item.character_name,
      display_name: item.display_name,
      avatar_url: item.avatar_url,
      total_score: item.weighted_total ?? 0,
      strength: 0,
      charm: 0,
      creativity: 0,
      current_prompt: item.current_prompt || '',
    }))

    return {
      data: mapped,
      pagination: raw.pagination,
    }
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
