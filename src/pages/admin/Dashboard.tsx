import type { FC } from 'react'
import { Card, Col, Row, Statistic, Space, Typography, Alert, Button } from 'antd'
import {
  UserOutlined,
  TrophyOutlined,
  FileTextOutlined,
  ClockCircleOutlined,
  BarChartOutlined,
  FileSearchOutlined,
  TeamOutlined,
  AuditOutlined,
  ArrowRightOutlined,
} from '@ant-design/icons'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { MainLayout } from '@/components/layout/MainLayout'
import { adminService } from '@/services/admin.service'
import { Loading } from '@/components/common/Loading'

const { Title } = Typography

export const AdminDashboard: FC = () => {
  const navigate = useNavigate()
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: () => adminService.getOverallStats(),
  })

  if (isLoading) {
    return <Loading fullscreen tip="통계 로딩 중..." />
  }

  const menuItems = [
    {
      title: '라운드 관리',
      description: '라운드 생성, 시작, 종료 및 관리',
      icon: <ClockCircleOutlined style={{ fontSize: 32 }} />,
      path: '/admin/rounds',
      color: '#1890ff',
    },
    {
      title: '프롬프트 관리',
      description: '프롬프트 모니터링 및 삭제',
      icon: <FileSearchOutlined style={{ fontSize: 32 }} />,
      path: '/admin/prompts',
      color: '#722ed1',
    },
    {
      title: '사용자 관리',
      description: '사용자 검색 및 제재 관리',
      icon: <TeamOutlined style={{ fontSize: 32 }} />,
      path: '/admin/users',
      color: '#13c2c2',
    },
    {
      title: '통계 분석',
      description: '라운드별, 사용자별 통계',
      icon: <BarChartOutlined style={{ fontSize: 32 }} />,
      path: '/admin/statistics',
      color: '#52c41a',
    },
    {
      title: '활동 로그',
      description: '관리자 활동 기록 조회',
      icon: <AuditOutlined style={{ fontSize: 32 }} />,
      path: '/admin/audit',
      color: '#fa8c16',
    },
  ]

  return (
    <MainLayout>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <div>
          <Title level={2}>Admin Dashboard</Title>
          <Alert
            message="관리자 페이지"
            description="게임 관리 및 모니터링을 위한 관리자 대시보드입니다."
            type="info"
            showIcon
            style={{ marginBottom: 24 }}
          />
        </div>

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
                title="총 라운드"
                value={stats?.totalRounds || 0}
                prefix={<ClockCircleOutlined />}
              />
            </Card>
          </Col>
        </Row>

        {stats?.activeRound && (
          <Card title="현재 활성 라운드">
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12}>
                <Statistic title="라운드 번호" value={stats.activeRound.roundNumber} />
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

        <Card title="관리 메뉴">
          <Row gutter={[16, 16]}>
            {menuItems.map((item) => (
              <Col xs={24} sm={12} md={8} key={item.path}>
                <Card
                  hoverable
                  onClick={() => navigate(item.path)}
                  style={{ height: '100%', cursor: 'pointer' }}
                >
                  <Space direction="vertical" style={{ width: '100%' }} size="middle">
                    <div style={{ color: item.color }}>{item.icon}</div>
                    <Title level={4} style={{ margin: 0 }}>
                      {item.title}
                    </Title>
                    <Typography.Text type="secondary">{item.description}</Typography.Text>
                    <Button type="link" icon={<ArrowRightOutlined />}>
                      이동하기
                    </Button>
                  </Space>
                </Card>
              </Col>
            ))}
          </Row>
        </Card>
      </Space>
    </MainLayout>
  )
}
