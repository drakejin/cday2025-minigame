import { UserAddOutlined } from '@ant-design/icons'
import { Alert, Button, Card, Input, message, Space, Typography } from 'antd'
import { type FC, useState } from 'react'
import { useCreateCharacter } from '@/hooks/queries/useCharacterQuery'

const { Title, Text } = Typography

export const CharacterCreationForm: FC = () => {
  const [name, setName] = useState('')
  const { mutate: createCharacter, isPending, error } = useCreateCharacter()

  const handleSubmit = () => {
    const trimmedName = name.trim()

    console.log('[CharacterCreationForm] handleSubmit called', {
      name,
      trimmedName,
      length: trimmedName.length,
    })

    if (!trimmedName) {
      message.warning('캐릭터 이름을 입력해주세요')
      return
    }

    if (trimmedName.length > 100) {
      message.warning('캐릭터 이름은 100자 이하여야 합니다')
      return
    }

    console.log('[CharacterCreationForm] Calling createCharacter mutation')
    createCharacter(trimmedName, {
      onSuccess: (data) => {
        console.log('[CharacterCreationForm] Character created successfully', data)
        message.success('캐릭터가 생성되었습니다!')
      },
      onError: (err) => {
        console.error('[CharacterCreationForm] Character creation failed', err)
        message.error((err as Error).message || '캐릭터 생성에 실패했습니다')
      },
    })
  }

  return (
    <Card style={{ maxWidth: 600, margin: '0 auto' }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <div style={{ textAlign: 'center' }}>
          <Title level={3}>캐릭터 생성</Title>
          <Text type="secondary">게임을 시작하려면 먼저 캐릭터를 만들어주세요</Text>
        </div>

        <div>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="캐릭터 이름을 입력하세요 (최대 100자)"
            maxLength={100}
            size="large"
            disabled={isPending}
            onPressEnter={handleSubmit}
            aria-label="캐릭터 이름 입력"
          />
          <Text type="secondary" style={{ display: 'block', marginTop: 8 }}>
            {name.length}/100자
          </Text>
        </div>

        {error && (
          <Alert
            message="캐릭터 생성 실패"
            description={(error as Error).message}
            type="error"
            showIcon
          />
        )}

        <Button
          type="primary"
          icon={<UserAddOutlined />}
          onClick={handleSubmit}
          loading={isPending}
          disabled={name.trim().length === 0}
          size="large"
          block
        >
          캐릭터 만들기
        </Button>
      </Space>
    </Card>
  )
}
