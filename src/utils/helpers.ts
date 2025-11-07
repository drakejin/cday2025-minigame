/**
 * Get rank suffix (1st, 2nd, 3rd, etc.)
 */
export const getRankSuffix = (rank: number): string => {
  if (rank === 1) return '1위'
  if (rank === 2) return '2위'
  if (rank === 3) return '3위'
  return `${rank}위`
}

/**
 * Get rank color based on position (Ant Design colors)
 */
export const getRankColor = (rank: number): string => {
  if (rank === 1) return '#faad14' // gold
  if (rank === 2) return '#8c8c8c' // silver
  if (rank === 3) return '#d48806' // bronze
  return '#000000e0' // default text color
}

/**
 * Check if user has submitted prompt in current round
 */
export const hasSubmittedInRound = (
  promptHistory: Array<{ round_number: number }>,
  currentRound: number
): boolean => {
  return promptHistory.some((h) => h.round_number === currentRound)
}

/**
 * Calculate percentile from rank and total participants
 */
export const calculatePercentile = (rank: number, totalParticipants: number): number => {
  if (totalParticipants === 0) return 0
  return ((totalParticipants - rank + 1) / totalParticipants) * 100
}

/**
 * Truncate text with ellipsis
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text
  return `${text.slice(0, maxLength)}...`
}

/**
 * Get initials from name (for avatar fallback)
 */
export const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

/**
 * Sleep utility for delays
 */
export const sleep = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Debounce function
 */
export const debounce = <T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout | null = null

  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

/**
 * Generate random ID
 */
export const generateId = (): string => {
  return Math.random().toString(36).substring(2, 9)
}

/**
 * Check if value is empty
 */
export const isEmpty = (value: unknown): boolean => {
  if (value === null || value === undefined) return true
  if (typeof value === 'string') return value.trim().length === 0
  if (Array.isArray(value)) return value.length === 0
  if (typeof value === 'object') return Object.keys(value).length === 0
  return false
}

/**
 * Safe JSON parse
 */
export const safeJsonParse = <T>(json: string, fallback: T): T => {
  try {
    return JSON.parse(json) as T
  } catch {
    return fallback
  }
}

/**
 * Copy text to clipboard
 */
export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}

/**
 * Check if code is running in browser
 */
export const isBrowser = (): boolean => {
  return typeof window !== 'undefined'
}

/**
 * Get base URL for API calls
 */
export const getBaseUrl = (): string => {
  if (isBrowser()) return window.location.origin
  return ''
}
