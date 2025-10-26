import type { FC } from 'react'
import { Button, Typography, Space, Card, Row, Col } from 'antd'
import { TrophyOutlined, ClockCircleOutlined, RocketOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'

const { Title, Paragraph } = Typography

export const Landing: FC = () => {
  const navigate = useNavigate()

  return (
    <div style={{ minHeight: '100vh', padding: '24px', background: '#f0f2f5' }}>
      <Space
        direction="vertical"
        size="large"
        style={{ width: '100%', maxWidth: '1200px', margin: '0 auto' }}
      >
        {/* Hero Section */}
        <div style={{ textAlign: 'center', padding: '48px 0' }}>
          <Title level={1}>최강의 캐릭터를 만들어보세요</Title>
          <Paragraph style={{ fontSize: 18, marginBottom: 32 }}>
            1시간마다 30자 프롬프트로 캐릭터를 성장시키는 게임
          </Paragraph>
          <Space size="large">
            <Button type="primary" size="large" onClick={() => navigate('/signup')}>
              시작하기
            </Button>
            <Button size="large" onClick={() => navigate('/login')}>
              로그인
            </Button>
          </Space>
        </div>

        {/* How It Works */}
        <div>
          <Title level={2} style={{ textAlign: 'center', marginBottom: 32 }}>
            게임 방법
          </Title>
          <Row gutter={[24, 24]}>
            <Col xs={24} md={8}>
              <Card>
                <Space direction="vertical" style={{ width: '100%', textAlign: 'center' }}>
                  <RocketOutlined style={{ fontSize: 48, color: '#1890ff' }} />
                  <Title level={4}>1. 캐릭터 생성</Title>
                  <Paragraph>회원가입 후 나만의 캐릭터를 만드세요</Paragraph>
                </Space>
              </Card>
            </Col>

            <Col xs={24} md={8}>
              <Card>
                <Space direction="vertical" style={{ width: '100%', textAlign: 'center' }}>
                  <ClockCircleOutlined style={{ fontSize: 48, color: '#52c41a' }} />
                  <Title level={4}>2. 프롬프트 입력</Title>
                  <Paragraph>1시간마다 30자 프롬프트를 입력하여 성장</Paragraph>
                </Space>
              </Card>
            </Col>

            <Col xs={24} md={8}>
              <Card>
                <Space direction="vertical" style={{ width: '100%', textAlign: 'center' }}>
                  <TrophyOutlined style={{ fontSize: 48, color: '#faad14' }} />
                  <Title level={4}>3. 순위 확인</Title>
                  <Paragraph>리더보드에서 실시간 순위를 확인하세요</Paragraph>
                </Space>
              </Card>
            </Col>
          </Row>
        </div>

        {/* CTA */}
        <Card style={{ textAlign: 'center', marginTop: 32 }}>
          <Title level={3}>지금 시작하세요!</Title>
          <Button type="primary" size="large" onClick={() => navigate('/signup')}>
            무료 회원가입
          </Button>
        </Card>
      </Space>
    </div>
  )
}
