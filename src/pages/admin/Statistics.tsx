import { BarChartOutlined, TeamOutlined, TrophyOutlined, UserOutlined } from '@ant-design/icons'
import type { FC } from 'react'
import { useState } from 'react'
import { Card, Col, Row, Select, Space, Statistic, Table, Typography } from 'antd'
import { useQuery } from '@tanstack/react-query'
import { MainLayout } from '@/components/layout/MainLayout'
import { adminService } from '@/services/admin.service'
import type { UserStat } from '@/types/admin.types'

const { Title } = Typography

export const Statistics: FC = () => {
  const [selectedRoundId, setSelectedRoundId] = useState<string | null>(null)

  // Fetch overall stats
  const { data: overallStats, isLoading: isLoadingOverall } = useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: () => adminService.getStats(),
  })

  // Fetch rounds for dropdown
  const { data: roundsData } = useQuery({
    queryKey: ['admin', 'rounds'],
    queryFn: () => adminService.getRounds(),
  })

  // Fetch round-specific stats
  const { data: roundStats, isLoading: isLoadingRound } = useQuery({
    queryKey: ['admin', 'stats', 'rounds', selectedRoundId],
    queryFn: () => {
      if (!selectedRoundId) throw new Error('Round ID is required')
      return adminService.getRoundStatsByRoundId(selectedRoundId)
    },
    enabled: !!selectedRoundId,
  })

  // Fetch user stats
  const { data: userStats, isLoading: isLoadingUsers } = useQuery({
    queryKey: ['admin', 'stats', 'users'],
    queryFn: () => adminService.getUserStats({ limit: 50 }),
  })

  return (
    <MainLayout>
      <div style={{ padding: 24 }}>
        <Title level={2}>통계 및 분석</Title>

        {/* Overall Statistics */}
        <Title level={4} style={{ marginTop: 24 }}>
          전체 통계
        </Title>
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} md={6}>
            <Card loading={isLoadingOverall}>
              <Statistic
                title="총 사용자"
                value={overallStats?.total_users || 0}
                prefix={<TeamOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card loading={isLoadingOverall}>
              <Statistic
                title="활성 사용자"
                value={overallStats?.active_users || 0}
                prefix={<UserOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card loading={isLoadingOverall}>
              <Statistic
                title="총 라운드"
                value={overallStats?.total_rounds || 0}
                prefix={<TrophyOutlined />}
                valueStyle={{ color: '#722ed1' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card loading={isLoadingOverall}>
              <Statistic
                title="총 프롬프트"
                value={overallStats?.total_prompts || 0}
                prefix={<BarChartOutlined />}
                valueStyle={{ color: '#fa8c16' }}
              />
            </Card>
          </Col>
        </Row>


        {/* Round Statistics */}
        <Title level={4} style={{ marginTop: 32 }}>
          라운드별 통계
        </Title>
        <Card style={{ marginBottom: 24 }}>
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            <Select
              placeholder="라운드 선택"
              value={selectedRoundId}
              onChange={setSelectedRoundId}
              style={{ width: 200 }}
              loading={!roundsData}
            >
              {roundsData?.rounds?.map(
                (round: { id: string; roundNumber: number; status: string }) => (
                  <Select.Option key={round.id} value={round.id}>
                    Round {round.roundNumber} ({round.status})
                  </Select.Option>
                )
              )}
            </Select>

            {roundStats && (
              <Row gutter={[16, 16]}>
                <Col xs={24} sm={12} md={8}>
                  <Card>
                    <Statistic
                      title="참여자 수"
                      value={roundStats.stats.uniqueUsers}
                      prefix={<UserOutlined />}
                    />
                  </Card>
                </Col>
                <Col xs={24} sm={12} md={8}>
                  <Card>
                    <Statistic
                      title="제출 프롬프트"
                      value={roundStats.stats.totalPrompts}
                      prefix={<BarChartOutlined />}
                    />
                  </Card>
                </Col>
                <Col xs={24} sm={12} md={8}>
                  <Card>
                    <Statistic
                      title="평균 점수"
                      value={roundStats.stats.averageScores.total}
                      precision={2}
                      suffix="점"
                    />
                  </Card>
                </Col>
              </Row>
            )}

            {isLoadingRound && selectedRoundId && (
              <div style={{ textAlign: 'center', padding: 40 }}>로딩 중...</div>
            )}

            {!selectedRoundId && (
              <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>
                라운드를 선택하세요
              </div>
            )}
          </Space>
        </Card>

        {/* Top Users Statistics */}
        <Title level={4} style={{ marginTop: 32 }}>
          사용자 통계 (상위 50명)
        </Title>
        <Card>
          <Table
            dataSource={userStats?.users}
            rowKey="userId"
            loading={isLoadingUsers}
            pagination={{
              pageSize: 20,
              showSizeChanger: true,
              showTotal: (total) => `총 ${total}명`,
            }}
            columns={[
              {
                title: '순위',
                key: 'rank',
                width: 80,
                render: (_value: unknown, _record: UserStat, index: number) => index + 1,
              },
              {
                title: '이메일',
                dataIndex: 'email',
                key: 'email',
                ellipsis: true,
              },
              {
                title: '캐릭터 수',
                dataIndex: 'characterCount',
                key: 'characterCount',
                width: 100,
                align: 'center' as const,
                sorter: (a: UserStat, b: UserStat) => a.characterCount - b.characterCount,
              },
              {
                title: '프롬프트 수',
                dataIndex: 'promptCount',
                key: 'promptCount',
                width: 120,
                align: 'center' as const,
                sorter: (a: UserStat, b: UserStat) => a.promptCount - b.promptCount,
              },
              {
                title: '평균 점수 변동',
                dataIndex: 'avgScoreChange',
                key: 'avgScoreChange',
                width: 140,
                align: 'center' as const,
                render: (score: number) => (
                  <span style={{ color: score >= 0 ? '#52c41a' : '#ff4d4f', fontWeight: 'bold' }}>
                    {score >= 0 ? '+' : ''}
                    {score.toFixed(2)}
                  </span>
                ),
                sorter: (a: UserStat, b: UserStat) => a.avgScoreChange - b.avgScoreChange,
              },
              {
                title: '최고 점수',
                dataIndex: 'maxScore',
                key: 'maxScore',
                width: 100,
                align: 'center' as const,
                render: (score: number) => <strong>{score}</strong>,
                sorter: (a: UserStat, b: UserStat) => a.maxScore - b.maxScore,
              },
              {
                title: '가입일',
                dataIndex: 'createdAt',
                key: 'createdAt',
                width: 120,
                render: (date: string) => new Date(date).toLocaleDateString('ko-KR'),
                sorter: (a: UserStat, b: UserStat) =>
                  new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
              },
            ]}
          />
        </Card>
      </div>
    </MainLayout>
  )
}
