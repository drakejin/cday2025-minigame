import { useState, useEffect } from 'react'
import { useCurrentRound } from './queries/useGameQuery'

/**
 * Hook for displaying round timer
 * Calculates remaining time and updates every second
 */
export const useRoundTimer = () => {
  const { data } = useCurrentRound()
  const currentRound = data?.currentRound
  const nextRound = data?.nextRound
  const [timeRemaining, setTimeRemaining] = useState<string>('')

  const isRoundActive = currentRound?.status === 'active'

  useEffect(() => {
    if (!currentRound || !isRoundActive) {
      setTimeRemaining('')
      return
    }

    const updateTimer = () => {
      const endTime = new Date(currentRound.end_time).getTime()
      const now = Date.now()
      const diff = endTime - now

      if (diff <= 0) {
        setTimeRemaining('시련 종료')
        return
      }

      const hours = Math.floor(diff / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((diff % (1000 * 60)) / 1000)

      setTimeRemaining(
        `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
      )
    }

    // Update immediately
    updateTimer()

    // Update every second
    const interval = setInterval(updateTimer, 1000)

    return () => clearInterval(interval)
  }, [currentRound, isRoundActive])

  return {
    currentRound,
    nextRound,
    timeRemaining,
    isRoundActive,
  }
}
