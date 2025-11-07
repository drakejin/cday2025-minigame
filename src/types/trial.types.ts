export interface Trial {
  id: string
  round_id: string
  trial_no: 1 | 2 | 3
  level: 1 | 2 | 3
  weight_multiplier: 1 | 2 | 3 | 4
  status: 'scheduled' | 'active' | 'completed' | 'cancelled'
  created_at: string
  updated_at: string
}

export interface TrialResult {
  id: string
  trial_id: string
  character_id: string
  user_id: string
  prompt_history_id: string
  score_strength: number
  score_dexterity: number
  score_constitution: number
  score_intelligence: number
  total_score: number
  weighted_total: number
  needs_revalidation: boolean
  created_at: string
  updated_at: string
}
