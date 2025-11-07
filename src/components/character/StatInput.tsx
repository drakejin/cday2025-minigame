import type { FC } from 'react'
import { Card, Typography, Alert, Space } from 'antd'
import { useCurrentRound } from '@/hooks/queries/useGameQuery'

const { Title, Text } = Typography

const TRIAL_CONFIGS = [
  {
    title: 'Trial 1: 기본 능력치 설정',
    description: '첫 번째 시련입니다. 프롬프트를 제출하면 기본 능력치가 부여됩니다.',
  },
  {
    title: 'Trial 2: 능력치 강화',
    description: '두 번째 시련입니다. 프롬프트를 통해 능력치를 강화하세요.',
  },
  {
    title: 'Trial 3: 최종 진화',
    description: '마지막 시련입니다. 최종 진화를 위한 프롬프트를 입력하세요.',
  },
]

export const StatInput: FC = () => {
  const { data } = useCurrentRound()
  const currentRound = data?.currentRound

  if (!currentRound?.trial_no) {
    return null
  }

  const { trial_no } = currentRound

  return (
    <Card
      style={{
        background: '#fff',
        border: '1px solid #e0e0e0',
        borderRadius: 8,
      }}
    >
      <div style={{ marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>
          능력치 입력
        </Title>
        <Text type="secondary" style={{ fontSize: 12 }}>
          Trial #{trial_no}
        </Text>
      </div>
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        {Array.from({ length: Math.min(trial_no, TRIAL_CONFIGS.length) }, (_, i) => (
          <Alert
            key={i + 1}
            message={TRIAL_CONFIGS[i].title}
            description={TRIAL_CONFIGS[i].description}
            type="info"
            showIcon
          />
        ))}
      </Space>
    </Card>
  )
}
