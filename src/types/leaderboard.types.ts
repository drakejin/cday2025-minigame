export interface LeaderboardEntry {
  rank: number
  character_id: string
  character_name: string
  username: string
  display_name: string | null
  avatar_url: string | null
  total_score: number
  strength: number
  charm: number
  creativity: number
  current_prompt: string
}

export interface LeaderboardSnapshot {
  id: string
  round_number: number
  character_id: string
  user_id: string
  rank: number
  total_score: number
  strength: number
  charm: number
  creativity: number
  created_at: string
}

export interface MyRank {
  rank: number
  total_participants: number
  percentile: number
  character: {
    total_score: number
    strength: number
    charm: number
    creativity: number
  }
}
