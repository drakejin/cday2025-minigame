import type { LeaderboardEntry, LeaderboardResponse } from '@/types'
import { handleEdgeFunctionResponse } from '@/utils/edgeFunction'
import { supabase } from './supabase'

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
        total_score: number
        current_prompt: string | null
        current_skill: string | null
      }>
      pagination: { total: number; limit: number; offset: number }
    }>(data, error, 'Failed to get leaderboard')

    const mapped: LeaderboardEntry[] = (raw.data || []).map((item) => ({
      rank: item.rank,
      character_id: item.character_id,
      character_name: item.character_name,
      display_name: item.display_name,
      avatar_url: item.avatar_url,
      total_score: item.total_score ?? 0,
      strength: 0,
      charm: 0,
      creativity: 0,
      current_prompt: item.current_prompt || '',
      current_skill: item.current_skill || '',
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
