/**
 * Application-wide constants
 */

export const APP_NAME = 'Character Battle'
export const APP_DESCRIPTION = '1시간마다 30자 프롬프트로 최강의 캐릭터 만들기'

/**
 * Route paths
 */
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  SIGNUP: '/signup',
  DASHBOARD: '/dashboard',
  SUBMIT: '/submit',
  HISTORY: '/history',
  LEADERBOARD: '/leaderboard',
  LEADERBOARD_PAST: '/leaderboard/:roundNumber',
  PROFILE: '/profile',
  PROFILE_EDIT: '/profile/edit',
} as const

/**
 * Game settings
 */
export const GAME_SETTINGS = {
  PROMPT_MIN_LENGTH: 1,
  PROMPT_MAX_LENGTH: 30,
  ROUND_DURATION_HOURS: 1,
  LEADERBOARD_PAGE_SIZE: 100,
  MAX_SCORE_PER_STAT: 50,
} as const

/**
 * Score categories
 */
export const SCORE_CATEGORIES = {
  STRENGTH: 'strength',
  CHARM: 'charm',
  CREATIVITY: 'creativity',
} as const

/**
 * Score category labels
 */
export const SCORE_CATEGORY_LABELS = {
  [SCORE_CATEGORIES.STRENGTH]: '힘',
  [SCORE_CATEGORIES.CHARM]: '매력',
  [SCORE_CATEGORIES.CREATIVITY]: '창의성',
} as const

/**
 * Rank medal colors
 */
export const RANK_COLORS = {
  1: { bg: 'bg-yellow-500', text: 'text-yellow-500', border: 'border-yellow-500' }, // Gold
  2: { bg: 'bg-gray-400', text: 'text-gray-400', border: 'border-gray-400' }, // Silver
  3: { bg: 'bg-orange-600', text: 'text-orange-600', border: 'border-orange-600' }, // Bronze
} as const

/**
 * Toast duration (milliseconds)
 */
export const TOAST_DURATION = {
  SHORT: 2000,
  MEDIUM: 3000,
  LONG: 5000,
} as const

/**
 * API error messages
 */
export const ERROR_MESSAGES = {
  INVALID_PROMPT_LENGTH: '프롬프트는 1-30자 사이여야 합니다.',
  ALREADY_SUBMITTED: '이미 이번 라운드에 프롬프트를 제출했습니다.',
  CHARACTER_NOT_FOUND: '캐릭터를 찾을 수 없습니다.',
  UNAUTHORIZED: '로그인이 필요합니다.',
  FORBIDDEN: '권한이 없습니다.',
  ROUND_NOT_ACTIVE: '현재 활성화된 라운드가 없습니다.',
  RATE_LIMIT_EXCEEDED: '너무 많은 요청을 보냈습니다. 잠시 후 다시 시도해주세요.',
  NETWORK_ERROR: '네트워크 오류가 발생했습니다.',
  UNKNOWN_ERROR: '알 수 없는 오류가 발생했습니다.',
} as const

/**
 * Success messages
 */
export const SUCCESS_MESSAGES = {
  SIGNUP_SUCCESS: '회원가입이 완료되었습니다.',
  LOGIN_SUCCESS: '로그인되었습니다.',
  LOGOUT_SUCCESS: '로그아웃되었습니다.',
  PROMPT_SUBMITTED: '프롬프트가 제출되었습니다!',
  PROFILE_UPDATED: '프로필이 업데이트되었습니다.',
  CHARACTER_CREATED: '캐릭터가 생성되었습니다.',
  CHARACTER_UPDATED: '캐릭터 정보가 업데이트되었습니다.',
} as const

/**
 * Local storage keys
 */
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  USER_PREFERENCES: 'user_preferences',
} as const

/**
 * Realtime channel names
 */
export const REALTIME_CHANNELS = {
  LEADERBOARD: 'leaderboard-updates',
  ROUNDS: 'round-updates',
  CHARACTERS: 'character-updates',
} as const
