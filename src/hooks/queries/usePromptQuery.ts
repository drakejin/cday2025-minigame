import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { promptService } from '@/services/prompt.service'
import { queryKeys } from '@/lib/queryKeys'

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
    }: {
      characterId: string
      prompt: string
    }) => promptService.submitPrompt(characterId, prompt),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.character.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.prompts.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.leaderboard.all })
    },
  })
}
