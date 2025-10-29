import { supabase } from './supabase'

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

    if (error) throw error
    if (!data.success) throw new Error(data.error || 'Failed to submit prompt')
    return data.data
  },

  /**
   * Get prompt history (Edge Function)
   */
  async getPromptHistory(limit = 20, offset = 0) {
    const { data, error } = await supabase.functions.invoke('get-my-prompts', {
      body: { limit, offset },
    })

    if (error) throw error
    if (!data.success) throw new Error(data.error || 'Failed to get prompt history')
    return data.data.data
  },
}
