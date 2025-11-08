import { EditOutlined, SendOutlined } from '@ant-design/icons'
import { Alert, Button, Space, Tag, Typography } from 'antd'
import type { FC } from 'react'
import { usePromptSubmit } from '@/hooks/usePromptSubmit'
import type { TrialData } from '@/pages/user/Dashboard'

const { Text, Title } = Typography

export const PromptInput: FC<{
  trialData: Record<number, TrialData>
  prompt: string
  onSubmitSuccess?: () => void
}> = ({ trialData, prompt, onSubmitSuccess }) => {
  const {
    submitPrompt,
    isSubmitting,
    error,
    hasSubmittedThisRound,
    canSubmit,
    currentRound,
    nextRound,
  } = usePromptSubmit()

  const handleSubmit = async () => {
    console.log('[handleSubmit] Called')
    console.log('[handleSubmit] prompt:', prompt)
    console.log('[handleSubmit] trialData:', trialData)
    console.log('[handleSubmit] currentRound:', currentRound)

    const finalPrompt = prompt.trim() || '성장하라'
    console.log('[handleSubmit] finalPrompt:', finalPrompt)

    if (!currentRound?.trial_no) {
      console.log('[handleSubmit] FAIL: no trial_no')
      return
    }

    // Validate all trials up to current trial_no
    for (let i = 1; i <= currentRound.trial_no; i++) {
      const trial = trialData[i]
      console.log(`[handleSubmit] Checking trial ${i}:`, trial)

      if (!trial) {
        console.log(`[handleSubmit] FAIL: no trial ${i}`)
        return
      }

      // Trial 1: validate base stats
      if (i === 1) {
        if (
          !trial.baseStats?.str ||
          !trial.baseStats?.dex ||
          !trial.baseStats?.con ||
          !trial.baseStats?.int
        ) {
          console.log('[handleSubmit] FAIL: trial 1 base stats', trial.baseStats)
          return
        }
      }

      // Trial 2+: validate bonus stats
      if (i >= 2) {
        if (!trial.bonusStats?.[0] || !trial.bonusStats?.[1]) {
          console.log(`[handleSubmit] FAIL: trial ${i} bonus stats`, trial.bonusStats)
          return
        }
      }
    }

    console.log('[handleSubmit] Validation passed, submitting...')
    const success = await submitPrompt(finalPrompt, trialData)
    console.log('[handleSubmit] Result:', success)

    if (success && onSubmitSuccess) {
      onSubmitSuccess()
    }
  }

  // Determine the state to display
  const getPromptState = () => {
    // 1. 활성 시련 있고, 이미 제출함
    if (currentRound && hasSubmittedThisRound) {
      return {
        type: 'submitted',
        title: '이번 시련 제출 완료',
        message: `Round #${currentRound.round_number}에 이미 참여하셨습니다. 다음 시련를 기다려주세요!`,
      }
    }

    // 2. 활성 시련 있음 (제출 가능)
    if (currentRound) {
      return {
        type: 'active',
        title: `Round #${currentRound.round_number} 진행 중`,
        message: '캐릭터를 성장시킬 프롬프트를 입력하세요',
      }
    }

    // 3. 다음 시련 대기 중
    if (nextRound) {
      return {
        type: 'waiting',
        title: '다음 시련 대기 중',
        message: `Round #${nextRound.round_number}가 시작되면 프롬프트를 입력할 수 있습니다`,
        nextStart: new Date(nextRound.start_time).toLocaleString('ko-KR'),
      }
    }

    // 4. 시련 없음
    return {
      type: 'no-round',
      title: '진행 중인 시련 없음',
      message: '새로운 시련가 시작될 때까지 기다려주세요',
    }
  }

  const state = getPromptState()

  return (
    <div
      style={{
        background: '#fff',
        border: '1px solid #e0e0e0',
        borderRadius: 8,
        padding: '20px',
      }}
    >
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Space>
            <EditOutlined style={{ fontSize: 20, color: '#1890ff' }} />
            <Title level={4} style={{ margin: 0 }}>
              프롬프트 제출
            </Title>
          </Space>
          {state.type === 'submitted' && (
            <Tag color="success" style={{ margin: 0 }}>
              제출 완료
            </Tag>
          )}
          {state.type === 'active' && (
            <Tag color="processing" style={{ margin: 0 }}>
              진행 중
            </Tag>
          )}
          {state.type === 'waiting' && (
            <Tag color="default" style={{ margin: 0 }}>
              대기 중
            </Tag>
          )}
        </div>

        {/* State Messages */}
        {state.type === 'submitted' && (
          <Alert message={state.title} description={state.message} type="success" showIcon />
        )}

        {state.type === 'waiting' && (
          <Alert
            message={state.title}
            description={
              <div>
                <div>{state.message}</div>
                <Text type="secondary" style={{ fontSize: 12, marginTop: 4, display: 'block' }}>
                  시작 예정: {state.nextStart}
                </Text>
              </div>
            }
            type="info"
            showIcon
          />
        )}

        {state.type === 'no-round' && (
          <Alert message={state.title} description={state.message} type="warning" showIcon />
        )}

        {/* Submit Button (only for active round) */}
        {state.type === 'active' && (
          <>
            {error && <Alert message={error} type="error" showIcon role="alert" />}
            <Button
              type="primary"
              icon={<SendOutlined />}
              onClick={handleSubmit}
              loading={isSubmitting}
              disabled={!canSubmit}
              aria-label="제출하기"
              block
              size="large"
            >
              제출하기
            </Button>
          </>
        )}
      </Space>
    </div>
  )
}
