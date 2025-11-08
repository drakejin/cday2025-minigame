import { List, Space, Tag, Typography } from 'antd'
import type { FC } from 'react'
import { memo } from 'react'
import type { LeaderboardEntry } from '@/types'
import { getRankColor } from '@/utils'

const { Text } = Typography

interface LeaderboardItemProps {
  entry: LeaderboardEntry
  isCurrentUser?: boolean
}

export const LeaderboardItem: FC<LeaderboardItemProps> = memo(
  ({ entry, isCurrentUser = false }) => {
    const rankColor = getRankColor(entry.rank)

    return (
      <List.Item
        style={{
          background: isCurrentUser ? '#e6f7ff' : 'transparent',
          borderRadius: 8,
        }}
      >
        <List.Item.Meta
          avatar={
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <Tag color={entry.rank <= 3 ? rankColor : 'default'} style={{ fontSize: 16 }}>
                #{entry.rank}
              </Tag>
              <Text strong>{entry.display_name}</Text>
              <Text strong>Score: {entry.total_score}</Text>
            </div>
          }
          title={<Space>{entry.character_name}</Space>}
          description={
            <Space direction="vertical" size={4}>
              <Text type="secondary" ellipsis>
                "{entry.current_prompt}"
              </Text>
              <div style={{ textAlign: 'right' }}></div>
            </Space>
          }
        />
      </List.Item>
    )
  }
)
