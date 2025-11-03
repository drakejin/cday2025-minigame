import type { FC } from 'react'
import { LeaderboardList } from '@/components/leaderboard/LeaderboardList'
import { MainLayout } from '@/components/layout/MainLayout'
import { useLeaderboard } from '@/hooks/queries/useLeaderboardQuery'
import { useMyCharacter } from '@/hooks/queries/useCharacterQuery'
import { useRealtimeLeaderboard } from '@/hooks/useRealtimeLeaderboard'

export const Leaderboard: FC = () => {
  const { data: leaderboard, isLoading } = useLeaderboard(100)
  const { data: character } = useMyCharacter()

  // Subscribe to real-time leaderboard updates
  useRealtimeLeaderboard()

  return (
    <MainLayout>
      <LeaderboardList
        data={(leaderboard as any) || []}
        loading={isLoading}
        currentUserId={character?.id}
      />
    </MainLayout>
  )
}
