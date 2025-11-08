import {
  ClockCircleOutlined,
  FileTextOutlined,
  TrophyOutlined,
  UserOutlined,
} from '@ant-design/icons'
import { useQuery } from '@tanstack/react-query'
import { Card, Col, Row, Space, Statistic, Typography } from 'antd'
import type { FC } from 'react'
import { Loading } from '@/components/common/Loading'
import { AdminLayout } from '@/components/layout/AdminLayout'
import { adminService } from '@/services/admin.service'

export const AdminDashboard: FC = () => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: () => adminService.getOverallStats(),
  })
  if (isLoading) {
    return <Loading fullscreen tip="통계 로딩 중..." />
  }

  return (
    <AdminLayout>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="총 사용자"
                value={stats?.totalUsers || 0}
                prefix={<UserOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="총 캐릭터"
                value={stats?.totalCharacters || 0}
                prefix={<TrophyOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="총 프롬프트"
                value={stats?.totalPrompts || 0}
                prefix={<FileTextOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="총 시련"
                value={stats?.totalRounds || 0}
                prefix={<ClockCircleOutlined />}
              />
            </Card>
          </Col>
        </Row>

        {stats?.activeRound && (
          <Card title="현재 활성 시련">
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12}>
                <Statistic title="시련 번호" value={stats.activeRound.roundNumber} />
              </Col>
              <Col xs={24} sm={12}>
                <Statistic title="참가자" value={stats.activeRound.participants || 0} suffix="명" />
              </Col>
            </Row>
            <Space direction="vertical" style={{ width: '100%', marginTop: 16 }}>
              <div>
                <Typography.Text strong>시작 시간: </Typography.Text>
                <Typography.Text>
                  {new Date(stats.activeRound.startTime).toLocaleString('ko-KR')}
                </Typography.Text>
              </div>
              <div>
                <Typography.Text strong>종료 시간: </Typography.Text>
                <Typography.Text>
                  {new Date(stats.activeRound.endTime).toLocaleString('ko-KR')}
                </Typography.Text>
              </div>
              <div>
                <Typography.Text strong>상태: </Typography.Text>
                <Typography.Text>{stats.activeRound.status}</Typography.Text>
              </div>
              {stats.activeRound.submissionRate !== undefined && (
                <div>
                  <Typography.Text strong>제출률: </Typography.Text>
                  <Typography.Text>
                    {(stats.activeRound.submissionRate * 100).toFixed(1)}%
                  </Typography.Text>
                </div>
              )}
            </Space>
          </Card>
        )}

        {stats?.recentActivity && (
          <Card title="최근 활동">
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12}>
                <Statistic
                  title="최근 1시간"
                  value={stats.recentActivity.last1Hour}
                  suffix="개 프롬프트"
                />
              </Col>
              <Col xs={24} sm={12}>
                <Statistic
                  title="최근 24시간"
                  value={stats.recentActivity.last24Hours}
                  suffix="개 프롬프트"
                />
              </Col>
            </Row>
          </Card>
        )}
      </Space>
    </AdminLayout>
  )
}
