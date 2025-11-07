import { useState, useEffect } from 'react'
import type { FC } from 'react'
import { Space, Typography, Input } from 'antd'
import { MainLayout } from '@/components/layout/MainLayout'
import { RoundTimer } from '@/components/game/RoundTimer'
import { CharacterCard } from '@/components/character/CharacterCard'
import { CharacterCreationForm } from '@/components/character/CharacterCreationForm'
import { StatInput } from '@/components/character/StatInput'
import { PromptInput } from '@/components/character/PromptInput'
import { useMyCharacter } from '@/hooks/queries/useCharacterQuery'
import { Loading } from '@/components/common/Loading'
import { useRealtimeRound } from '@/hooks/useRealtimeRound'
import { supabase } from '@/services/supabase'

const { Title, Text } = Typography
const { TextArea } = Input

export interface TrialData {
  baseStats?: Record<string, number | null>
  bonusStats?: [string | null, string | null]
  skill: string
}

export const Dashboard: FC = () => {
  const { data: character, isLoading: characterLoading } = useMyCharacter()
  const [trialData, setTrialData] = useState<Record<number, TrialData>>({})
  const [prompt, setPrompt] = useState('')
  const [isLoadingPlan, setIsLoadingPlan] = useState(true)

  // Subscribe to real-time updates
  useRealtimeRound()

  // Load existing character plan
  useEffect(() => {
    if (!character?.id) {
      setIsLoadingPlan(false)
      return
    }

    const loadPlan = async () => {
      const { data, error } = await supabase.functions.invoke('get-my-character-plan')

      if (error) {
        setTrialData({})
        setIsLoadingPlan(false)
        return
      }

      const plan = data?.data || data

      if (plan) {
        const loaded: Record<number, TrialData> = {}

        // Load trial 1
        if (plan.lv1_str !== null && plan.lv1_str !== undefined) {
          loaded[1] = {
            baseStats: {
              str: plan.lv1_str,
              dex: plan.lv1_dex,
              con: plan.lv1_con,
              int: plan.lv1_int,
            },
            skill: plan.lv1_skill || '',
          }
        }

        // Load trial 2
        if (plan.lv2_skill) {
          const bonusStats: string[] = []
          if (plan.lv2_str) bonusStats.push('str')
          if (plan.lv2_dex) bonusStats.push('dex')
          if (plan.lv2_con) bonusStats.push('con')
          if (plan.lv2_int) bonusStats.push('int')
          loaded[2] = {
            bonusStats: [bonusStats[0] || null, bonusStats[1] || null],
            skill: plan.lv2_skill,
          }
        }

        // Load trial 3
        if (plan.lv3_skill) {
          const bonusStats: string[] = []
          if (plan.lv3_str) bonusStats.push('str')
          if (plan.lv3_dex) bonusStats.push('dex')
          if (plan.lv3_con) bonusStats.push('con')
          if (plan.lv3_int) bonusStats.push('int')
          loaded[3] = {
            bonusStats: [bonusStats[0] || null, bonusStats[1] || null],
            skill: plan.lv3_skill,
          }
        }

        setTrialData(loaded)
      } else {
        setTrialData({})
      }
      setIsLoadingPlan(false)
    }

    setIsLoadingPlan(true)
    loadPlan()
  }, [character?.id])

  if (characterLoading || isLoadingPlan) {
    return <Loading fullscreen tip="로딩 중..." />
  }

  return (
    <MainLayout>
      <Title level={2}>게임</Title>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <RoundTimer />
        {character ? (
          <>
            <CharacterCard character={character} />
            <div
              style={{
                background: '#fff',
                border: '1px solid #e0e0e0',
                borderRadius: 8,
                padding: '20px',
              }}
            >
              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                <Text strong>캐릭터를 성장시킬 프롬프트 (최대 30자)</Text>
                <TextArea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="예: 용감한 전사가 되어라"
                  maxLength={30}
                  rows={3}
                  style={{ fontSize: 14 }}
                />
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {prompt.length}/30자
                </Text>
              </Space>
            </div>
            <StatInput trialData={trialData} setTrialData={setTrialData} />
            <PromptInput
              trialData={trialData}
              prompt={prompt}
              onSubmitSuccess={() => {
                setPrompt('')
                // Force reload by updating character query
                window.location.reload()
              }}
            />
          </>
        ) : (
          <CharacterCreationForm />
        )}
      </Space>
    </MainLayout>
  )
}
