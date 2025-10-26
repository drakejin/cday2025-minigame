import { supabase } from './supabase'

export const gameService = {
  /**
   * Get current active round
   */
  async getCurrentRound() {
    const { data, error } = await supabase
      .from('game_rounds')
      .select('*')
      .eq('is_active', true)
      .maybeSingle()

    if (error) throw error
    return data
  },

  /**
   * Get round by number
   */
  async getRoundByNumber(roundNumber: number) {
    const { data, error } = await supabase
      .from('game_rounds')
      .select('*')
      .eq('round_number', roundNumber)
      .single()

    if (error) throw error
    return data
  },

  /**
   * Get all rounds (with pagination)
   */
  async getRounds(limit = 20) {
    const { data, error } = await supabase
      .from('game_rounds')
      .select('*')
      .order('round_number', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data
  },

  /**
   * Calculate time remaining in current round
   */
  calculateTimeRemaining(endTime: string): string {
    const now = new Date().getTime()
    const end = new Date(endTime).getTime()
    const diff = Math.max(0, end - now)

    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    const seconds = Math.floor((diff % (1000 * 60)) / 1000)

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  },
}
