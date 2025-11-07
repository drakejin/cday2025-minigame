import type { FC } from 'react'
import { Card, Typography, Space, Select, Input, Row, Col, Divider } from 'antd'
import { ThunderboltOutlined, RocketOutlined, HeartOutlined, BulbOutlined } from '@ant-design/icons'
import { useCurrentRound } from '@/hooks/queries/useGameQuery'
import type { TrialData } from '@/pages/user/Dashboard'

const { Title, Text } = Typography
const { TextArea } = Input

const BASE_STATS = [15, 14, 12, 10]
const STAT_LABELS = [
  { key: 'str', label: 'STR (힘)', icon: ThunderboltOutlined, color: '#ef4444' },
  { key: 'dex', label: 'DEX (민첩)', icon: RocketOutlined, color: '#3b82f6' },
  { key: 'con', label: 'CON (체력)', icon: HeartOutlined, color: '#10b981' },
  { key: 'int', label: 'INT (지능)', icon: BulbOutlined, color: '#a855f7' },
]

const TrialInput: FC<{
  trialNo: number
  data: TrialData
  onChange: (data: TrialData) => void
}> = ({ trialNo, data, onChange }) => {
  const baseStats: Record<string, number | null> = data.baseStats || {
    str: null,
    dex: null,
    con: null,
    int: null,
  }
  const bonusStats: [string | null, string | null] = data.bonusStats || [null, null]
  const skill = data.skill || ''

  const setBaseStats = (stats: Record<string, number | null>) =>
    onChange({ ...data, baseStats: stats })
  const setBonusStats = (stats: [string | null, string | null]) =>
    onChange({ ...data, bonusStats: stats })
  const setSkill = (s: string) => onChange({ ...data, skill: s })

  const availableBaseValues = BASE_STATS.filter((val) => !Object.values(baseStats).includes(val))
  const availableBonusStats = STAT_LABELS.map((s) => s.key).filter(
    (key) => !bonusStats.includes(key)
  )

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <Text strong>Trial {trialNo}</Text>

      {trialNo === 1 && (
        <>
          <Text>기본 능력치 [15, 14, 12, 10] 배정</Text>
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
                  value={baseStats[key]}
                  onChange={(val) => setBaseStats({ ...baseStats, [key]: val })}
                  options={[
                    ...(baseStats[key] ? [{ value: baseStats[key], label: baseStats[key] }] : []),
                    ...availableBaseValues.map((v) => ({ value: v, label: v })),
                  ]}
                />
              </Col>
            </Row>
          ))}
        </>
      )}

      {trialNo >= 2 && (
        <>
          <Text>보너스 능력치 +2 (서로 다른 2개에 +1씩)</Text>
          <Row gutter={16}>
            <Col span={12}>
              <Select
                style={{ width: '100%' }}
                placeholder="첫 번째 +1"
                value={bonusStats[0]}
                onChange={(val) => setBonusStats([val, bonusStats[1]])}
                options={[
                  ...(bonusStats[0]
                    ? [
                        {
                          value: bonusStats[0],
                          label: STAT_LABELS.find((s) => s.key === bonusStats[0])?.label,
                        },
                      ]
                    : []),
                  ...availableBonusStats.map((key) => ({
                    value: key,
                    label: STAT_LABELS.find((s) => s.key === key)?.label,
                  })),
                ]}
              />
            </Col>
            <Col span={12}>
              <Select
                style={{ width: '100%' }}
                placeholder="두 번째 +1"
                value={bonusStats[1]}
                onChange={(val) => setBonusStats([bonusStats[0], val])}
                options={[
                  ...(bonusStats[1]
                    ? [
                        {
                          value: bonusStats[1],
                          label: STAT_LABELS.find((s) => s.key === bonusStats[1])?.label,
                        },
                      ]
                    : []),
                  ...availableBonusStats.map((key) => ({
                    value: key,
                    label: STAT_LABELS.find((s) => s.key === key)?.label,
                  })),
                ]}
              />
            </Col>
          </Row>
        </>
      )}

      <div>
        <Text>스킬 {trialNo}</Text>
        <TextArea
          rows={2}
          placeholder="스킬 이름과 설명을 입력하세요"
          value={skill}
          onChange={(e) => setSkill(e.target.value)}
          style={{ marginTop: 8 }}
        />
      </div>
    </Space>
  )
}

export const StatInput: FC<{
  trialData: Record<number, TrialData>
  setTrialData: (data: Record<number, TrialData>) => void
}> = ({ trialData, setTrialData }) => {
  const { data } = useCurrentRound()

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
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {Array.from({ length: trial_no }, (_, i) => {
          const trialNo = i + 1
          return (
            <div key={trialNo}>
              <TrialInput
                trialNo={trialNo}
                data={trialData[trialNo] || { skill: '' }}
                onChange={(data) => setTrialData({ ...trialData, [trialNo]: data })}
              />
              {i < trial_no - 1 && <Divider />}
            </div>
          )
        })}
      </Space>
    </Card>
  )
}
