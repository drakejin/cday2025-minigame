import { supabase } from './supabase'
import { handleEdgeFunctionResponse } from '@/utils/edgeFunction'

export const gameService = {
  /**
   * Get current active round (Edge Function)
   */
  async getCurrentRound() {
    const { data, error } = await supabase.functions.invoke('get-current-round')
    return handleEdgeFunctionResponse(data, error, 'Failed to get current round')
  },
}
