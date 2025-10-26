import type { FC } from 'react'
import { Space } from 'antd'
import { MainLayout } from '@/components/layout/MainLayout'
import { RoundTimer } from '@/components/game/RoundTimer'
import { CharacterCard } from '@/components/character/CharacterCard'
import { PromptInput } from '@/components/character/PromptInput'
import { LeaderboardList } from '@/components/leaderboard/LeaderboardList'
import { useCharacter } from '@/hooks/useCharacter'
import { useLeaderboard } from '@/hooks/useLeaderboard'
import { Loading } from '@/components/common/Loading'

export const Dashboard: FC = () => {
  const { character, isLoading: characterLoading } = useCharacter()
  const { leaderboard, isLoading: leaderboardLoading } = useLeaderboard(10)

  if (characterLoading) {
    return <Loading fullscreen tip="캐릭터 정보 로딩 중..." />
  }

  return (
    <MainLayout>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <RoundTimer />

        {character && (
          <>
            <CharacterCard character={character} />
            <PromptInput />
          </>
        )}

        <LeaderboardList
          data={leaderboard}
          loading={leaderboardLoading}
          currentUserId={character?.id}
        />
      </Space>
    </MainLayout>
  )
}
