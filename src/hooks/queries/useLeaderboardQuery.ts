import { useQuery } from '@tanstack/react-query'
import { leaderboardService } from '@/services/leaderboard.service'

export const useLeaderboard = (limit = 100, offset = 0) => {
  return useQuery({
    queryKey: ['leaderboard', limit, offset],
    queryFn: () => leaderboardService.getCurrentLeaderboard(limit, offset),
  })
}

export const useMyRank = (characterId?: string) => {
  return useQuery({
    queryKey: ['myRank', characterId],
    queryFn: () => leaderboardService.getMyRank(characterId!),
    enabled: !!characterId,
  })
}
