import { FilterOutlined, SearchOutlined } from '@ant-design/icons'
import { useQuery } from '@tanstack/react-query'
import { Card, DatePicker, Input, Select, Space, Table, Tag, Typography } from 'antd'
import type { Dayjs } from 'dayjs'
import type { FC } from 'react'
import { useState } from 'react'
import { AdminLayout } from '@/components/layout/AdminLayout'
import { adminService } from '@/services/admin.service'
import type { AuditLog as AuditLogType, JsonValue } from '@/types/admin.types'

const { Title } = Typography
const { RangePicker } = DatePicker

const ACTION_COLORS: Record<string, string> = {
  round_create: 'blue',
  round_start: 'green',
  round_end: 'orange',
  round_extend: 'cyan',
  round_cancel: 'red',
  prompt_delete: 'volcano',
  user_ban: 'magenta',
  user_unban: 'lime',
  default: 'default',
}

const ACTION_LABELS: Record<string, string> = {
  round_create: '시련 생성',
  round_start: '시련 시작',
  round_end: '시련 종료',
  round_extend: '시련 연장',
  round_cancel: '시련 취소',
  prompt_delete: '프롬프트 삭제',
  user_ban: '사용자 제재',
  user_unban: '제재 해제',
}

export const AuditLog: FC = () => {
  const [actionFilter, setActionFilter] = useState<string>('all')
  const [adminSearch, setAdminSearch] = useState('')
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null]>([null, null])

  // Fetch audit logs
  const { data: auditData, isLoading } = useQuery({
    queryKey: ['admin', 'audit', actionFilter, dateRange],
    queryFn: () =>
      adminService.getAuditLog({
        action: actionFilter === 'all' ? undefined : actionFilter,
        startDate: dateRange[0]?.toISOString(),
        endDate: dateRange[1]?.toISOString(),
        limit: 500,
      }),
  })

  const filteredLogs = auditData?.logs?.filter((log: AuditLogType) => {
    if (!adminSearch) return true
    return log.adminEmail.toLowerCase().includes(adminSearch.toLowerCase())
  })

  const columns = [
    {
      title: '시간',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (date: string) => new Date(date).toLocaleString('ko-KR'),
      sorter: (a: AuditLogType, b: AuditLogType) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      defaultSortOrder: 'ascend' as const,
    },
    {
      title: '작업',
      dataIndex: 'action',
      key: 'action',
      width: 140,
      render: (action: string) => (
        <Tag color={ACTION_COLORS[action] || ACTION_COLORS.default}>
          {ACTION_LABELS[action] || action}
        </Tag>
      ),
    },
    {
      title: '관리자',
      dataIndex: 'adminEmail',
      key: 'adminEmail',
      width: 200,
      ellipsis: true,
    },
    {
      title: '대상 ID',
      dataIndex: 'targetId',
      key: 'targetId',
      width: 150,
      ellipsis: true,
      render: (id: string | null) => id || '-',
    },
    {
      title: '상세 내용',
      dataIndex: 'details',
      key: 'details',
      ellipsis: true,
      render: (details: Record<string, JsonValue> | null | undefined) => {
        if (!details) return '-'
        return (
          <div style={{ maxWidth: 500, fontSize: 12 }}>
            <pre
              style={{
                margin: 0,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                fontFamily: 'monospace',
              }}
            >
              {JSON.stringify(details, null, 2)}
            </pre>
          </div>
        )
      },
    },
  ]

  const actionOptions = [
    { label: '전체', value: 'all' },
    ...Object.entries(ACTION_LABELS).map(([value, label]) => ({ label, value })),
  ]

  return (
    <AdminLayout>
      <div>
        <Title level={2}>관리자 활동 로그</Title>

        <Card style={{ marginBottom: 24 }}>
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            <Space wrap>
              <Input
                placeholder="관리자 이메일로 검색"
                prefix={<SearchOutlined />}
                value={adminSearch}
                onChange={(e) => setAdminSearch(e.target.value)}
                style={{ width: 250 }}
                allowClear
              />

              <Select
                placeholder="작업 필터"
                value={actionFilter}
                onChange={setActionFilter}
                style={{ width: 180 }}
                options={actionOptions}
                suffixIcon={<FilterOutlined />}
              />

              <RangePicker
                placeholder={['시작일', '종료일']}
                value={dateRange}
                onChange={(dates) => setDateRange(dates || [null, null])}
                style={{ width: 300 }}
                format="YYYY-MM-DD"
              />
            </Space>

            <div>
              총 <strong>{filteredLogs?.length || 0}</strong>개의 로그
            </div>
          </Space>
        </Card>

        <Card>
          <Table
            columns={columns}
            dataSource={filteredLogs}
            rowKey="id"
            loading={isLoading}
            scroll={{ x: 1200 }}
            pagination={{
              pageSize: 50,
              showSizeChanger: true,
              pageSizeOptions: ['20', '50', '100', '200'],
              showTotal: (total) => `총 ${total}개`,
            }}
            expandable={{
              expandedRowRender: (record: AuditLogType) => (
                <div style={{ padding: '16px 0' }}>
                  <Space direction="vertical" style={{ width: '100%' }} size="small">
                    <div>
                      <strong>로그 ID:</strong> {record.id}
                    </div>
                    <div>
                      <strong>관리자 ID:</strong> {record.adminId}
                    </div>
                    {record.targetId && (
                      <div>
                        <strong>대상 ID:</strong> {record.targetId}
                      </div>
                    )}
                    {record.details && (
                      <div>
                        <strong>상세 내용:</strong>
                        <pre
                          style={{
                            marginTop: 8,
                            padding: 12,
                            background: '#f5f5f5',
                            borderRadius: 4,
                            fontSize: 12,
                            fontFamily: 'monospace',
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-word',
                          }}
                        >
                          {JSON.stringify(record.details, null, 2)}
                        </pre>
                      </div>
                    )}
                    <div>
                      <strong>생성 시간:</strong>{' '}
                      {new Date(record.createdAt).toLocaleString('ko-KR')}
                    </div>
                  </Space>
                </div>
              ),
              rowExpandable: (record: AuditLogType) => !!record.details || !!record.targetId,
            }}
          />
        </Card>
      </div>
    </AdminLayout>
  )
}
