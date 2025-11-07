import type { Trial } from '@/types'
import { handleEdgeFunctionResponse } from '@/utils/edgeFunction'
import { supabase } from './supabase'

export const trialService = {
  async getActiveRoundTrials(): Promise<{ round_id: string; trials: Trial[] }> {
    const { data, error } = await supabase.functions.invoke('get-round-trials')
    return handleEdgeFunctionResponse(data, error, 'Failed to get trials')
  },
  async getMyTrials(): Promise<{
    trials: Array<{
      id: string
      trial_id: string
      round_number: number | null
      trial_no: number
      level: number
      total_score: number
      weighted_total: number
      created_at: string
    }>
  }> {
    const { data, error } = await supabase.functions.invoke('get-my-trials')
    return handleEdgeFunctionResponse(data, error, 'Failed to get my trials')
  },

  // Admin
  async adminListTrialsByRoundNumber(roundNumber: number) {
    const { data, error } = await supabase.functions.invoke('admin-trials-list', {
      body: { round_number: roundNumber },
    })
    return handleEdgeFunctionResponse<{ trials: Trial[] }>(data, error, 'Failed to list trials')
  },
  async adminCreateTrial(params: {
    round_id: string
    trial_no: 1 | 2 | 3
    level: 1 | 2 | 3
    weight_multiplier?: 1 | 2 | 3 | 4
  }) {
    const { data, error } = await supabase.functions.invoke('admin-trials-create', {
      body: params,
    })
    return handleEdgeFunctionResponse<{ trial: Trial }>(data, error, 'Failed to create trial')
  },
  async adminDeleteTrial(trial_id: string) {
    const { data, error } = await supabase.functions.invoke('admin-trials-delete', {
      body: { trial_id },
    })
    return handleEdgeFunctionResponse<{ deleted: boolean }>(data, error, 'Failed to delete trial')
  },
}
