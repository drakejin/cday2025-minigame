export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginationParams {
  page?: number
  limit?: number
}

export interface ApiError {
  code: string
  message: string
  details?: unknown
}

export type ErrorCode =
  | 'INVALID_PROMPT_LENGTH'
  | 'ALREADY_SUBMITTED'
  | 'CHARACTER_NOT_FOUND'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'ROUND_NOT_ACTIVE'
  | 'RATE_LIMIT_EXCEEDED'
