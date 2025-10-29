import { useQuery } from '@tanstack/react-query'
import { gameService } from '@/services/game.service'

export const useCurrentRound = () => {
  return useQuery({
    queryKey: ['currentRound'],
    queryFn: () => gameService.getCurrentRound(),
    refetchInterval: 10000, // Refetch every 10 seconds for timer
  })
}
