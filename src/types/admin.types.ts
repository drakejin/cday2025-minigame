export interface AdminRound {
  id: string
  roundNumber: number
  startTime: string
  endTime: string
  actualEndTime?: string
  isActive: boolean
  status: 'scheduled' | 'active' | 'completed' | 'cancelled'
  startedBy?: string
  endedBy?: string
  notes?: string
  createdAt: string
}

// Note: DB columns are snake_case, but Edge Functions convert to camelCase
// for consistent JavaScript/TypeScript naming conventions

export interface AdminPrompt {
  id: string
  characterId: string
  userId: string
  promptText: string
  prompt: string
  roundNumber: number
  strengthGained: number
  charmGained: number
  creativityGained: number
  totalScoreGained: number
  scoreChange: number
  submittedAt: string
  createdAt: string
  userEmail?: string
  characterName?: string
  characters?: {
    name: string
    userId: string
  }
}

export interface AdminUser {
  id: string
  userId: string
  email: string
  name: string
  strength: number
  charm: number
  creativity: number
  totalScore: number
  isBanned: boolean
  bannedAt?: string
  banReason?: string
  role: 'user' | 'admin' | 'super_admin'
  characterCount: number
  promptCount: number
  lastSubmissionRound?: number
  createdAt: string
  updatedAt: string
  promptHistory?: { count: number }[]
}

export interface AdminUserDetail {
  user: AdminUser
  characters: Array<{
    id: string
    name: string
    totalScore: number
    createdAt: string
  }>
  prompts: Array<{
    id: string
    roundNumber: number
    promptText: string
    scoreChange: number
    createdAt: string
  }>
}

export interface AdminStats {
  totalUsers: number
  totalCharacters: number
  totalPrompts: number
  totalRounds: number
  activeRound?: {
    id: string
    roundNumber: number
    startTime: string
    endTime: string
    status: string
    isActive: boolean
    participants?: number
    submissionRate?: number
  } | null
  recentActivity?: {
    last1Hour: number
    last24Hours: number
  }
}

export interface RoundStats {
  round: AdminRound
  stats: {
    totalPrompts: number
    uniqueUsers: number
    averageScores: {
      strength: number
      charm: number
      creativity: number
      total: number
    }
  }
  topPrompts: AdminPrompt[]
}

export interface UserStat {
  userId: string
  email: string
  characterCount: number
  promptCount: number
  avgScoreChange: number
  maxScore: number
  createdAt: string
}

export interface UserStats {
  totalUsers: number
  activeUsers7d: number
  newUsers7d: number
  totalPrompts: number
  avgPromptsPerUser: string
  users: UserStat[]
}

// JSON value types for audit logs
export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue }

export interface AuditLog {
  id: string
  adminId: string
  adminEmail: string
  action: string
  resourceType: string
  resourceId?: string
  targetId?: string
  changes?: Record<string, JsonValue>
  details?: Record<string, JsonValue>
  ipAddress?: string
  userAgent?: string
  createdAt: string
}
