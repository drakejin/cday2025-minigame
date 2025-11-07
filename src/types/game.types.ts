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
  status: 'scheduled' | 'active' | 'completed' | 'cancelled'
  is_active: boolean
}

export interface PromptHistory {
  id: string
  character_id: string
  user_id: string
  prompt: string
  round_number: number
  str: number
  dex: number
  con: number
  int: number
  skill: string
  is_deleted: boolean
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
  str: number
  dex: number
  con: number
  int: number
  skill: string | null
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
    level: number
    stats: {
      str: number
      dex: number
      con: number
      int: number
      skill: string
    }
  }
  error?: string
  message?: string
}
