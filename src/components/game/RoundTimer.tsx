import { memo, useState, useEffect } from 'react'
import type { FC } from 'react'
import { Space, Tag, Typography, Divider, Progress } from 'antd'
import { ClockCircleOutlined } from '@ant-design/icons'
import { useRoundTimer } from '@/hooks/useRoundTimer'

const { Text, Title } = Typography

/**
 * Calculate time remaining and progress in real-time
 */
const useRealtimeCountdown = (endTime?: string, calculateFromNow = false) => {
  const [timeRemaining, setTimeRemaining] = useState('')
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    if (!endTime) {
      setTimeRemaining('')
      setProgress(0)
      return
    }

    const updateTimer = () => {
      const end = new Date(endTime).getTime()
      const now = Date.now()

      // If calculating from now (waiting state), start is current time
      // Otherwise, we need both start and end for active round
      if (calculateFromNow) {
        // Waiting for next round: countdown from now to start
        const diff = end - now

        if (diff <= 0) {
          setTimeRemaining('00:00:00')
          setProgress(100)
          return
        }

        const hours = Math.floor(diff / (1000 * 60 * 60))
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
        const seconds = Math.floor((diff % (1000 * 60)) / 1000)

        setTimeRemaining(
          `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
        )

        // For waiting, progress goes from 100 to 0
        setProgress(0)
      } else {
        setTimeRemaining('')
        setProgress(0)
      }
    }

    // Update immediately
    updateTimer()

    // Update every second
    const interval = setInterval(updateTimer, 1000)

    return () => clearInterval(interval)
  }, [endTime, calculateFromNow])

  return { timeRemaining, progress }
}

/**
 * Calculate active round progress
 */
const useActiveRoundProgress = (startTime?: string, endTime?: string) => {
  const [timeRemaining, setTimeRemaining] = useState('')
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    if (!startTime || !endTime) {
      setTimeRemaining('')
      setProgress(0)
      return
    }

    const updateTimer = () => {
      const start = new Date(startTime).getTime()
      const end = new Date(endTime).getTime()
      const now = Date.now()
      const diff = end - now
      const total = end - start

      if (diff <= 0) {
        setTimeRemaining('00:00:00')
        setProgress(100)
        return
      }

      // Calculate remaining time
      const hours = Math.floor(diff / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((diff % (1000 * 60)) / 1000)

      setTimeRemaining(
        `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
      )

      // Calculate progress (elapsed percentage)
      const elapsed = now - start
      const progressPercent = Math.min(100, Math.max(0, (elapsed / total) * 100))
      setProgress(progressPercent)
    }

    // Update immediately
    updateTimer()

    // Update every second
    const interval = setInterval(updateTimer, 1000)

    return () => clearInterval(interval)
  }, [startTime, endTime])

  return { timeRemaining, progress }
}

export const RoundTimer: FC = memo(() => {
  const { currentRound, nextRound, isRoundActive } = useRoundTimer()

  // Active round: calculate elapsed progress
  const activeRound = useActiveRoundProgress(currentRound?.start_time, currentRound?.end_time)

  // Waiting: calculate time until start
  const waitingRound = useRealtimeCountdown(nextRound?.start_time, !currentRound && !!nextRound)

  const { timeRemaining: countdown, progress } = currentRound ? activeRound : waitingRound

  if (!currentRound) {
    if (!nextRound) {
      // No rounds at all
      return (
        <div
          style={{
            background: '#fff',
            border: '2px solid #e0e0e0',
            borderRadius: 12,
            padding: '24px',
            textAlign: 'center',
          }}
        >
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            <div style={{ fontSize: 64 }}>⏸️</div>
            <Title level={3} style={{ margin: 0 }}>
              활성 시련 없음
            </Title>
            <Text type="secondary">대기 중</Text>
          </Space>
        </div>
      )
    }

    // Waiting for next round
    return (
      <div
        style={{
          background: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
          border: '2px solid #81d4fa',
          borderRadius: 12,
          padding: '32px',
          color: '#333',
        }}
      >
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          {/* Header */}
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>⏳</div>
            <Title level={3} style={{ margin: 0, color: '#333' }}>
              다음 시련 대기 중
            </Title>
          </div>

          <Divider style={{ margin: 0, borderColor: 'rgba(0,0,0,0.1)' }} />

          {/* Circular Progress Timer */}
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ position: 'relative', display: 'inline-block' }}>
              <Progress
                type="circle"
                percent={100 - progress}
                format={() => (
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 12,
                        color: '#666',
                        marginBottom: 4,
                        display: 'block',
                      }}
                    >
                      시작까지
                    </Text>
                    <Text
                      style={{
                        fontSize: 32,
                        fontWeight: 'bold',
                        fontFamily: 'monospace',
                        color: '#333',
                        lineHeight: 1,
                      }}
                    >
                      {countdown}
                    </Text>
                  </div>
                )}
                strokeColor={{
                  '0%': '#52c41a',
                  '100%': '#1890ff',
                }}
                trailColor="rgba(0,0,0,0.1)"
                strokeWidth={8}
                width={280}
              />
            </div>
          </div>

          {/* Progress Bar */}
          <div style={{ padding: '0 20px' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: 12,
              }}
            >
              <Text style={{ fontSize: 12, color: 'rgba(0,0,0,0.6)' }}>지금</Text>
              <Text style={{ fontSize: 12, color: 'rgba(0,0,0,0.6)' }}>
                {Math.round(100 - waitingRound.progress)}% 남음
              </Text>
              <Text style={{ fontSize: 12, color: 'rgba(0,0,0,0.6)' }}>시작</Text>
            </div>
            <Progress
              percent={100 - waitingRound.progress}
              showInfo={false}
              strokeColor={{
                '0%': '#1890ff',
                '100%': '#52c41a',
              }}
              trailColor="rgba(0,0,0,0.1)"
              strokeWidth={12}
            />
          </div>

          {/* Next Round Info */}
          <div style={{ textAlign: 'center', marginTop: 8 }}>
            <Text style={{ display: 'block', fontSize: 12, color: 'rgba(0,0,0,0.6)' }}>
              다음 시련
            </Text>
            <Title level={4} style={{ margin: '8px 0', color: '#1890ff' }}>
              Round #{nextRound.round_number}
            </Title>
            {nextRound.trial_text && (
              <div
                style={{
                  padding: '12px',
                  background: 'rgba(24,144,255,0.1)',
                  borderRadius: 8,
                  marginTop: 12,
                }}
              >
                <Text style={{ fontSize: 14, color: 'rgba(0,0,0,0.85)' }}>
                  <span
                    dangerouslySetInnerHTML={{
                      __html: nextRound.trial_text.replace(/\n/g, '<br />'),
                    }}
                  />
                </Text>
              </div>
            )}
            <Text
              style={{ display: 'block', fontSize: 13, color: 'rgba(0,0,0,0.7)', marginTop: 8 }}
            >
              {new Date(nextRound.start_time).toLocaleString('ko-KR')} 시작
            </Text>
          </div>
        </Space>
      </div>
    )
  }

  return (
    <div
      style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        border: '2px solid #5a67d8',
        borderRadius: 12,
        padding: '32px',
        color: '#fff',
      }}
    >
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Space>
            <ClockCircleOutlined style={{ fontSize: 24, color: '#fff' }} />
            <Title level={3} style={{ margin: 0, color: '#fff' }}>
              Round #{currentRound.round_number}
            </Title>
          </Space>
          <Tag
            color={isRoundActive ? 'success' : 'default'}
            style={{ margin: 0, fontSize: 14, padding: '4px 12px' }}
          >
            {isRoundActive ? '진행 중' : currentRound.status}
          </Tag>
        </div>

        {isRoundActive && (
          <>
            <Divider style={{ margin: 0, borderColor: 'rgba(255,255,255,0.2)' }} />

            {/* Circular Progress Timer */}
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ position: 'relative', display: 'inline-block' }}>
                <Progress
                  type="circle"
                  percent={progress}
                  format={() => (
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 12,
                          color: '#666',
                          marginBottom: 4,
                          display: 'block',
                        }}
                      >
                        남은 시간
                      </Text>
                      <Text
                        style={{
                          fontSize: 32,
                          fontWeight: 'bold',
                          fontFamily: 'monospace',
                          color: '#333',
                          lineHeight: 1,
                        }}
                      >
                        {countdown}
                      </Text>
                    </div>
                  )}
                  strokeColor={{
                    '0%': '#667eea',
                    '100%': '#764ba2',
                  }}
                  trailColor="rgba(255,255,255,0.3)"
                  strokeWidth={8}
                  width={280}
                />
              </div>
            </div>

            {/* Progress Bar */}
            <div style={{ padding: '0 20px' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: 12,
                }}
              >
                <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)' }}>시작</Text>
                <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)' }}>
                  {Math.round(progress)}% 경과
                </Text>
                <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)' }}>종료</Text>
              </div>
              <Progress
                percent={progress}
                showInfo={false}
                strokeColor={{
                  '0%': '#52c41a',
                  '50%': '#faad14',
                  '100%': '#ff4d4f',
                }}
                trailColor="rgba(255,255,255,0.2)"
                strokeWidth={12}
              />
            </div>

            {/* Trial Text */}
            {currentRound.trial_text && (
              <div
                style={{
                  padding: '16px',
                  background: 'rgba(255,255,255,0.15)',
                  borderRadius: 8,
                  marginTop: 8,
                }}
              >
                <Text
                  style={{
                    display: 'block',
                    fontSize: 12,
                    color: 'rgba(255,255,255,0.8)',
                    marginBottom: 8,
                  }}
                >
                  시련 내용
                </Text>
                <Text style={{ fontSize: 15, color: '#fff', fontWeight: 500 }}>
                  <span
                    dangerouslySetInnerHTML={{
                      __html: currentRound.trial_text.replace(/\n/g, '<br />'),
                    }}
                  />
                </Text>
              </div>
            )}

            {/* Round Info */}
            <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: 8 }}>
              <div style={{ textAlign: 'center' }}>
                <Text style={{ display: 'block', fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>
                  시작 시간
                </Text>
                <Text style={{ display: 'block', fontSize: 13, color: '#fff', marginTop: 4 }}>
                  {new Date(currentRound.start_time).toLocaleTimeString('ko-KR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </div>
              <div style={{ textAlign: 'center' }}>
                <Text style={{ display: 'block', fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>
                  종료 시간
                </Text>
                <Text style={{ display: 'block', fontSize: 13, color: '#fff', marginTop: 4 }}>
                  {new Date(currentRound.end_time).toLocaleTimeString('ko-KR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </div>
            </div>
          </>
        )}
      </Space>
    </div>
  )
})
