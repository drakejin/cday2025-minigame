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
    return data
  },

  /**
   * Get prompt history for character
   */
  async getPromptHistory(characterId: string, limit = 20) {
    const { data, error } = await supabase
      .from('prompt_history')
      .select('*')
      .eq('character_id', characterId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data
  },

  /**
   * Check if already submitted in current round
   */
  async hasSubmittedInRound(characterId: string, roundNumber: number) {
    const { data, error } = await supabase
      .from('prompt_history')
      .select('id')
      .eq('character_id', characterId)
      .eq('round_number', roundNumber)
      .maybeSingle()

    if (error) throw error
    return !!data
  },
}
