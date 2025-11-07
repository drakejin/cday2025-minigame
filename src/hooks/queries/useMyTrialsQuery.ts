import { useQuery } from '@tanstack/react-query'
import { trialService } from '@/services/trial.service'

export const useMyTrials = () => {
  return useQuery({
    queryKey: ['trials', 'me'],
    queryFn: () => trialService.getMyTrials(),
  })
}


