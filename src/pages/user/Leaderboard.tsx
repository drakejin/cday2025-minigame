import type { FC } from 'react'
import { MainLayout } from '@/components/layout/MainLayout'
import { LeaderboardList } from '@/components/leaderboard/LeaderboardList'
import { useLeaderboard } from '@/hooks/useLeaderboard'
import { useCharacter } from '@/hooks/useCharacter'

export const Leaderboard: FC = () => {
  const { leaderboard, isLoading } = useLeaderboard(100)
  const { character } = useCharacter()

  return (
    <MainLayout>
      <LeaderboardList data={leaderboard} loading={isLoading} currentUserId={character?.id} />
    </MainLayout>
  )
}
