import { message } from 'antd'
import { useState } from 'react'
import { useMyCharacter } from './queries/useCharacterQuery'
import { useCurrentRound } from './queries/useGameQuery'
import { useSubmitPrompt } from './queries/usePromptQuery'

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

  const submitPrompt = async (prompt: string, trialData: Record<number, any>) => {
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

    // Validate prompt length
    const trimmedPrompt = prompt.trim()
    if (trimmedPrompt.length === 0) {
      setError('프롬프트를 입력해주세요')
      return false
    }

    if (trimmedPrompt.length > 30) {
      setError('프롬프트는 30자 이하로 입력해주세요')
      return false
    }

    try {
      setError(null)
      await submitMutation.mutateAsync({
        characterId: character.id,
        prompt: trimmedPrompt,
        trialData,
      })
      message.success('제출이 완료되었습니다!')
      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '제출에 실패했습니다'
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
