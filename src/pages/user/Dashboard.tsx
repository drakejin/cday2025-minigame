import type { FC } from 'react'
import { Space, Typography } from 'antd'
import { MainLayout } from '@/components/layout/MainLayout'
import { RoundTimer } from '@/components/game/RoundTimer'
import { CharacterCard } from '@/components/character/CharacterCard'
import { CharacterCreationForm } from '@/components/character/CharacterCreationForm'
import { PromptInput } from '@/components/character/PromptInput'
import { useMyCharacter } from '@/hooks/queries/useCharacterQuery'
import { Loading } from '@/components/common/Loading'
import { useRealtimeRound } from '@/hooks/useRealtimeRound'

const { Title } = Typography

export const Dashboard: FC = () => {
  const { data: character, isLoading: characterLoading } = useMyCharacter()

  // Subscribe to real-time updates
  useRealtimeRound()

  if (characterLoading) {
    return <Loading fullscreen tip="캐릭터 정보 로딩 중..." />
  }

  return (
    <MainLayout>
      <Title level={2}>게임</Title>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <RoundTimer />
        {character ? (
          <>
            <CharacterCard character={character} />
            <PromptInput />
          </>
        ) : (
          <CharacterCreationForm />
        )}
      </Space>
    </MainLayout>
  )
}
