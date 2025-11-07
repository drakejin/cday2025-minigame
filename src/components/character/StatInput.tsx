import { useState } from 'react'
import type { FC } from 'react'
import { Card, Typography, Space, Select, Button, Row, Col } from 'antd'
import { ThunderboltOutlined, RocketOutlined, HeartOutlined, BulbOutlined } from '@ant-design/icons'
import { useCurrentRound } from '@/hooks/queries/useGameQuery'

const { Title, Text } = Typography

const BASE_STATS = [15, 14, 12, 10]
const STAT_LABELS = [
  { key: 'str', label: 'STR (힘)', icon: ThunderboltOutlined, color: '#ef4444' },
  { key: 'dex', label: 'DEX (민첩)', icon: RocketOutlined, color: '#3b82f6' },
  { key: 'con', label: 'CON (체력)', icon: HeartOutlined, color: '#10b981' },
  { key: 'int', label: 'INT (지능)', icon: BulbOutlined, color: '#a855f7' },
]

const Trial1StatInput: FC = () => {
  const [assignments, setAssignments] = useState<Record<string, number | null>>({
    str: null,
    dex: null,
    con: null,
    int: null,
  })

  const availableValues = BASE_STATS.filter((val) => !Object.values(assignments).includes(val))

  const isComplete = Object.values(assignments).every((val) => val !== null)

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <Text>기본 능력치 [15, 14, 12, 10]을 4가지 능력치에 배정하세요</Text>
      {STAT_LABELS.map(({ key, label, icon: Icon, color }) => (
        <Row key={key} gutter={16} align="middle">
          <Col span={12}>
            <Space>
              <Icon style={{ color, fontSize: 16 }} />
              <Text>{label}</Text>
            </Space>
          </Col>
          <Col span={12}>
            <Select
              style={{ width: '100%' }}
              placeholder="선택"
              value={assignments[key]}
              onChange={(val) => setAssignments({ ...assignments, [key]: val })}
              options={[
                ...(assignments[key] ? [{ value: assignments[key], label: assignments[key] }] : []),
                ...availableValues.map((v) => ({ value: v, label: v })),
              ]}
            />
          </Col>
        </Row>
      ))}
      <Button type="primary" block disabled={!isComplete}>
        확정
      </Button>
    </Space>
  )
}

export const StatInput: FC = () => {
  const { data } = useCurrentRound()
  const currentRound = data?.currentRound

  if (!data?.currentRound?.trial_no) {
    return null
  }

  const { trial_no } = data.currentRound

  return (
    <Card
      style={{
        background: '#fff',
        border: '1px solid #e0e0e0',
        borderRadius: 8,
      }}
    >
      <div style={{ marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>
          능력치 입력
        </Title>
        <Text type="secondary" style={{ fontSize: 12 }}>
          Trial #{trial_no}
        </Text>
      </div>
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        {trial_no >= 1 && <Trial1StatInput />}
      </Space>
    </Card>
  )
}
