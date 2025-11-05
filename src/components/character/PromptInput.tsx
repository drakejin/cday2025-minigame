import { type FC, useState } from 'react'
import { Input, Button, Space, Typography, Alert, Tag } from 'antd'
import { SendOutlined, EditOutlined } from '@ant-design/icons'
import { usePromptSubmit } from '@/hooks/usePromptSubmit'

const { TextArea } = Input
const { Text, Title } = Typography

export const PromptInput: FC = () => {
  const [prompt, setPrompt] = useState('')
  const { submitPrompt, isSubmitting, error, hasSubmittedThisRound, canSubmit } = usePromptSubmit()

  const handleSubmit = async () => {
    if (!prompt.trim() || prompt.length > 30) return

    const success = await submitPrompt(prompt)
    if (success) {
      setPrompt('')
    }
  }

  return (
    <div
      style={{
        background: '#fff',
        border: '1px solid #e0e0e0',
        borderRadius: 8,
        padding: '16px',
      }}
    >
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Space>
            <EditOutlined style={{ fontSize: 20, color: '#1890ff' }} />
            <Title level={4} style={{ margin: 0 }}>
              프롬프트 제출
            </Title>
          </Space>
          {hasSubmittedThisRound && (
            <Tag color="success" style={{ margin: 0 }}>
              제출 완료
            </Tag>
          )}
        </div>

        {hasSubmittedThisRound ? (
          <Alert message="이번 라운드에 이미 제출했습니다" type="info" showIcon role="status" />
        ) : (
          <>
            <div>
              <TextArea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="캐릭터를 성장시킬 프롬프트를 입력하세요 (최대 30자)"
                maxLength={30}
                rows={3}
                disabled={!canSubmit}
                aria-label="프롬프트 입력"
                aria-describedby="prompt-char-count"
                style={{ fontSize: 14 }}
              />
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: 8,
                }}
              >
                <Text type="secondary" style={{ fontSize: 12 }}>
                  캐릭터를 성장시킬 프롬프트를 입력하세요
                </Text>
                <Text type="secondary" style={{ fontSize: 12 }} id="prompt-char-count">
                  {prompt.length}/30자
                </Text>
              </div>
            </div>

            {error && <Alert message={error} type="error" showIcon role="alert" />}

            <Button
              type="primary"
              icon={<SendOutlined />}
              onClick={handleSubmit}
              loading={isSubmitting}
              disabled={!canSubmit || prompt.trim().length === 0}
              aria-label="프롬프트 제출하기"
              block
              size="large"
            >
              제출하기
            </Button>
          </>
        )}
      </Space>
    </div>
  )
}
