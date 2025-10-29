import { useEffect } from 'react'
import { useCharacterStore } from '@/store/characterStore'
import { useAuth } from './useAuth'

export const useCharacter = () => {
  const { user } = useAuth()
  const { character, isLoading, error, fetchCharacter, createCharacter, updateCharacterName } =
    useCharacterStore()

  useEffect(() => {
    if (user) {
      fetchCharacter()
    }
  }, [user, fetchCharacter])

  return {
    character,
    isLoading,
    error,
    createCharacter,
    updateCharacterName,
  }
}
