import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { characterService } from '@/services/character.service'
import { useAuthStore } from '@/store/authStore'
import { queryKeys } from '@/lib/queryKeys'

export const useMyCharacter = () => {
  const user = useAuthStore((state) => state.user)

  return useQuery({
    queryKey: queryKeys.character.byUser(user?.id),
    queryFn: () => characterService.getMyCharacter(),
    enabled: !!user,
  })
}

export const useCreateCharacter = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (name: string) => characterService.createCharacter(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.character.all })
    },
  })
}
