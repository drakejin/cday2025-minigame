import type { FC } from 'react'
import { List, Tag, Space, Typography } from 'antd'
import { MainLayout } from '@/components/layout/MainLayout'
import { useMyRoundHistory } from '@/hooks/queries/usePromptQuery'
import type { RoundHistory } from '@/types/game.types'
import { useMyTrials } from '@/hooks/queries/useMyTrialsQuery'

const { Text, Title } = Typography

export const History: FC = () => {
  const { data: history = [] } = useMyRoundHistory(20, 0)
  const { data: myTrials } = useMyTrials()

  return (
    <MainLayout>
      <Title level={2}>시련 히스토리</Title>
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
                      <Tag color="red">힘 +{item.strength_gained}</Tag>
                      <Tag color="blue">매력 +{item.charm_gained}</Tag>
                      <Tag color="green">창의 +{item.creativity_gained}</Tag>
                      <Tag color="gold">총점 +{item.total_score_gained}</Tag>
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
      <Title level={3} style={{ marginTop: 24 }}>
        시련 결과
      </Title>
      <List
        dataSource={myTrials?.trials || []}
        grid={{ gutter: 16, column: 1 }}
        renderItem={(item: any) => (
          <List.Item
            style={{
              background: '#fff',
              border: '1px solid #e0e0e0',
              borderRadius: 8,
              padding: '16px',
            }}
          >
            <Space direction="vertical" style={{ width: '100%' }} size="small">
              <div
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              >
                <Tag color="purple" style={{ margin: 0 }}>
                  Round #{item.round_number ?? '-'} · Trial {item.trial_no} (Lv.{item.level})
                </Tag>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {new Date(item.created_at).toLocaleString('ko-KR')}
                </Text>
              </div>
              <Space size="small" wrap>
                <Tag color="gold">가중 총점 +{item.weighted_total}</Tag>
                <Tag>원점수 +{item.total_score}</Tag>
              </Space>
            </Space>
          </List.Item>
        )}
        locale={{ emptyText: '아직 시련 결과가 없습니다' }}
      />
    </MainLayout>
  )
}
