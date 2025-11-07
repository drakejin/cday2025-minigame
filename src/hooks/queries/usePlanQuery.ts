import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { planService } from '@/services/plan.service'

export const useMyPlan = () => {
  return useQuery({
    queryKey: ['plan', 'me'],
    queryFn: () => planService.getMyPlan(),
  })
}

export const useUpsertPlan = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: planService.upsertPlan,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['plan'] })
    },
  })
}
