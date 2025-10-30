import { DeleteOutlined, SearchOutlined } from '@ant-design/icons'
import type { FC } from 'react'
import { useState } from 'react'
import { Button, Card, Input, Modal, Select, Space, Table, Typography, message } from 'antd'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminService } from '@/services/admin.service'
import type { AdminPrompt } from '@/types/admin.types'

const { Title } = Typography
const { TextArea } = Input

export const PromptModeration: FC = () => {
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState('')
  const [filterRound, setFilterRound] = useState<number | 'all'>('all')
  const [filterStatus, setFilterStatus] = useState<'all' | 'flagged'>('all')
  const [deleteModalVisible, setDeleteModalVisible] = useState(false)
  const [selectedPrompt, setSelectedPrompt] = useState<AdminPrompt | null>(null)
  const [deleteReason, setDeleteReason] = useState('')

  // Fetch prompts
  const { data: promptsData, isLoading } = useQuery({
    queryKey: ['admin', 'prompts', filterRound, filterStatus],
    queryFn: () =>
      adminService.getPrompts({
        round_id: filterRound === 'all' ? undefined : filterRound,
        flagged_only: filterStatus === 'flagged',
      }),
  })

  // Fetch rounds for filter
  const { data: roundsData } = useQuery({
    queryKey: ['admin', 'rounds'],
    queryFn: () => adminService.getRounds(),
  })

  // Delete prompt mutation
  const deletePromptMutation = useMutation({
    mutationFn: (data: { prompt_id: string; reason: string }) =>
      adminService.deletePrompt(data.prompt_id, data.reason),
    onSuccess: () => {
      message.success('프롬프트가 삭제되고 점수가 롤백되었습니다')
      queryClient.invalidateQueries({ queryKey: ['admin', 'prompts'] })
      setDeleteModalVisible(false)
      setSelectedPrompt(null)
      setDeleteReason('')
    },
    onError: (error: Error) => {
      message.error(`삭제 실패: ${error.message}`)
    },
  })

  const handleDeleteClick = (prompt: AdminPrompt) => {
    setSelectedPrompt(prompt)
    setDeleteModalVisible(true)
  }

  const handleDeleteConfirm = () => {
    if (!selectedPrompt) return
    if (!deleteReason.trim()) {
      message.warning('삭제 사유를 입력해주세요')
      return
    }

    deletePromptMutation.mutate({
      prompt_id: selectedPrompt.id,
      reason: deleteReason,
    })
  }

  const filteredPrompts = promptsData?.prompts?.filter((prompt: AdminPrompt) => {
    if (!searchTerm) return true
    const term = searchTerm.toLowerCase()
    return (
      prompt.promptText.toLowerCase().includes(term) ||
      prompt.userEmail?.toLowerCase().includes(term) ||
      prompt.characterName?.toLowerCase().includes(term)
    )
  })

  const columns = [
    {
      title: '라운드',
      dataIndex: 'roundNumber',
      key: 'roundNumber',
      width: 80,
      sorter: (a: AdminPrompt, b: AdminPrompt) => a.roundNumber - b.roundNumber,
    },
    {
      title: '사용자',
      dataIndex: 'userEmail',
      key: 'userEmail',
      width: 200,
      ellipsis: true,
    },
    {
      title: '캐릭터',
      dataIndex: 'characterName',
      key: 'characterName',
      width: 150,
      ellipsis: true,
    },
    {
      title: '프롬프트',
      dataIndex: 'promptText',
      key: 'promptText',
      ellipsis: true,
      render: (text: string) => <div style={{ maxWidth: 400, whiteSpace: 'pre-wrap' }}>{text}</div>,
    },
    {
      title: '점수',
      dataIndex: 'scoreChange',
      key: 'scoreChange',
      width: 80,
      render: (score: number) => (
        <span style={{ color: score >= 0 ? '#52c41a' : '#ff4d4f', fontWeight: 'bold' }}>
          {score >= 0 ? '+' : ''}
          {score}
        </span>
      ),
      sorter: (a: AdminPrompt, b: AdminPrompt) => a.scoreChange - b.scoreChange,
    },
    {
      title: '제출 시간',
      dataIndex: 'submittedAt',
      key: 'submittedAt',
      width: 180,
      render: (date: string) => new Date(date).toLocaleString('ko-KR'),
      sorter: (a: AdminPrompt, b: AdminPrompt) =>
        new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime(),
    },
    {
      title: '작업',
      key: 'actions',
      width: 100,
      fixed: 'right' as const,
      render: (_: unknown, record: AdminPrompt) => (
        <Button
          type="text"
          danger
          icon={<DeleteOutlined />}
          onClick={() => handleDeleteClick(record)}
          disabled={deletePromptMutation.isPending}
        >
          삭제
        </Button>
      ),
    },
  ]

  return (
    <div style={{ padding: 24 }}>
      <Title level={2}>프롬프트 관리</Title>

      <Card style={{ marginBottom: 24 }}>
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <Space wrap>
            <Input
              placeholder="프롬프트, 사용자 이메일, 캐릭터 이름으로 검색"
              prefix={<SearchOutlined />}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: 300 }}
              allowClear
            />

            <Select
              placeholder="라운드 필터"
              value={filterRound}
              onChange={setFilterRound}
              style={{ width: 150 }}
            >
              <Select.Option value="all">전체 라운드</Select.Option>
              {roundsData?.rounds?.map((round: { id: string; roundNumber: number }) => (
                <Select.Option key={round.id} value={round.roundNumber}>
                  Round {round.roundNumber}
                </Select.Option>
              ))}
            </Select>

            <Select
              placeholder="상태 필터"
              value={filterStatus}
              onChange={setFilterStatus}
              style={{ width: 120 }}
            >
              <Select.Option value="all">전체</Select.Option>
              <Select.Option value="flagged">신고됨</Select.Option>
            </Select>
          </Space>

          <div>
            총 <strong>{filteredPrompts?.length || 0}</strong>개의 프롬프트
          </div>
        </Space>
      </Card>

      <Card>
        <Table
          columns={columns}
          dataSource={filteredPrompts}
          rowKey="id"
          loading={isLoading}
          scroll={{ x: 1200 }}
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showTotal: (total) => `총 ${total}개`,
          }}
        />
      </Card>

      {/* Delete Modal */}
      <Modal
        title="프롬프트 삭제"
        open={deleteModalVisible}
        onCancel={() => {
          setDeleteModalVisible(false)
          setSelectedPrompt(null)
          setDeleteReason('')
        }}
        onOk={handleDeleteConfirm}
        okText="삭제"
        cancelText="취소"
        okButtonProps={{ danger: true, loading: deletePromptMutation.isPending }}
      >
        {selectedPrompt && (
          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            <div>
              <strong>사용자:</strong> {selectedPrompt.userEmail}
            </div>
            <div>
              <strong>캐릭터:</strong> {selectedPrompt.characterName}
            </div>
            <div>
              <strong>프롬프트:</strong>
              <div
                style={{
                  padding: 8,
                  background: '#f5f5f5',
                  borderRadius: 4,
                  marginTop: 4,
                }}
              >
                {selectedPrompt.promptText}
              </div>
            </div>
            <div>
              <strong>점수 변동:</strong>{' '}
              <span style={{ color: selectedPrompt.scoreChange >= 0 ? '#52c41a' : '#ff4d4f' }}>
                {selectedPrompt.scoreChange >= 0 ? '+' : ''}
                {selectedPrompt.scoreChange}
              </span>
            </div>
            <div>
              <TextArea
                placeholder="삭제 사유를 입력하세요 (필수)"
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                rows={4}
                maxLength={500}
                showCount
              />
            </div>
            <div style={{ color: '#ff4d4f', fontSize: 12 }}>
              ⚠️ 삭제 시 해당 프롬프트의 점수 변동이 롤백됩니다.
            </div>
          </Space>
        )}
      </Modal>
    </div>
  )
}
