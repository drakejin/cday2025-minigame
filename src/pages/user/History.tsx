import { InfoCircleOutlined } from '@ant-design/icons'
import { Button, List, Space, Tag, Typography } from 'antd'
import { type FC, useState } from 'react'
import { GameRuleModal } from '@/components/common/GameRuleModal'
import { MainLayout } from '@/components/layout/MainLayout'
import { useMyRoundHistory } from '@/hooks/queries/usePromptQuery'
import type { RoundHistory } from '@/types/game.types'

const { Text, Title } = Typography

export const History: FC = () => {
  const { data: history = [] } = useMyRoundHistory(20, 0)
  const [showGameRuleModal, setShowGameRuleModal] = useState(false)

  return (
    <MainLayout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={2} style={{ margin: 0 }}>
          시련 히스토리
        </Title>
        <Button
          type="text"
          icon={<InfoCircleOutlined />}
          onClick={() => setShowGameRuleModal(true)}
          style={{ fontSize: 20 }}
        >
          게임가이드
        </Button>
      </div>
      <List
        dataSource={history}
        grid={{ gutter: 16, column: 1 }}
        renderItem={(item: RoundHistory) => (
          <List.Item
            style={{
              background: '#fff',
              border: '1px solid #e0e0e0',
              borderRadius: 8,
              padding: '16px',
            }}
          >
            <Space direction="vertical" style={{ width: '100%' }} size="small">
              {/* Round Number */}
              <div
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              >
                <Tag color={item.participated ? 'blue' : 'default'} style={{ margin: 0 }}>
                  Round #{item.round_number}
                </Tag>
                {/* Round Period */}
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {new Date(item.round_start_time).toLocaleTimeString('ko-KR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}{' '}
                  ~{' '}
                  {new Date(item.round_end_time).toLocaleTimeString('ko-KR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </div>

              {/* Prompt or Not Participated */}
              {item.participated ? (
                <>
                  <div
                    style={{
                      padding: '8px 12px',
                      background: '#f5f5f5',
                      borderRadius: 4,
                      wordBreak: 'break-word',
                    }}
                  >
                    <Text>"{item.prompt}"</Text>
                  </div>

                  {/* Score Gained & Submission Time */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-end',
                    }}
                  >
                    <Space size="small" wrap>
                      <Tag color="red">STR +{item.str || 0}</Tag>
                      <Tag color="blue">DEX +{item.dex || 0}</Tag>
                      <Tag color="green">CON +{item.con || 0}</Tag>
                      <Tag color="purple">INT +{item.int || 0}</Tag>
                    </Space>
                  </div>
                </>
              ) : (
                <Text type="secondary">참가하지 않음</Text>
              )}
              {item.participated ? (
                <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                  <Text type="secondary" style={{ fontSize: 11, whiteSpace: 'nowrap' }}>
                    제출:
                  </Text>
                  <Text
                    type="secondary"
                    style={{ fontSize: 11, whiteSpace: 'nowrap', width: '130px' }}
                  >
                    {item.created_at ? new Date(item.created_at).toLocaleString('ko-KR') : ''}
                  </Text>
                </div>
              ) : null}
            </Space>
          </List.Item>
        )}
        locale={{ emptyText: '아직 진행된 시련가 없습니다' }}
      />
      <GameRuleModal open={showGameRuleModal} onClose={() => setShowGameRuleModal(false)} />
    </MainLayout>
  )
}
