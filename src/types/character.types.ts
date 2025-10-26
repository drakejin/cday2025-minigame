export interface Character {
  id: string
  user_id: string
  name: string
  current_prompt: string
  total_score: number
  strength: number
  charm: number
  creativity: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface CharacterStats {
  strength: number
  charm: number
  creativity: number
  totalScore: number
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
