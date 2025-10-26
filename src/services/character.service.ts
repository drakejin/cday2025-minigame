import { supabase } from './supabase'

export const characterService = {
  /**
   * Get user's active character
   */
  async getMyCharacter(userId: string) {
    const { data, error } = await supabase
      .from('characters')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .maybeSingle()

    if (error) throw error
    return data
  },

  /**
   * Create new character
   */
  async createCharacter(userId: string, name: string) {
    const { data, error } = await supabase
      .from('characters')
      .insert({
        user_id: userId,
        name,
        current_prompt: '새로운 영웅',
      })
      .select()
      .single()

    if (error) throw error
    return data
  },

  /**
   * Update character name
   */
  async updateCharacterName(characterId: string, name: string) {
    const { data, error } = await supabase
      .from('characters')
      .update({ name })
      .eq('id', characterId)
      .select()
      .single()

    if (error) throw error
    return data
  },

  /**
   * Get character by ID
   */
  async getCharacterById(characterId: string) {
    const { data, error } = await supabase
      .from('characters')
      .select('*')
      .eq('id', characterId)
      .single()

    if (error) throw error
    return data
  },
}
