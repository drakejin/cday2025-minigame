import { supabase } from './supabase'
import { handleEdgeFunctionResponse } from '@/utils/edgeFunction'

export const promptService = {
  /**
   * Submit prompt (Edge Function)
   */
  async submitPrompt(characterId: string, prompt: string) {
    const { data, error } = await supabase.functions.invoke('submit-prompt', {
      body: {
        character_id: characterId,
        prompt,
      },
    })
    console.log('submitPrompt response:', data, error)
    return handleEdgeFunctionResponse(data, error, 'Failed to submit prompt')
  },

  /**
   * Get round history with prompts (Edge Function)
   * Returns all rounds with LEFT JOIN to prompt_history
   * Shows rounds even if user didn't participate
   */
  async getRoundHistory(limit = 20, offset = 0) {
    const { data, error } = await supabase.functions.invoke('get-my-round-history', {
      body: { limit, offset },
    })

    const result = handleEdgeFunctionResponse<{ data: any }>(
      data,
      error,
      'Failed to get round history'
    )
    return result.data
  },
}
