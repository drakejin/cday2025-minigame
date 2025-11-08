import type { CharacterPlan } from '@/types'
import { handleEdgeFunctionResponse } from '@/utils/edgeFunction'
import { supabase } from './supabase'

export const planService = {
  async getMyPlan(): Promise<{ character_id: string; plan: CharacterPlan | null }> {
    const { data, error } = await supabase.functions.invoke('get-my-plan', {})
    return handleEdgeFunctionResponse(data, error, 'Failed to get plan')
  },

  async upsertPlan(plan: Omit<CharacterPlan, 'id' | 'character_id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase.functions.invoke('upsert-plan', {
      body: plan,
    })
    return handleEdgeFunctionResponse<{ plan: CharacterPlan }>(data, error, 'Failed to save plan')
  },
}
