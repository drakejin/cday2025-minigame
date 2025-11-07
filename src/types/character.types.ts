export interface Character {
  id: string
  user_id: string
  name: string
  current_prompt: string
  is_active: boolean
  created_at: string
  updated_at: string
}

// Aggregated stats from prompt_history
export interface CharacterStats {
  str: number
  dex: number
  con: number
  int: number
  total: number
}

export interface CreateCharacterData {
  user_id: string
  name: string
  current_prompt: string
}

export interface UpdateCharacterData {
  name?: string
  current_prompt?: string
}
