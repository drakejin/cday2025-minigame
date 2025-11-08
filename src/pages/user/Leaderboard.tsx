import { InfoCircleOutlined } from '@ant-design/icons'
import { Button } from 'antd'
import { type FC, useState } from 'react'
import { GameRuleModal } from '@/components/common/GameRuleModal'
import { MainLayout } from '@/components/layout/MainLayout'
import { LeaderboardList } from '@/components/leaderboard/LeaderboardList'
import { useMyCharacter } from '@/hooks/queries/useCharacterQuery'
import { useLeaderboard } from '@/hooks/queries/useLeaderboardQuery'
import { useRealtimeLeaderboard } from '@/hooks/useRealtimeLeaderboard'

export const Leaderboard: FC = () => {
  const { data: leaderboard, isLoading } = useLeaderboard(100, 0)
  const { data: character } = useMyCharacter()
  const [showGameRuleModal, setShowGameRuleModal] = useState(false)

  // Subscribe to real-time leaderboard updates
  useRealtimeLeaderboard()

  return (
    <MainLayout>
      <div style={{ position: 'relative' }}>
        <Button
          type="text"
          icon={<InfoCircleOutlined />}
          onClick={() => setShowGameRuleModal(true)}
          style={{
            position: 'absolute',
            top: -8,
            right: 0,
            fontSize: 20,
            zIndex: 10,
          }}
        />
        <LeaderboardList
          data={leaderboard?.data || []}
          loading={isLoading}
          currentUserId={character?.id}
        />
      </div>
      <GameRuleModal open={showGameRuleModal} onClose={() => setShowGameRuleModal(false)} />
    </MainLayout>
  )
}
