import { supabase } from './supabase'

export const leaderboardService = {
  /**
   * Get current leaderboard (Edge Function)
   */
  async getCurrentLeaderboard(limit = 100, offset = 0) {
    const { data, error } = await supabase.functions.invoke('get-leaderboard', {
      body: { limit, offset },
    })

    if (error) throw error
    if (!data.success) throw new Error(data.error || 'Failed to get leaderboard')
    return data.data.data
  },

  /**
   * Get my rank (Edge Function)
   */
  async getMyRank(characterId: string) {
    const { data, error } = await supabase.functions.invoke('get-my-rank', {
      body: { character_id: characterId },
    })

    if (error) throw error
    if (!data.success) throw new Error(data.error || 'Failed to get rank')
    return data.data
  },
}
