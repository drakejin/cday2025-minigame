import { useQuery } from '@tanstack/react-query'
import { leaderboardService } from '@/services/leaderboard.service'
import { queryKeys } from '@/lib/queryKeys'

export const useLeaderboard = (limit = 100, offset = 0) => {
  return useQuery({
    queryKey: queryKeys.leaderboard.list(limit, offset),
    queryFn: () => leaderboardService.getCurrentLeaderboard(limit, offset),
  })
}
