import type { FC } from 'react'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { SearchOutlined, TrophyOutlined } from '@ant-design/icons'
import { Card, Input, Space, Table, Tag, Typography } from 'antd'
import { AdminLayout } from '@/components/layout/AdminLayout'
import { leaderboardService } from '@/services/leaderboard.service'
import type { LeaderboardEntry } from '@/types'

const { Title } = Typography

export const AdminLeaderboard: FC = () => {
  const [searchTerm, setSearchTerm] = useState('')

  const { data: leaderboardData, isLoading } = useQuery({
    queryKey: ['admin', 'leaderboard'],
    queryFn: () => leaderboardService.getCurrentLeaderboard(200, 0), // Admin can see top 200
    refetchInterval: 30000, // Refresh every 30 seconds
  })

  const filteredData = leaderboardData?.data?.filter((entry: LeaderboardEntry) => {
    if (!searchTerm) return true
    const term = searchTerm.toLowerCase()
    return (
      entry.character_name.toLowerCase().includes(term) ||
      entry.display_name.toLowerCase().includes(term)
    )
  })

  const columns = [
    {
      title: '순위',
      dataIndex: 'rank',
      key: 'rank',
      width: 80,
      fixed: 'left' as const,
      render: (rank: number) => {
        if (rank === 1) return <Tag color="gold">🥇 {rank}</Tag>
        if (rank === 2) return <Tag color="silver">🥈 {rank}</Tag>
        if (rank === 3) return <Tag color="orange">🥉 {rank}</Tag>
        return <span style={{ fontWeight: 'bold' }}>{rank}</span>
      },
      sorter: (a: LeaderboardEntry, b: LeaderboardEntry) => a.rank - b.rank,
    },
    {
      title: '캐릭터 이름',
      dataIndex: 'character_name',
      key: 'character_name',
      width: 150,
      ellipsis: true,
      render: (name: string) => (
        <Space>
          <TrophyOutlined style={{ color: '#faad14' }} />
          <strong>{name}</strong>
        </Space>
      ),
    },
    {
      title: '사용자',
      dataIndex: 'display_name',
      key: 'display_name',
      width: 150,
      ellipsis: true,
    },
    {
      title: '총점',
      dataIndex: 'total_score',
      key: 'total_score',
      width: 100,
      align: 'center' as const,
      render: (score: number) => (
        <span style={{ fontSize: 16, fontWeight: 'bold', color: '#1890ff' }}>{score}</span>
      ),
      sorter: (a: LeaderboardEntry, b: LeaderboardEntry) => b.total_score - a.total_score,
      defaultSortOrder: 'descend' as const,
    },
    {
      title: '힘',
      dataIndex: 'strength',
      key: 'strength',
      width: 80,
      align: 'center' as const,
      render: (value: number) => (
        <Tag color="red" style={{ minWidth: 40 }}>
          💪 {value}
        </Tag>
      ),
      sorter: (a: LeaderboardEntry, b: LeaderboardEntry) => a.strength - b.strength,
    },
    {
      title: '매력',
      dataIndex: 'charm',
      key: 'charm',
      width: 80,
      align: 'center' as const,
      render: (value: number) => (
        <Tag color="pink" style={{ minWidth: 40 }}>
          ✨ {value}
        </Tag>
      ),
      sorter: (a: LeaderboardEntry, b: LeaderboardEntry) => a.charm - b.charm,
    },
    {
      title: '창의력',
      dataIndex: 'creativity',
      key: 'creativity',
      width: 80,
      align: 'center' as const,
      render: (value: number) => (
        <Tag color="purple" style={{ minWidth: 40 }}>
          🎨 {value}
        </Tag>
      ),
      sorter: (a: LeaderboardEntry, b: LeaderboardEntry) => a.creativity - b.creativity,
    },
    {
      title: '현재 프롬프트',
      dataIndex: 'current_prompt',
      key: 'current_prompt',
      ellipsis: true,
      render: (prompt: string) => (
        <div
          style={{
            maxWidth: 300,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            color: '#666',
            fontSize: 12,
          }}
        >
          {prompt || '-'}
        </div>
      ),
    },
  ]

  return (
    <AdminLayout>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <div>
          <Title level={2}>전체 순위</Title>
          <Typography.Text type="secondary">
            실시간으로 업데이트되는 전체 캐릭터 순위 (상위 200명)
          </Typography.Text>
        </div>

        <Card>
          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            <Input
              placeholder="캐릭터 이름 또는 사용자 이름으로 검색"
              prefix={<SearchOutlined />}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: 400 }}
              allowClear
            />

            <div>
              총 <strong>{filteredData?.length || 0}</strong>명
            </div>

            <Table
              columns={columns}
              dataSource={filteredData}
              rowKey="character_id"
              loading={isLoading}
              scroll={{ x: 1200 }}
              pagination={{
                pageSize: 50,
                showSizeChanger: true,
                pageSizeOptions: ['20', '50', '100', '200'],
                showTotal: (total, range) => `${range[0]}-${range[1]} / 총 ${total}명`,
              }}
              size="middle"
            />
          </Space>
        </Card>
      </Space>
    </AdminLayout>
  )
}
