import type { FC } from 'react'
import { useState } from 'react'
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Modal,
  Form,
  DatePicker,
  Input,
  message,
  Typography,
} from 'antd'
import {
  PlusOutlined,
  PlayCircleOutlined,
  StopOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { MainLayout } from '@/components/layout/MainLayout'
import { adminService } from '@/services/admin.service'
import type { AdminRound } from '@/types'

const { Title } = Typography
const { RangePicker } = DatePicker

export const RoundManagement: FC = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [form] = Form.useForm()
  const queryClient = useQueryClient()

  const { data: rounds, isLoading } = useQuery({
    queryKey: ['admin', 'rounds'],
    queryFn: () => adminService.listRounds(),
  })

  const createMutation = useMutation({
    mutationFn: (values: { dateRange: [dayjs.Dayjs, dayjs.Dayjs]; notes?: string }) =>
      adminService.createRound(
        values.dateRange[0].toISOString(),
        values.dateRange[1].toISOString(),
        values.notes
      ),
    onSuccess: () => {
      message.success('라운드가 생성되었습니다')
      setIsCreateModalOpen(false)
      form.resetFields()
      queryClient.invalidateQueries({ queryKey: ['admin', 'rounds'] })
    },
    onError: (error: Error) => {
      message.error(error.message)
    },
  })

  const startMutation = useMutation({
    mutationFn: (roundId: string) => adminService.startRound(roundId),
    onSuccess: () => {
      message.success('라운드가 시작되었습니다')
      queryClient.invalidateQueries({ queryKey: ['admin', 'rounds'] })
    },
    onError: (error: Error) => {
      message.error(error.message)
    },
  })

  const endMutation = useMutation({
    mutationFn: (roundId: string) => adminService.endRound(roundId),
    onSuccess: () => {
      message.success('라운드가 종료되었습니다')
      queryClient.invalidateQueries({ queryKey: ['admin', 'rounds'] })
    },
    onError: (error: Error) => {
      message.error(error.message)
    },
  })

  const cancelMutation = useMutation({
    mutationFn: (roundId: string) => adminService.cancelRound(roundId),
    onSuccess: () => {
      message.success('라운드가 취소되었습니다')
      queryClient.invalidateQueries({ queryKey: ['admin', 'rounds'] })
    },
    onError: (error: Error) => {
      message.error(error.message)
    },
  })

  const getStatusTag = (status: string) => {
    const colors: Record<string, string> = {
      scheduled: 'default',
      active: 'success',
      completed: 'blue',
      cancelled: 'error',
    }
    return <Tag color={colors[status] || 'default'}>{status}</Tag>
  }

  const columns = [
    {
      title: 'Round #',
      dataIndex: 'roundNumber',
      key: 'roundNumber',
      sorter: (a: AdminRound, b: AdminRound) => a.roundNumber - b.roundNumber,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => getStatusTag(status),
    },
    {
      title: 'Start Time',
      dataIndex: 'startTime',
      key: 'startTime',
      render: (time: string) => dayjs(time).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: 'End Time',
      dataIndex: 'endTime',
      key: 'endTime',
      render: (time: string) => dayjs(time).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: 'Active',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive: boolean) => (isActive ? <Tag color="success">Yes</Tag> : <Tag>No</Tag>),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: unknown, record: AdminRound) => (
        <Space>
          {record.status === 'scheduled' && (
            <Button
              type="primary"
              size="small"
              icon={<PlayCircleOutlined />}
              onClick={() => startMutation.mutate(record.id)}
              loading={startMutation.isPending}
            >
              Start
            </Button>
          )}
          {record.status === 'active' && (
            <Button
              danger
              size="small"
              icon={<StopOutlined />}
              onClick={() => endMutation.mutate(record.id)}
              loading={endMutation.isPending}
            >
              End
            </Button>
          )}
          {(record.status === 'scheduled' || record.status === 'active') && (
            <Button
              size="small"
              icon={<CloseCircleOutlined />}
              onClick={() => cancelMutation.mutate(record.id)}
              loading={cancelMutation.isPending}
            >
              Cancel
            </Button>
          )}
        </Space>
      ),
    },
  ]

  const handleCreate = () => {
    form.validateFields().then((values) => {
      createMutation.mutate(values)
    })
  }

  return (
    <MainLayout>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Title level={2}>Round Management</Title>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsCreateModalOpen(true)}>
            Create Round
          </Button>
        </div>

        <Card>
          <Table
            dataSource={rounds?.rounds || []}
            columns={columns}
            rowKey="id"
            loading={isLoading}
            pagination={{ pageSize: 10 }}
          />
        </Card>
      </Space>

      <Modal
        title="Create New Round"
        open={isCreateModalOpen}
        onOk={handleCreate}
        onCancel={() => {
          setIsCreateModalOpen(false)
          form.resetFields()
        }}
        confirmLoading={createMutation.isPending}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="dateRange"
            label="Round Duration"
            rules={[{ required: true, message: 'Please select start and end time' }]}
          >
            <RangePicker
              showTime
              format="YYYY-MM-DD HH:mm"
              style={{ width: '100%' }}
              placeholder={['Start Time', 'End Time']}
            />
          </Form.Item>
          <Form.Item name="notes" label="Notes (Optional)">
            <Input.TextArea rows={3} placeholder="Add any notes for this round..." />
          </Form.Item>
        </Form>
      </Modal>
    </MainLayout>
  )
}
