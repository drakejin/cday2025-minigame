export interface GameRound {
  id: string
  round_number: number
  start_time: string
  end_time: string
  actual_end_time?: string
  is_active: boolean
  status: 'scheduled' | 'active' | 'completed' | 'cancelled'
  started_by?: string
  ended_by?: string
  trial_text?: string
  created_at: string
}

export interface CurrentRound {
  id: string
  round_number: number
  start_time: string
  end_time: string
  time_remaining: string
}

export interface PromptHistory {
  id: string
  character_id: string
  user_id: string
  prompt: string
  round_number: number
  strength_gained: number
  charm_gained: number
  creativity_gained: number
  total_score_gained: number
  created_at: string
}

export interface RoundHistory {
  round_id: string
  round_number: number
  round_status: 'scheduled' | 'active' | 'completed' | 'cancelled'
  round_start_time: string
  round_end_time: string
  // Prompt data (null if not participated)
  prompt_id: string | null
  prompt: string | null
  strength_gained: number
  charm_gained: number
  creativity_gained: number
  total_score_gained: number
  created_at: string | null
  participated: boolean
}

export interface SubmitPromptData {
  character_id: string
  prompt: string
}

export interface SubmitPromptResponse {
  success: boolean
  data?: {
    prompt_history_id: string
    round_number: number
    scores: {
      strength: number
      charm: number
      creativity: number
      total: number
    }
    character: {
      total_score: number
      strength: number
      charm: number
      creativity: number
    }
  }
  error?: string
  message?: string
}
