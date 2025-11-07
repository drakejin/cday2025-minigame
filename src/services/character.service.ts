import { FunctionRegion } from '@supabase/supabase-js'
import { supabase } from './supabase'
import { handleEdgeFunctionResponse } from '@/utils/edgeFunction'
import type { Character } from '@/types/character.types'

export interface CharacterWithSubmission extends Character {
  last_submission_round?: number
  total_score?: number
  strength?: number
  charm?: number
  creativity?: number
}

export const characterService = {
  /**
   * Get user's active character (Edge Function)
   */
  async getMyCharacter(): Promise<CharacterWithSubmission | null> {
    const { data, error } = await supabase.functions.invoke('get-my-character', {
      region: FunctionRegion.ApNortheast2,
    })
    return handleEdgeFunctionResponse<CharacterWithSubmission | null>(
      data,
      error,
      'Failed to get character'
    )
  },

  /**
   * Create new character (Edge Function)
   */
  async createCharacter(name: string): Promise<Character> {
    const { data, error } = await supabase.functions.invoke('create-character', {
      body: { name },
      region: FunctionRegion.ApNortheast2,
    })
    return handleEdgeFunctionResponse<Character>(data, error, 'Failed to create character')
  },

  /**
   * Update character name (Edge Function)
   */
  async updateCharacterName(characterId: string, name: string): Promise<Character> {
    const { data, error } = await supabase.functions.invoke('update-character-name', {
      body: { character_id: characterId, name },
      region: FunctionRegion.ApNortheast2,
    })
    return handleEdgeFunctionResponse<Character>(data, error, 'Failed to update character')
  },
}
