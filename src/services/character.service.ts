import { supabase } from './supabase'
import { handleEdgeFunctionResponse } from '@/utils/edgeFunction'

export const characterService = {
  /**
   * Get user's active character (Edge Function)
   */
  async getMyCharacter() {
    const { data, error } = await supabase.functions.invoke('get-my-character')
    return handleEdgeFunctionResponse(data, error, 'Failed to get character')
  },

  /**
   * Create new character (Edge Function)
   */
  async createCharacter(name: string) {
    const { data, error } = await supabase.functions.invoke('create-character', {
      body: { name },
    })
    return handleEdgeFunctionResponse(data, error, 'Failed to create character')
  },

  /**
   * Update character name (Edge Function)
   */
  async updateCharacterName(characterId: string, name: string) {
    const { data, error } = await supabase.functions.invoke('update-character-name', {
      body: { character_id: characterId, name },
    })
    return handleEdgeFunctionResponse(data, error, 'Failed to update character')
  },
}
