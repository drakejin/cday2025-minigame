import { supabase } from './supabase'

export const characterService = {
  /**
   * Get user's active character (Edge Function)
   */
  async getMyCharacter() {
    const { data, error } = await supabase.functions.invoke('get-my-character')

    if (error) throw error
    if (!data.success) throw new Error(data.error || 'Failed to get character')
    return data.data
  },

  /**
   * Create new character (Edge Function)
   */
  async createCharacter(name: string) {
    const { data, error } = await supabase.functions.invoke('create-character', {
      body: { name },
    })

    if (error) throw error
    if (!data.success) throw new Error(data.error || 'Failed to create character')
    return data.data
  },

  /**
   * Update character name (Edge Function)
   */
  async updateCharacterName(characterId: string, name: string) {
    const { data, error } = await supabase.functions.invoke('update-character-name', {
      body: { character_id: characterId, name },
    })

    if (error) throw error
    if (!data.success) throw new Error(data.error || 'Failed to update character')
    return data.data
  },
}
