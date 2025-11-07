import { memo } from 'react'
import type { FC } from 'react'
import { Space, Typography, Tag, Divider } from 'antd'
import type { Character } from '@/types'

const { Title, Text } = Typography

interface CharacterCardProps {
  character: Character
}

export const CharacterCard: FC<CharacterCardProps> = memo(({ character }) => {
  return (
    <div
      style={{
        background: '#fff',
        border: '1px solid #e0e0e0',
        borderRadius: 8,
        padding: '20px',
      }}
    >
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        {/* Header */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>👤</div>
          <Title level={3} style={{ margin: 0 }}>
            캐릭터 카드
          </Title>
        </div>

        <Divider style={{ margin: 0 }} />

        {/* Character Info */}
        <div>
          <Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>
            키우고 있는 캐릭터
          </Text>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '12px',
              background: '#fafafa',
              borderRadius: 8,
            }}
          >
            <Text strong style={{ fontSize: 18 }}>
              {character.name}
            </Text>
            <Tag color="blue" style={{ fontSize: 14, padding: '4px 12px', margin: 0 }}>
              활성
            </Tag>
          </div>
        </div>

        {/* Current Prompt */}
        <div>
          <Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>
            사용 중인 프롬프트
          </Text>
          <div
            style={{
              padding: '12px',
              background: '#e6f4ff',
              border: '1px solid #91caff',
              borderRadius: 8,
              wordBreak: 'break-word',
            }}
          >
            <Text style={{ fontSize: 15 }}>"{character.current_prompt}"</Text>
          </div>
        </div>
      </Space>
    </div>
  )
})
