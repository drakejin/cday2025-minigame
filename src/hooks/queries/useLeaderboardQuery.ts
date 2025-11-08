import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryKeys'
import { leaderboardService } from '@/services/leaderboard.service'

export const useLeaderboard = (limit = 100, offset = 0) => {
  return useQuery({
    queryKey: queryKeys.leaderboard.list(limit, offset),
    queryFn: () => leaderboardService.getCurrentLeaderboard(limit, offset),
    staleTime: 20000, // Data becomes stale after 20 seconds
    refetchOnWindowFocus: true, // Refetch when window regains focus
    refetchOnMount: true, // Refetch on mount if data is stale
  })
}
