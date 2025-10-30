import { LockOutlined, SearchOutlined, UnlockOutlined, UserOutlined } from '@ant-design/icons'
import type { FC } from 'react'
import { useState } from 'react'
import {
  Badge,
  Button,
  Card,
  Descriptions,
  Input,
  Modal,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from 'antd'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminService } from '@/services/admin.service'
import type { AdminUser, AdminUserDetail } from '@/types/admin.types'

const { Title } = Typography
const { TextArea } = Input

export const UserManagement: FC = () => {
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'banned'>('all')
  const [detailModalVisible, setDetailModalVisible] = useState(false)
  const [actionModalVisible, setActionModalVisible] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [actionType, setActionType] = useState<'ban' | 'unban'>('ban')
  const [actionReason, setActionReason] = useState('')

  // Fetch users
  const { data: usersData, isLoading } = useQuery({
    queryKey: ['admin', 'users', searchTerm, statusFilter],
    queryFn: () =>
      adminService.getUsers({
        search: searchTerm || undefined,
        status: statusFilter === 'all' ? undefined : statusFilter,
      }),
  })

  // Fetch user detail
  const { data: userDetail, isLoading: isLoadingDetail } = useQuery<AdminUserDetail>({
    queryKey: ['admin', 'user', selectedUserId],
    queryFn: () => adminService.getUserDetail(selectedUserId!),
    enabled: !!selectedUserId && detailModalVisible,
  })

  // Ban user mutation
  const banUserMutation = useMutation({
    mutationFn: (data: { user_id: string; reason: string }) =>
      adminService.banUser(data.user_id, data.reason),
    onSuccess: () => {
      message.success('사용자가 제재되었습니다')
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
      setActionModalVisible(false)
      setActionReason('')
    },
    onError: (error: Error) => {
      message.error(`제재 실패: ${error.message}`)
    },
  })

  // Unban user mutation
  const unbanUserMutation = useMutation({
    mutationFn: (user_id: string) => adminService.unbanUser(user_id),
    onSuccess: () => {
      message.success('제재가 해제되었습니다')
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
      setActionModalVisible(false)
    },
    onError: (error: Error) => {
      message.error(`해제 실패: ${error.message}`)
    },
  })

  const handleViewDetail = (userId: string) => {
    setSelectedUserId(userId)
    setDetailModalVisible(true)
  }

  const handleActionClick = (userId: string, type: 'ban' | 'unban') => {
    setSelectedUserId(userId)
    setActionType(type)
    setActionModalVisible(true)
  }

  const handleActionConfirm = () => {
    if (!selectedUserId) return

    if (actionType === 'ban') {
      if (!actionReason.trim()) {
        message.warning('제재 사유를 입력해주세요')
        return
      }
      banUserMutation.mutate({ user_id: selectedUserId, reason: actionReason })
    } else {
      unbanUserMutation.mutate(selectedUserId)
    }
  }

  const columns = [
    {
      title: '이메일',
      dataIndex: 'email',
      key: 'email',
      width: 250,
      render: (email: string) => (
        <Space>
          <UserOutlined />
          {email}
        </Space>
      ),
    },
    {
      title: '상태',
      dataIndex: 'isBanned',
      key: 'isBanned',
      width: 100,
      render: (isBanned: boolean) =>
        isBanned ? (
          <Badge status="error" text={<Tag color="red">제재됨</Tag>} />
        ) : (
          <Badge status="success" text={<Tag color="green">활성</Tag>} />
        ),
    },
    {
      title: '역할',
      dataIndex: 'role',
      key: 'role',
      width: 100,
      render: (role: string) => (
        <Tag color={role === 'super_admin' ? 'purple' : role === 'admin' ? 'blue' : 'default'}>
          {role === 'super_admin' ? 'Super Admin' : role === 'admin' ? 'Admin' : 'User'}
        </Tag>
      ),
    },
    {
      title: '캐릭터 수',
      dataIndex: 'characterCount',
      key: 'characterCount',
      width: 100,
      align: 'center' as const,
    },
    {
      title: '프롬프트 수',
      dataIndex: 'promptCount',
      key: 'promptCount',
      width: 120,
      align: 'center' as const,
    },
    {
      title: '가입일',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (date: string) => new Date(date).toLocaleString('ko-KR'),
      sorter: (a: AdminUser, b: AdminUser) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    },
    {
      title: '작업',
      key: 'actions',
      width: 200,
      fixed: 'right' as const,
      render: (_: unknown, record: AdminUser) => (
        <Space>
          <Button size="small" onClick={() => handleViewDetail(record.id)}>
            상세
          </Button>
          {record.isBanned ? (
            <Button
              size="small"
              type="primary"
              icon={<UnlockOutlined />}
              onClick={() => handleActionClick(record.id, 'unban')}
              disabled={unbanUserMutation.isPending}
            >
              해제
            </Button>
          ) : (
            <Button
              size="small"
              danger
              icon={<LockOutlined />}
              onClick={() => handleActionClick(record.id, 'ban')}
              disabled={banUserMutation.isPending}
            >
              제재
            </Button>
          )}
        </Space>
      ),
    },
  ]

  return (
    <div style={{ padding: 24 }}>
      <Title level={2}>사용자 관리</Title>

      <Card style={{ marginBottom: 24 }}>
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <Space wrap>
            <Input
              placeholder="이메일로 검색"
              prefix={<SearchOutlined />}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: 300 }}
              allowClear
            />

            <Select
              placeholder="상태 필터"
              value={statusFilter}
              onChange={setStatusFilter}
              style={{ width: 120 }}
            >
              <Select.Option value="all">전체</Select.Option>
              <Select.Option value="active">활성</Select.Option>
              <Select.Option value="banned">제재됨</Select.Option>
            </Select>
          </Space>

          <div>
            총 <strong>{usersData?.users?.length || 0}</strong>명의 사용자
          </div>
        </Space>
      </Card>

      <Card>
        <Table
          columns={columns}
          dataSource={usersData?.users}
          rowKey="id"
          loading={isLoading}
          scroll={{ x: 1200 }}
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showTotal: (total) => `총 ${total}명`,
          }}
        />
      </Card>

      {/* User Detail Modal */}
      <Modal
        title="사용자 상세 정보"
        open={detailModalVisible}
        onCancel={() => {
          setDetailModalVisible(false)
          setSelectedUserId(null)
        }}
        footer={[
          <Button
            key="close"
            onClick={() => {
              setDetailModalVisible(false)
              setSelectedUserId(null)
            }}
          >
            닫기
          </Button>,
        ]}
        width={800}
      >
        {isLoadingDetail ? (
          <div style={{ textAlign: 'center', padding: 40 }}>로딩 중...</div>
        ) : userDetail ? (
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            <Descriptions bordered column={2}>
              <Descriptions.Item label="이메일" span={2}>
                {userDetail.user.email}
              </Descriptions.Item>
              <Descriptions.Item label="상태">
                {userDetail.user.isBanned ? (
                  <Tag color="red">제재됨</Tag>
                ) : (
                  <Tag color="green">활성</Tag>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="역할">
                <Tag
                  color={
                    userDetail.user.role === 'super_admin'
                      ? 'purple'
                      : userDetail.user.role === 'admin'
                        ? 'blue'
                        : 'default'
                  }
                >
                  {userDetail.user.role}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="가입일" span={2}>
                {new Date(userDetail.user.createdAt).toLocaleString('ko-KR')}
              </Descriptions.Item>
            </Descriptions>

            {userDetail.user.isBanned && userDetail.user.bannedAt && (
              <Card title="제재 정보" size="small">
                <Descriptions column={1}>
                  <Descriptions.Item label="제재 일시">
                    {new Date(userDetail.user.bannedAt).toLocaleString('ko-KR')}
                  </Descriptions.Item>
                  <Descriptions.Item label="제재 사유">
                    {userDetail.user.banReason || '사유 없음'}
                  </Descriptions.Item>
                </Descriptions>
              </Card>
            )}

            <Card title="통계" size="small">
              <Descriptions column={2}>
                <Descriptions.Item label="보유 캐릭터">
                  {userDetail.characters.length}개
                </Descriptions.Item>
                <Descriptions.Item label="제출 프롬프트">
                  {userDetail.prompts.length}개
                </Descriptions.Item>
              </Descriptions>
            </Card>

            {userDetail.characters.length > 0 && (
              <Card title="보유 캐릭터" size="small">
                <Table
                  dataSource={userDetail.characters}
                  rowKey="id"
                  size="small"
                  pagination={false}
                  columns={[
                    { title: '이름', dataIndex: 'name', key: 'name' },
                    {
                      title: '점수',
                      dataIndex: 'totalScore',
                      key: 'totalScore',
                      render: (score: number) => <strong>{score}</strong>,
                    },
                    {
                      title: '생성일',
                      dataIndex: 'createdAt',
                      key: 'createdAt',
                      render: (date: string) => new Date(date).toLocaleDateString('ko-KR'),
                    },
                  ]}
                />
              </Card>
            )}

            {userDetail.prompts.length > 0 && (
              <Card title="최근 프롬프트" size="small">
                <Table
                  dataSource={userDetail.prompts.slice(0, 10)}
                  rowKey="id"
                  size="small"
                  pagination={false}
                  columns={[
                    {
                      title: '라운드',
                      dataIndex: 'roundNumber',
                      key: 'roundNumber',
                      width: 80,
                    },
                    {
                      title: '프롬프트',
                      dataIndex: 'promptText',
                      key: 'promptText',
                      ellipsis: true,
                    },
                    {
                      title: '점수',
                      dataIndex: 'scoreChange',
                      key: 'scoreChange',
                      width: 80,
                      render: (score: number) => (
                        <span style={{ color: score >= 0 ? '#52c41a' : '#ff4d4f' }}>
                          {score >= 0 ? '+' : ''}
                          {score}
                        </span>
                      ),
                    },
                  ]}
                />
              </Card>
            )}
          </Space>
        ) : null}
      </Modal>

      {/* Ban/Unban Action Modal */}
      <Modal
        title={actionType === 'ban' ? '사용자 제재' : '제재 해제'}
        open={actionModalVisible}
        onCancel={() => {
          setActionModalVisible(false)
          setSelectedUserId(null)
          setActionReason('')
        }}
        onOk={handleActionConfirm}
        okText={actionType === 'ban' ? '제재' : '해제'}
        cancelText="취소"
        okButtonProps={{
          danger: actionType === 'ban',
          loading: banUserMutation.isPending || unbanUserMutation.isPending,
        }}
      >
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          {actionType === 'ban' ? (
            <>
              <div style={{ color: '#ff4d4f' }}>
                ⚠️ 사용자를 제재하면 로그인 및 모든 활동이 제한됩니다.
              </div>
              <TextArea
                placeholder="제재 사유를 입력하세요 (필수)"
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                rows={4}
                maxLength={500}
                showCount
              />
            </>
          ) : (
            <div>정말 이 사용자의 제재를 해제하시겠습니까?</div>
          )}
        </Space>
      </Modal>
    </div>
  )
}
