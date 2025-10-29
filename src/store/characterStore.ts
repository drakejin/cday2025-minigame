import { create } from 'zustand'
import { characterService } from '@/services/character.service'
import type { Character } from '@/types'

interface CharacterState {
  character: Character | null
  isLoading: boolean
  error: string | null
  setCharacter: (character: Character | null) => void
  fetchCharacter: () => Promise<void>
  createCharacter: (name: string) => Promise<void>
  updateCharacterName: (characterId: string, name: string) => Promise<void>
  clearError: () => void
}

export const useCharacterStore = create<CharacterState>((set) => ({
  character: null,
  isLoading: false,
  error: null,

  setCharacter: (character) => set({ character }),

  fetchCharacter: async () => {
    set({ isLoading: true, error: null })
    try {
      const character = await characterService.getMyCharacter()
      set({ character })
    } catch (error) {
      set({ error: (error as Error).message })
    } finally {
      set({ isLoading: false })
    }
  },

  createCharacter: async (name) => {
    set({ isLoading: true, error: null })
    try {
      const character = await characterService.createCharacter(name)
      set({ character })
    } catch (error) {
      set({ error: (error as Error).message })
    } finally {
      set({ isLoading: false })
    }
  },

  updateCharacterName: async (characterId, name) => {
    set({ isLoading: true, error: null })
    try {
      const updated = await characterService.updateCharacterName(characterId, name)
      set((state) => ({
        character: state.character ? { ...state.character, name: updated.name } : null,
      }))
    } catch (error) {
      set({ error: (error as Error).message })
    } finally {
      set({ isLoading: false })
    }
  },

  clearError: () => set({ error: null }),
}))
