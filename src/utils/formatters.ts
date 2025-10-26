import { format, formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'

/**
 * Format date to readable string
 */
export const formatDate = (date: string | Date, formatStr = 'yyyy-MM-dd HH:mm:ss'): string => {
  return format(new Date(date), formatStr, { locale: ko })
}

/**
 * Format date to relative time (e.g., "3 hours ago")
 */
export const formatRelativeTime = (date: string | Date): string => {
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: ko })
}

/**
 * Format number with commas
 */
export const formatNumber = (num: number): string => {
  return num.toLocaleString('ko-KR')
}

/**
 * Format time remaining as HH:MM:SS
 */
export const formatTimeRemaining = (endTime: string): string => {
  const now = new Date().getTime()
  const end = new Date(endTime).getTime()
  const diff = end - now

  if (diff <= 0) {
    return '00:00:00'
  }

  const hours = Math.floor(diff / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((diff % (1000 * 60)) / 1000)

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

/**
 * Format interval (PostgreSQL interval) to readable time
 */
export const formatInterval = (interval: string): string => {
  // Parse interval string like "01:23:45" or "1 hour 23 minutes"
  const match = interval.match(/(\d+):(\d+):(\d+)/)
  if (match) {
    const [, hours, minutes, seconds] = match
    return `${hours}:${minutes}:${seconds}`
  }
  return interval
}

/**
 * Format score with sign (+ or -)
 */
export const formatScoreChange = (score: number): string => {
  return score > 0 ? `+${formatNumber(score)}` : String(formatNumber(score))
}

/**
 * Format percentile
 */
export const formatPercentile = (percentile: number): string => {
  return `${percentile.toFixed(1)}%`
}
