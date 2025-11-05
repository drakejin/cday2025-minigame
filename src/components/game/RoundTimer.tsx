import { memo } from 'react'
import type { FC } from 'react'
import { Space, Tag, Typography } from 'antd'
import { ClockCircleOutlined } from '@ant-design/icons'
import { useRoundTimer } from '@/hooks/useRoundTimer'

const { Text, Title } = Typography

export const RoundTimer: FC = memo(() => {
  const { currentRound, timeRemaining, isRoundActive } = useRoundTimer()

  if (!currentRound) {
    return (
      <div
        style={{
          background: '#fff',
          border: '1px solid #e0e0e0',
          borderRadius: 8,
          padding: '16px',
          textAlign: 'center',
        }}
      >
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <ClockCircleOutlined style={{ fontSize: 48, color: '#d9d9d9' }} />
          <Title level={4} style={{ margin: 0 }}>
            활성 라운드 없음
          </Title>
          <Text type="secondary">대기 중</Text>
        </Space>
      </div>
    )
  }

  return (
    <div
      style={{
        background: '#fff',
        border: '1px solid #e0e0e0',
        borderRadius: 8,
        padding: '16px',
      }}
    >
      <Space direction="vertical" style={{ width: '100%' }} size="middle">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Space>
            <ClockCircleOutlined style={{ fontSize: 20, color: '#1890ff' }} />
            <Title level={4} style={{ margin: 0 }}>
              Round #{currentRound.round_number}
            </Title>
          </Space>
          <Tag color={isRoundActive ? 'blue' : 'default'} style={{ margin: 0 }}>
            {isRoundActive ? '진행 중' : currentRound.status}
          </Tag>
        </div>

        {isRoundActive && (
          <div style={{ textAlign: 'center', padding: '12px 0' }}>
            <Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>
              남은 시간
            </Text>
            <Text
              style={{
                fontSize: 32,
                fontWeight: 'bold',
                color: '#1890ff',
                display: 'block',
              }}
            >
              {timeRemaining}
            </Text>
          </div>
        )}
      </Space>
    </div>
  )
})
