import { useState, useEffect } from 'react'
import type { FC } from 'react'
import { Space, Typography } from 'antd'
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

const { Title } = Typography

export interface TrialData {
  baseStats?: Record<string, number | null>
  bonusStats?: [string | null, string | null]
  skill: string
}

export const Dashboard: FC = () => {
  const { data: character, isLoading: characterLoading } = useMyCharacter()
  const [trialData, setTrialData] = useState<Record<number, TrialData>>({})
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
      const { data: plan } = await supabase
        .from('character_plans')
        .select('*')
        .eq('character_id', character.id)
        .maybeSingle()

      if (plan) {
        const loaded: Record<number, TrialData> = {}

        // Load trial 1
        if (plan.lv1_str) {
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
      }
      setIsLoadingPlan(false)
    }

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
        {character ? <CharacterCard character={character} /> : <CharacterCreationForm />}
        <StatInput trialData={trialData} setTrialData={setTrialData} />
        <PromptInput trialData={trialData} />
      </Space>
    </MainLayout>
  )
}
