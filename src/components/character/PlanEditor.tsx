import type { FC } from 'react'
import { Card, Form, Input, InputNumber, Space, Button, Typography, message } from 'antd'
import { useMyPlan, useUpsertPlan } from '@/hooks/queries/usePlanQuery'

const { Title } = Typography

export const PlanEditor: FC = () => {
  const { data, isLoading } = useMyPlan()
  const upsert = useUpsertPlan()
  const [form] = Form.useForm()

  const initial = data?.plan
    ? {
        ...data.plan,
      }
    : {
        lv1_str: 15,
        lv1_dex: 14,
        lv1_con: 12,
        lv1_int: 10,
        lv1_skill: '',
        lv2_str: 16,
        lv2_dex: 14,
        lv2_con: 13,
        lv2_int: 10,
        lv2_skill: '',
        lv3_str: 17,
        lv3_dex: 15,
        lv3_con: 13,
        lv3_int: 10,
        lv3_skill: '',
      }

  const onFinish = async (values: any) => {
    try {
      await upsert.mutateAsync(values)
      message.success('플랜이 저장되었습니다')
    } catch (e) {
      message.error((e as Error).message)
    }
  }

  const numberProps = { min: 1, max: 20 }

  return (
    <Card
      title={
        <Title level={4} style={{ margin: 0 }}>
          캐릭터 성장 계획 (Lv1~Lv3)
        </Title>
      }
      loading={isLoading}
    >
      <Form form={form} layout="vertical" initialValues={initial} onFinish={onFinish}>
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <Card size="small" title="Lv.1">
            <Space wrap>
              <Form.Item name="lv1_str" label="STR">
                <InputNumber {...numberProps} />
              </Form.Item>
              <Form.Item name="lv1_dex" label="DEX">
                <InputNumber {...numberProps} />
              </Form.Item>
              <Form.Item name="lv1_con" label="CON">
                <InputNumber {...numberProps} />
              </Form.Item>
              <Form.Item name="lv1_int" label="INT">
                <InputNumber {...numberProps} />
              </Form.Item>
              <Form.Item name="lv1_skill" label="스킬 1" style={{ minWidth: 240 }}>
                <Input maxLength={50} placeholder="스킬 이름/설명" />
              </Form.Item>
            </Space>
          </Card>

          <Card size="small" title="Lv.2 (+1/+1 분배)">
            <Space wrap>
              <Form.Item name="lv2_str" label="STR">
                <InputNumber {...numberProps} />
              </Form.Item>
              <Form.Item name="lv2_dex" label="DEX">
                <InputNumber {...numberProps} />
              </Form.Item>
              <Form.Item name="lv2_con" label="CON">
                <InputNumber {...numberProps} />
              </Form.Item>
              <Form.Item name="lv2_int" label="INT">
                <InputNumber {...numberProps} />
              </Form.Item>
              <Form.Item name="lv2_skill" label="스킬 2" style={{ minWidth: 240 }}>
                <Input maxLength={50} placeholder="스킬 이름/설명" />
              </Form.Item>
            </Space>
          </Card>

          <Card size="small" title="Lv.3 (+1/+1 분배)">
            <Space wrap>
              <Form.Item name="lv3_str" label="STR">
                <InputNumber {...numberProps} />
              </Form.Item>
              <Form.Item name="lv3_dex" label="DEX">
                <InputNumber {...numberProps} />
              </Form.Item>
              <Form.Item name="lv3_con" label="CON">
                <InputNumber {...numberProps} />
              </Form.Item>
              <Form.Item name="lv3_int" label="INT">
                <InputNumber {...numberProps} />
              </Form.Item>
              <Form.Item name="lv3_skill" label="스킬 3" style={{ minWidth: 240 }}>
                <Input maxLength={50} placeholder="스킬 이름/설명" />
              </Form.Item>
            </Space>
          </Card>

          <Space>
            <Button type="primary" htmlType="submit" loading={upsert.isPending}>
              저장
            </Button>
          </Space>
        </Space>
      </Form>
    </Card>
  )
}
