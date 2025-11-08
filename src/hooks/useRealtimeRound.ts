import type { RealtimeChannel } from '@supabase/supabase-js'
import { useQueryClient } from '@tanstack/react-query'
import { message } from 'antd'
import { useEffect } from 'react'
import { queryKeys } from '@/lib/queryKeys'
import { realtimeService } from '@/services/realtime.service'

/**
 * Hook to subscribe to real-time game round updates
 * Shows notification when round changes and invalidates round queries
 */
export const useRealtimeRound = () => {
  const queryClient = useQueryClient()

  useEffect(() => {
    let channel: RealtimeChannel | null = null

    // Subscribe to round updates
    channel = realtimeService.subscribeToRounds(() => {
      // Show notification
      message.info('게임 시련가 업데이트되었습니다!')

      // Invalidate round queries to trigger refetch
      queryClient.invalidateQueries({ queryKey: queryKeys.round.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.prompts.all })

      // Also invalidate leaderboard as new round affects rankings
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
