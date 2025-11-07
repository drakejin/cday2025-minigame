import { type FC, useState } from 'react'
import { Button, Typography, Space, Card, Alert, Input, message } from 'antd'
import { SendOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { useCurrentRound } from '@/hooks/queries/useGameQuery'
import { useLeaderboard } from '@/hooks/queries/useLeaderboardQuery'
import { useMyCharacter, useCreateCharacter } from '@/hooks/queries/useCharacterQuery'
import { useSubmitPrompt } from '@/hooks/queries/usePromptQuery'
import { LeaderboardList } from '@/components/leaderboard/LeaderboardList'
import { GoogleLoginModal } from '@/components/auth/GoogleLoginModal'
import { RoundTimer } from '@/components/game/RoundTimer'

const { Title, Text } = Typography
const { TextArea } = Input

export const Home: FC = () => {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)

  const { data: roundData } = useCurrentRound()
  const currentRound = roundData?.currentRound
  const nextRound = roundData?.nextRound
  const { data: leaderboard, isLoading: leaderboardLoading } = useLeaderboard(10, 0)
  const { data: character } = useMyCharacter()
  const createCharacter = useCreateCharacter()
  const submitPrompt = useSubmitPrompt()

  const [characterName, setCharacterName] = useState('')
  const [prompt, setPrompt] = useState('')
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    // Check if user is logged in
    if (!user) {
      setShowLoginModal(true)
      return
    }

    // Validation
    if (characterName.trim().length === 0 && !character) {
      message.error('캐릭터 이름을 입력해주세요')
      return
    }

    if (prompt.trim().length === 0) {
      message.error('프롬프트를 입력해주세요')
      return
    }

    if (prompt.length > 30) {
      message.error('프롬프트는 최대 30자까지 입력 가능합니다')
      return
    }

    if (!currentRound) {
      message.error('현재 진행 중인 시련가 없습니다')
      return
    }

    setIsSubmitting(true)

    try {
      let characterId = character?.id

      // Create character if needed
      if (!character && characterName.trim()) {
        const result = await createCharacter.mutateAsync(characterName.trim())
        characterId = result.id
        message.success('캐릭터가 생성되었습니다!')
      }

      // Submit prompt
      if (characterId) {
        await submitPrompt.mutateAsync({
          characterId,
          prompt: prompt.trim(),
        })
        message.success('프롬프트가 제출되었습니다!')
        setPrompt('')
        setCharacterName('')

        // Redirect to dashboard after successful submission
        setTimeout(() => {
          navigate('/dashboard')
        }, 1000)
      }
    } catch (error) {
      console.error('Submission error:', error)
      const errorMessage = error instanceof Error ? error.message : '제출에 실패했습니다'
      message.error(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Check if user has already submitted this round
  // 비회원은 제출한 적이 없으므로 false
  const hasSubmittedThisRound =
    user && character ? character.last_submission_round === currentRound?.round_number : false
  return (
    <div style={{ minHeight: '100vh', padding: '16px', background: '#f0f2f5' }}>
      <Space
        direction="vertical"
        size="large"
        style={{ width: '100%', maxWidth: '1200px', margin: '0 auto' }}
      >
        {/* Title */}
        <div style={{ textAlign: 'center', padding: '24px 0' }}>
          <Title level={1} style={{ margin: 0, fontSize: '48px', fontWeight: 'bold' }}>
            Character Battle
          </Title>
        </div>

        {/* Round Timer */}
        <RoundTimer />

        {/* No Round Alert */}
        {!currentRound && (
          <Alert
            message="현재 진행 중인 시련가 없습니다"
            description={
              nextRound
                ? `다음 시련(#${nextRound.round_number})는 ${new Date(nextRound.start_time).toLocaleString('ko-KR')}에 시작됩니다!`
                : '새로운 시련가 시작될 때까지 기다려주세요!'
            }
            type="info"
            showIcon
          />
        )}

        {/* Login Section for Non-authenticated Users */}
        {!user && (
          <Card
            title="로그인하고 게임 시작하기"
            style={{ background: '#fff7e6', borderColor: '#ffd591' }}
          >
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <Alert
                message="Google 계정으로 로그인하세요"
                description="로그인하면 캐릭터를 생성하고 프롬프트를 제출하여 게임에 참가할 수 있습니다."
                type="warning"
                showIcon
              />
              <Button
                type="primary"
                size="large"
                block
                onClick={() => setShowLoginModal(true)}
                style={{ height: 48, fontSize: 16 }}
              >
                Google로 로그인하기
              </Button>
            </Space>
          </Card>
        )}

        {/* Quick Join Section */}
        {currentRound && !hasSubmittedThisRound && user && (
          <Card
            title="바로 게임 참가하기"
            style={{ background: '#e6f4ff', borderColor: '#91caff' }}
          >
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              {!character && (
                <div>
                  <Text strong style={{ display: 'block', marginBottom: 8 }}>
                    캐릭터 이름
                  </Text>
                  <Input
                    placeholder="캐릭터 이름을 입력하세요"
                    value={characterName}
                    onChange={(e) => setCharacterName(e.target.value)}
                    maxLength={20}
                    size="large"
                    disabled={isSubmitting}
                  />
                </div>
              )}

              <div>
                <Text strong style={{ display: 'block', marginBottom: 8 }}>
                  프롬프트 (최대 30자)
                </Text>
                <TextArea
                  placeholder="캐릭터를 성장시킬 프롬프트를 입력하세요"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  maxLength={30}
                  rows={3}
                  size="large"
                  disabled={isSubmitting}
                />
                <Text type="secondary" style={{ display: 'block', marginTop: 8 }}>
                  {prompt.length}/30자
                </Text>
              </div>

              <Button
                type="primary"
                icon={<SendOutlined />}
                onClick={handleSubmit}
                loading={isSubmitting}
                block
                size="large"
                style={{ height: 48, fontSize: 16 }}
              >
                {character ? '프롬프트 제출' : '캐릭터 생성 & 프롬프트 제출'}
              </Button>
            </Space>
          </Card>
        )}

        {/* Already Submitted Alert */}
        {hasSubmittedThisRound && (
          <Alert
            message="이번 시련에 이미 참가했습니다"
            description="다음 시련를 기다려주세요!"
            type="success"
            showIcon
          />
        )}

        {/* Leaderboard */}
        <LeaderboardList data={leaderboard?.data || []} loading={leaderboardLoading} />
      </Space>

      {/* Google Login Modal */}
      <GoogleLoginModal open={showLoginModal} onCancel={() => setShowLoginModal(false)} />
    </div>
  )
}
