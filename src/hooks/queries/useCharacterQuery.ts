import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { characterService } from '@/services/character.service'
import { useAuthStore } from '@/store/authStore'

export const useMyCharacter = () => {
  const user = useAuthStore((state) => state.user)

  return useQuery({
    queryKey: ['character', user?.id],
    queryFn: () => characterService.getMyCharacter(),
    enabled: !!user,
  })
}

export const useCreateCharacter = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (name: string) => characterService.createCharacter(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['character'] })
    },
  })
}

export const useUpdateCharacterName = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ characterId, name }: { characterId: string; name: string }) =>
      characterService.updateCharacterName(characterId, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['character'] })
    },
  })
}
