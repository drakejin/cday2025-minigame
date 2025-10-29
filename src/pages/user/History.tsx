import type { FC } from 'react'
import { Card, List, Tag, Space, Typography } from 'antd'
import { MainLayout } from '@/components/layout/MainLayout'
import { useMyPrompts } from '@/hooks/queries/usePromptQuery'

const { Text } = Typography

export const History: FC = () => {
  const { data: history = [], isLoading: loading } = useMyPrompts(20, 0)

  return (
    <MainLayout>
      <Card title="내 프롬프트 히스토리" loading={loading}>
        <List
          dataSource={history}
          renderItem={(item) => (
            <List.Item>
              <List.Item.Meta
                title={
                  <Space>
                    <Tag color="blue">Round #{item.round_number}</Tag>
                    <Text strong>"{item.prompt}"</Text>
                  </Space>
                }
                description={
                  <Space size="large">
                    <Tag color="red">힘 +{item.strength_gained}</Tag>
                    <Tag color="blue">매력 +{item.charm_gained}</Tag>
                    <Tag color="green">창의 +{item.creativity_gained}</Tag>
                    <Tag>총점 +{item.total_score_gained}</Tag>
                  </Space>
                }
              />
              <Text type="secondary">{new Date(item.created_at).toLocaleString('ko-KR')}</Text>
            </List.Item>
          )}
          locale={{ emptyText: '아직 제출한 프롬프트가 없습니다' }}
        />
      </Card>
    </MainLayout>
  )
}
