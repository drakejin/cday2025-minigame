import type { RealtimeChannel } from '@supabase/supabase-js'
import { useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { queryKeys } from '@/lib/queryKeys'
import { realtimeService } from '@/services/realtime.service'

/**
 * Hook to subscribe to real-time leaderboard updates
 * Automatically invalidates leaderboard queries when characters table changes
 */
export const useRealtimeLeaderboard = () => {
  const queryClient = useQueryClient()

  useEffect(() => {
    let channel: RealtimeChannel | null = null

    // Subscribe to character updates
    channel = realtimeService.subscribeToLeaderboard(() => {
      // Invalidate leaderboard queries to trigger refetch
      queryClient.invalidateQueries({ queryKey: queryKeys.leaderboard.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.rank.all })
    })

    // Cleanup on unmount
    return () => {
      if (channel) {
        realtimeService.unsubscribe(channel)
      }
    }
  }, [queryClient])
}
