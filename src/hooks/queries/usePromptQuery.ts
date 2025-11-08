import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryKeys'
import { promptService } from '@/services/prompt.service'

/**
 * Get round history with user's prompts
 * Returns all rounds (LEFT JOIN) even if user didn't participate
 */
export const useMyRoundHistory = (limit = 20, offset = 0) => {
  return useQuery({
    queryKey: queryKeys.prompts.list(limit, offset),
    queryFn: () => promptService.getRoundHistory(limit, offset),
  })
}

export const useSubmitPrompt = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      characterId,
      prompt,
      trialData,
    }: {
      characterId: string
      prompt: string
      trialData: Record<number, any>
    }) => promptService.submitPrompt(characterId, prompt, trialData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.character.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.prompts.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.leaderboard.all })
    },
  })
}
