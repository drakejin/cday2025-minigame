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
  CheckCircleOutlined,
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
  useEvaluateRound,
} from '@/hooks/queries/useAdminQuery'
import { trialService } from '@/services/trial.service'

const { Title } = Typography
const { RangePicker } = DatePicker

export const RoundManagement: FC = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isTrialsModalOpen, setIsTrialsModalOpen] = useState(false)
  const [trialModalRound, setTrialModalRound] = useState<AdminRound | null>(null)
  const [trialsLoading, setTrialsLoading] = useState(false)
  const [trials, setTrials] = useState<any[]>([])
  const [isEvaluationModalOpen, setIsEvaluationModalOpen] = useState(false)
  const [evaluationResult, setEvaluationResult] = useState<any>(null)
  const [form] = Form.useForm()

  const { data: rounds, isLoading } = useAdminRounds()

  const createMutation = useCreateRound()
  const startMutation = useStartRound()
  const endMutation = useEndRound()
  const cancelMutation = useCancelRound()
  const evaluateMutation = useEvaluateRound()

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
                  onSuccess: () => message.success('시련가 시작되었습니다'),
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
                  onSuccess: () => message.success('시련가 종료되었습니다'),
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
                  onSuccess: () => message.success('시련가 취소되었습니다'),
                  onError: (error: Error) => message.error(error.message),
                })
              }
              loading={cancelMutation.isPending}
            >
              Cancel
            </Button>
          )}
          <Button
            size="small"
            onClick={async () => {
              setTrialModalRound(record)
              setIsTrialsModalOpen(true)
              setTrialsLoading(true)
              try {
                const res = await trialService.adminListTrialsByRoundNumber(record.roundNumber)
                setTrials(res.trials || [])
              } catch (e) {
                message.error((e as Error).message)
              } finally {
                setTrialsLoading(false)
              }
            }}
          >
            Manage Trials
          </Button>
          {(record.status === 'active' || record.status === 'completed') && (
            <Button
              type="default"
              size="small"
              icon={<CheckCircleOutlined />}
              onClick={() =>
                evaluateMutation.mutate(record.id, {
                  onSuccess: (data) => {
                    message.success('시련 평가가 완료되었습니다')
                    setEvaluationResult(data)
                    setIsEvaluationModalOpen(true)
                  },
                  onError: (error: Error) => message.error(error.message),
                })
              }
              loading={evaluateMutation.isPending}
            >
              평가
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
            message.success('시련가 생성되었습니다')
            setIsCreateModalOpen(false)
            form.resetFields()
          },
          onError: (error: Error) => {
            console.error('Create round error:', error)
            message.error(`시련 생성 실패: ${error.message}`)
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

      <Modal
        title={`Trials - Round ${trialModalRound?.roundNumber ?? ''}`}
        open={isTrialsModalOpen}
        onCancel={() => {
          setIsTrialsModalOpen(false)
          setTrialModalRound(null)
          setTrials([])
        }}
        footer={null}
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <Button
            type="primary"
            onClick={async () => {
              if (!trialModalRound) return
              setTrialsLoading(true)
              try {
                // Create 3 default trials (Lv1->x1, Lv2->x2, Lv3->x4)
                const roundId = trialModalRound.id
                await trialService.adminCreateTrial({
                  round_id: roundId,
                  trial_no: 1,
                  level: 1,
                  weight_multiplier: 1,
                })
                await trialService.adminCreateTrial({
                  round_id: roundId,
                  trial_no: 2,
                  level: 2,
                  weight_multiplier: 2,
                })
                await trialService.adminCreateTrial({
                  round_id: roundId,
                  trial_no: 3,
                  level: 3,
                  weight_multiplier: 4,
                })
                const res = await trialService.adminListTrialsByRoundNumber(
                  trialModalRound.roundNumber
                )
                setTrials(res.trials || [])
                message.success('시련이 생성되었습니다')
              } catch (e) {
                message.error((e as Error).message)
              } finally {
                setTrialsLoading(false)
              }
            }}
            disabled={trialsLoading}
          >
            기본 시련 3개 생성
          </Button>
          <Table
            dataSource={trials}
            loading={trialsLoading}
            rowKey="id"
            columns={[
              { title: 'Trial #', dataIndex: 'trial_no', key: 'trial_no' },
              { title: 'Level', dataIndex: 'level', key: 'level' },
              { title: 'Multiplier', dataIndex: 'weight_multiplier', key: 'weight_multiplier' },
              {
                title: 'Status',
                dataIndex: 'status',
                key: 'status',
                render: (s: string) => getStatusTag(s),
              },
            ]}
            pagination={false}
          />
        </Space>
      </Modal>

      <Modal
        title="시련 평가 결과"
        open={isEvaluationModalOpen}
        onCancel={() => {
          setIsEvaluationModalOpen(false)
          setEvaluationResult(null)
        }}
        footer={[
          <Button
            key="close"
            onClick={() => {
              setIsEvaluationModalOpen(false)
              setEvaluationResult(null)
            }}
          >
            닫기
          </Button>,
        ]}
        width={800}
      >
        {evaluationResult && (
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            <div>
              <Title level={5}>시련 정보</Title>
              <p>시련 번호: {evaluationResult.round?.round_number}</p>
              <p>제출된 프롬프트 수: {evaluationResult.promptsCount}</p>
            </div>
            <div>
              <Title level={5}>Claude AI 평가 결과</Title>
              <Card>
                <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                  {evaluationResult.evaluation}
                </pre>
              </Card>
            </div>
            {evaluationResult.prompts && evaluationResult.prompts.length > 0 && (
              <div>
                <Title level={5}>프롬프트 목록</Title>
                <Table
                  dataSource={evaluationResult.prompts}
                  rowKey="promptId"
                  columns={[
                    { title: '캐릭터', dataIndex: 'characterName', key: 'characterName' },
                    { title: '사용자', dataIndex: 'username', key: 'username' },
                    { title: '시련', dataIndex: 'trialNo', key: 'trialNo' },
                    { title: '프롬프트', dataIndex: 'promptText', key: 'promptText' },
                  ]}
                  pagination={{ pageSize: 5 }}
                  scroll={{ x: true }}
                />
              </div>
            )}
          </Space>
        )}
      </Modal>
    </AdminLayout>
  )
}
