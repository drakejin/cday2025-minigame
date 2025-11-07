import { supabase } from './supabase'
import type { RealtimeChannel } from '@supabase/supabase-js'

export const realtimeService = {
  /**
   * Subscribe to leaderboard updates
   */
  subscribeToLeaderboard(callback: () => void): RealtimeChannel {
    // Subscribe to both characters and trial_results changes to keep leaderboard fresh
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
          table: 'trial_results',
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

  /**
   * Unsubscribe from all channels
   */
  async unsubscribeAll() {
    await supabase.removeAllChannels()
  },
}
