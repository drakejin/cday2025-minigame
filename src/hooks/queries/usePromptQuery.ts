import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { promptService } from '@/services/prompt.service'

export const useMyPrompts = (limit = 20, offset = 0) => {
  return useQuery({
    queryKey: ['prompts', limit, offset],
    queryFn: () => promptService.getPromptHistory(limit, offset),
  })
}

export const useSubmitPrompt = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ characterId, prompt }: { characterId: string; prompt: string }) =>
      promptService.submitPrompt(characterId, prompt),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['character'] })
      queryClient.invalidateQueries({ queryKey: ['prompts'] })
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] })
    },
  })
}
