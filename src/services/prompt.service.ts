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
   * Get prompt history (Edge Function)
   */
  async getPromptHistory(limit = 20, offset = 0) {
    const { data, error } = await supabase.functions.invoke('get-my-prompts', {
      body: { limit, offset },
    })

    const result = handleEdgeFunctionResponse<{ data: any }>(
      data,
      error,
      'Failed to get prompt history'
    )
    return result.data
  },
}
