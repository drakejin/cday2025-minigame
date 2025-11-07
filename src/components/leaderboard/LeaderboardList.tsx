import type { FC } from 'react'
import { List, Tag, Space, Typography, Flex, Button, } from 'antd'
import { TrophyOutlined, FireOutlined, HeartOutlined, BulbOutlined } from '@ant-design/icons'
import type { LeaderboardEntry } from '@/types'
import { getRankColor } from '@/utils'

const { Text, Title } = Typography

interface LeaderboardListProps {
  data: LeaderboardEntry[]
  loading?: boolean
  currentUserId?: string
}

export const LeaderboardList: FC<LeaderboardListProps> = ({
  data,
  loading = false,
  currentUserId,
}) => {
  return (
    <>
      <Flex>
        <Title level={2}>순위</Title>
        <Button type="link" href="/award">
          award 페이지 이동
        </Button>
      </Flex>
      <List
        loading={loading}
        dataSource={data}
        grid={{ gutter: 16, column: 1 }}
        renderItem={(item: LeaderboardEntry) => {
          const isCurrentUser = item.character_id === currentUserId
          const rankColor = getRankColor(item.rank)

          return (
            <List.Item
              style={{
                background: isCurrentUser ? '#e6f7ff' : '#fff',
                border: isCurrentUser ? '2px solid #1890ff' : '1px solid #e0e0e0',
                borderRadius: 8,
                padding: '16px',
              }}
            >
              <Space direction="vertical" style={{ width: '100%' }} size="small">
                {/* Rank & Character Name */}
                <div
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <Space size="middle">
                    <Tag
                      color={item.rank <= 3 ? rankColor : 'default'}
                      style={{ fontSize: 16, padding: '4px 12px', margin: 0 }}
                      icon={item.rank <= 3 ? <TrophyOutlined /> : undefined}
                    >
                      #{item.rank}
                    </Tag>
                    <Text strong style={{ fontSize: 16 }}>
                      {item.character_name}
                    </Text>
                  </Space>
                  {isCurrentUser && (
                    <Tag color="blue" style={{ margin: 0 }}>
                      나
                    </Tag>
                  )}
                </div>

                {/* Display Name */}
                <div style={{ paddingLeft: 8 }}>
                  <Text type="secondary" style={{ fontSize: 13 }}>
                    {item.display_name}
                  </Text>
                </div>

                {/* Current Prompt */}
                {item.current_prompt && (
                  <div
                    style={{
                      padding: '8px 12px',
                      background: '#f5f5f5',
                      borderRadius: 4,
                      wordBreak: 'break-word',
                    }}
                  >
                    <Text style={{ fontSize: 13 }}>"{item.current_prompt}"</Text>
                  </div>
                )}

                {/* Stats */}
                <Space size="small" wrap style={{ width: '100%', justifyContent: 'space-between' }}>
                  <Space size="small" wrap>
                    <Tag color="red" icon={<FireOutlined />}>
                      힘 {item.strength}
                    </Tag>
                    <Tag color="blue" icon={<HeartOutlined />}>
                      매력 {item.charm}
                    </Tag>
                    <Tag color="green" icon={<BulbOutlined />}>
                      창의 {item.creativity}
                    </Tag>
                  </Space>
                  <Tag color="gold" style={{ fontSize: 14, padding: '4px 12px' }}>
                    총점 {item.total_score}
                  </Tag>
                </Space>
              </Space>
            </List.Item>
          )
        }}
        locale={{ emptyText: '아직 순위가 없습니다' }}
      />
    </>
  )
}
