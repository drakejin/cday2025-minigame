import type { RealtimeChannel } from '@supabase/supabase-js'
import { supabase } from './supabase'

export const realtimeService = {
  /**
   * Subscribe to leaderboard updates
   */
  subscribeToLeaderboard(callback: () => void): RealtimeChannel {
    // Subscribe to characters and prompt_history changes to keep leaderboard fresh
    const channel = supabase
      .channel('leaderboard-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'characters',
        },
        callback
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'prompt_history',
        },
        callback
      )
      .subscribe()
    return channel
  },

  /**
   * Subscribe to game round changes
   */
  subscribeToRounds(callback: () => void): RealtimeChannel {
    return supabase
      .channel('round-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'game_rounds',
        },
        callback
      )
      .subscribe()
  },

  /**
   * Unsubscribe from channel
   */
  async unsubscribe(channel: RealtimeChannel) {
    await supabase.removeChannel(channel)
  },
}
