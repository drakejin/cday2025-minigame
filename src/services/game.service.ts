import { supabase } from './supabase'

export const gameService = {
  /**
   * Get current active round (Edge Function)
   */
  async getCurrentRound() {
    const { data, error } = await supabase.functions.invoke('get-current-round')

    if (error) throw error
    if (!data.success) throw new Error(data.error || 'Failed to get current round')
    return data.data
  },
}
