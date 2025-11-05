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
import dayjs from 'dayjs'
import { AdminLayout } from '@/components/layout/AdminLayout'
import type { AdminRound } from '@/types'
import {
  useAdminRounds,
  useCreateRound,
  useStartRound,
  useEndRound,
  useCancelRound,
} from '@/hooks/queries/useAdminQuery'

const { Title } = Typography
const { RangePicker } = DatePicker

export const RoundManagement: FC = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [form] = Form.useForm()

  const { data: rounds, isLoading } = useAdminRounds()

  const createMutation = useCreateRound()
  const startMutation = useStartRound()
  const endMutation = useEndRound()
  const cancelMutation = useCancelRound()

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
              onClick={() =>
                startMutation.mutate(record.id, {
                  onSuccess: () => message.success('라운드가 시작되었습니다'),
                  onError: (error: Error) => message.error(error.message),
                })
              }
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
              onClick={() =>
                endMutation.mutate(record.id, {
                  onSuccess: () => message.success('라운드가 종료되었습니다'),
                  onError: (error: Error) => message.error(error.message),
                })
              }
              loading={endMutation.isPending}
            >
              End
            </Button>
          )}
          {(record.status === 'scheduled' || record.status === 'active') && (
            <Button
              size="small"
              icon={<CloseCircleOutlined />}
              onClick={() =>
                cancelMutation.mutate(record.id, {
                  onSuccess: () => message.success('라운드가 취소되었습니다'),
                  onError: (error: Error) => message.error(error.message),
                })
              }
              loading={cancelMutation.isPending}
            >
              Cancel
            </Button>
          )}
        </Space>
      ),
    },
  ]

  const handleCreate = async () => {
    console.log('handleCreate called')
    try {
      const values = await form.validateFields()
      console.log('Form validation passed:', values)

      if (!values.dateRange || values.dateRange.length !== 2) {
        console.error('Invalid dateRange:', values.dateRange)
        message.error('시작/종료 시간을 선택해주세요')
        return
      }

      console.log('Calling createMutation.mutate...')
      createMutation.mutate(
        {
          startTime: values.dateRange[0].toISOString(),
          endTime: values.dateRange[1].toISOString(),
          notes: values.notes,
        },
        {
          onSuccess: () => {
            message.success('라운드가 생성되었습니다')
            setIsCreateModalOpen(false)
            form.resetFields()
          },
          onError: (error: Error) => {
            console.error('Create round error:', error)
            message.error(`라운드 생성 실패: ${error.message}`)
          },
        }
      )
    } catch (error) {
      console.error('Form validation failed:', error)
      message.error('입력값을 확인해주세요')
    }
  }

  return (
    <AdminLayout>
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
        onOk={() => {
          console.log('Modal OK clicked')
          handleCreate()
        }}
        onCancel={() => {
          console.log('Modal cancelled')
          setIsCreateModalOpen(false)
          form.resetFields()
          createMutation.reset()
        }}
        confirmLoading={createMutation.isPending}
        okButtonProps={{ disabled: createMutation.isPending }}
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
    </AdminLayout>
  )
}
