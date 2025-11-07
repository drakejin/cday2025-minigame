import { useQuery } from '@tanstack/react-query'
import { trialService } from '@/services/trial.service'

export const useActiveRoundTrials = () => {
  return useQuery({
    queryKey: ['trials', 'activeRound'],
    queryFn: () => trialService.getActiveRoundTrials(),
  })
}
