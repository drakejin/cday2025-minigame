import { supabase } from './supabase'
import { handleEdgeFunctionResponse } from '@/utils/edgeFunction'
import type { SubmitPromptResponse, RoundHistory } from '@/types/game.types'

export const promptService = {
  /**
   * Submit prompt (Edge Function)
   */
  async submitPrompt(characterId: string, prompt: string): Promise<SubmitPromptResponse> {
    const { data, error } = await supabase.functions.invoke('submit-prompt', {
      body: {
        character_id: characterId,
        prompt,
      },
    })
    console.log('submitPrompt response:', data, error)
    return handleEdgeFunctionResponse<SubmitPromptResponse>(data, error, 'Failed to submit prompt')
  },

  /**
   * Get round history with prompts (Edge Function)
   * Returns all rounds with LEFT JOIN to prompt_history
   * Shows rounds even if user didn't participate
   */
  async getRoundHistory(limit = 20, offset = 0): Promise<RoundHistory[]> {
    const { data, error } = await supabase.functions.invoke('get-my-round-history', {
      body: { limit, offset },
    })

    const result = handleEdgeFunctionResponse<{ data: RoundHistory[] }>(
      data,
      error,
      'Failed to get round history'
    )
    return result.data
  },
}
