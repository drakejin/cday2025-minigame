import { useState } from 'react'
import { message } from 'antd'
import { useSubmitPrompt } from './queries/usePromptQuery'
import { useMyCharacter } from './queries/useCharacterQuery'
import { useCurrentRound } from './queries/useGameQuery'

/**
 * Hook for prompt submission logic
 * Handles submission state, validation, and error handling
 */
export const usePromptSubmit = () => {
  const [error, setError] = useState<string | null>(null)

  const { data: character } = useMyCharacter()
  const { data: roundData } = useCurrentRound()
  const currentRound = roundData?.currentRound
  const nextRound = roundData?.nextRound
  const submitMutation = useSubmitPrompt()

  // Check if user has already submitted this round
  const hasSubmittedThisRound = character?.last_submission_round === currentRound?.round_number

  // Can submit if: has character, round is active, and hasn't submitted yet
  const canSubmit = !!character && !!currentRound && !hasSubmittedThisRound

  const submitPrompt = async (prompt: string, trialId?: string) => {
    if (!character) {
      setError('캐릭터를 먼저 생성해주세요')
      return false
    }

    if (!currentRound) {
      setError('현재 진행 중인 시련가 없습니다')
      return false
    }

    if (hasSubmittedThisRound) {
      setError('이번 시련에 이미 제출했습니다')
      return false
    }

    try {
      setError(null)
      await submitMutation.mutateAsync({
        characterId: character.id,
        prompt,
        trialId,
      })
      message.success('프롬프트가 제출되었습니다!')
      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '프롬프트 제출에 실패했습니다'
      setError(errorMessage)
      message.error(errorMessage)
      return false
    }
  }

  return {
    submitPrompt,
    isSubmitting: submitMutation.isPending,
    error,
    hasSubmittedThisRound,
    canSubmit,
    currentRound,
    nextRound,
  }
}
