import { create } from 'zustand'
import { gameService } from '@/services/game.service'
import type { GameRound } from '@/types'

interface GameState {
  currentRound: GameRound | null
  timeRemaining: string
  isLoading: boolean
  error: string | null
  setCurrentRound: (round: GameRound | null) => void
  fetchCurrentRound: () => Promise<void>
  clearError: () => void
}

export const useGameStore = create<GameState>((set) => ({
  currentRound: null,
  timeRemaining: '00:00:00',
  isLoading: false,
  error: null,

  setCurrentRound: (round) => set({ currentRound: round }),

  fetchCurrentRound: async () => {
    set({ isLoading: true, error: null })
    try {
      const round = await gameService.getCurrentRound()
      set({
        currentRound: round,
        timeRemaining: round.time_remaining,
      })
    } catch (error) {
      set({ error: (error as Error).message })
    } finally {
      set({ isLoading: false })
    }
  },

  clearError: () => set({ error: null }),
}))
