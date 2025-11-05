import { memo } from 'react'
import type { FC } from 'react'
import { Space, Typography, Progress, Tag } from 'antd'
import { TrophyOutlined, FireOutlined, HeartOutlined, BulbOutlined } from '@ant-design/icons'
import type { Character } from '@/types'

const { Title, Text } = Typography

interface CharacterCardProps {
  character: Character
}

export const CharacterCard: FC<CharacterCardProps> = memo(({ character }) => {
  const maxScore = 500

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
        {/* Character Name & Total Score */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Space>
            <TrophyOutlined style={{ fontSize: 20, color: '#faad14' }} />
            <Title level={4} style={{ margin: 0 }}>
              {character.name}
            </Title>
          </Space>
          <Tag color="gold" style={{ fontSize: 14, padding: '4px 12px', margin: 0 }}>
            총점 {character.total_score}
          </Tag>
        </div>

        {/* Current Prompt */}
        <div>
          <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
            현재 프롬프트
          </Text>
          <div
            style={{
              padding: '8px 12px',
              background: '#f5f5f5',
              borderRadius: 4,
              wordBreak: 'break-word',
            }}
          >
            <Text style={{ fontSize: 14 }}>"{character.current_prompt}"</Text>
          </div>
        </div>

        {/* Stats with Progress Bars */}
        <div>
          <Space direction="vertical" style={{ width: '100%' }} size="small">
            {/* Strength */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <Space size="small">
                  <FireOutlined style={{ color: '#ef4444' }} />
                  <Text style={{ fontSize: 13 }}>힘</Text>
                </Space>
                <Text strong style={{ fontSize: 13 }}>
                  {character.strength}
                </Text>
              </div>
              <Progress
                percent={(character.strength / maxScore) * 100}
                strokeColor="#ef4444"
                showInfo={false}
                size="small"
              />
            </div>

            {/* Charm */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <Space size="small">
                  <HeartOutlined style={{ color: '#3b82f6' }} />
                  <Text style={{ fontSize: 13 }}>매력</Text>
                </Space>
                <Text strong style={{ fontSize: 13 }}>
                  {character.charm}
                </Text>
              </div>
              <Progress
                percent={(character.charm / maxScore) * 100}
                strokeColor="#3b82f6"
                showInfo={false}
                size="small"
              />
            </div>

            {/* Creativity */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <Space size="small">
                  <BulbOutlined style={{ color: '#10b981' }} />
                  <Text style={{ fontSize: 13 }}>창의성</Text>
                </Space>
                <Text strong style={{ fontSize: 13 }}>
                  {character.creativity}
                </Text>
              </div>
              <Progress
                percent={(character.creativity / maxScore) * 100}
                strokeColor="#10b981"
                showInfo={false}
                size="small"
              />
            </div>
          </Space>
        </div>
      </Space>
    </div>
  )
})
