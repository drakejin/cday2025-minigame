import { supabase } from './supabase'

/**
 * Admin Service
 * All admin operations through Edge Functions
 */
export const adminService = {
  // ==================== Round Management ====================
  async createRound(startTime: string, endTime: string, trialText?: string) {
    const { data, error } = await supabase.functions.invoke('admin-rounds-create', {
      body: { start_time: startTime, end_time: endTime, trial_text: trialText },
    })
    if (error) throw error
    if (!data.success) throw new Error(data.message || data.error || 'Failed to create round')
    return data.data
  },

  async startRound(roundId: string) {
    const { data, error } = await supabase.functions.invoke('admin-rounds-start', {
      body: { round_id: roundId },
    })
    if (error) throw error
    if (!data.success) throw new Error(data.message || data.error || 'Failed to start round')
    return data.data
  },

  async endRound(roundId: string) {
    const { data, error } = await supabase.functions.invoke('admin-rounds-end', {
      body: { round_id: roundId },
    })
    if (error) throw error
    if (!data.success) throw new Error(data.message || data.error || 'Failed to end round')
    return data.data
  },

  async extendRound(roundId: string, newEndTime: string) {
    const { data, error } = await supabase.functions.invoke('admin-rounds-extend', {
      body: { round_id: roundId, new_end_time: newEndTime },
    })
    if (error) throw error
    if (!data.success) throw new Error(data.message || data.error || 'Failed to extend round')
    return data.data
  },

  async cancelRound(roundId: string, reason?: string) {
    const { data, error } = await supabase.functions.invoke('admin-rounds-cancel', {
      body: { round_id: roundId, reason },
    })
    if (error) throw error
    if (!data.success) throw new Error(data.message || data.error || 'Failed to cancel round')
    return data.data
  },

  async listRounds(statusFilter?: string, limit = 50, offset = 0) {
    const { data, error } = await supabase.functions.invoke('admin-rounds-list', {
      body: { statusFilter, limit, offset },
    })
    if (error) throw error
    if (!data.success) throw new Error(data.message || data.error || 'Failed to list rounds')
    return data.data
  },

  async evaluateRound(roundId: string) {
    const { data, error } = await supabase.functions.invoke('admin-round-evaluator', {
      body: { round_id: roundId },
    })
    if (error) throw error
    if (!data.success) throw new Error(data.message || data.error || 'Failed to evaluate round')
    return data.data
  },

  // ==================== Prompt Management ====================
  async listPrompts(userId?: string, roundNumber?: number, limit = 50, offset = 0) {
    const { data, error } = await supabase.functions.invoke('admin-prompts-list', {
      body: { user_id: userId, round_number: roundNumber, limit, offset },
    })
    if (error) throw error
    if (!data.success) throw new Error(data.message || data.error || 'Failed to list prompts')
    return data.data
  },

  async deletePrompt(promptId: string, reason: string) {
    const { data, error } = await supabase.functions.invoke('admin-prompts-delete', {
      body: { prompt_id: promptId, reason },
    })
    if (error) throw error
    if (!data.success) throw new Error(data.message || data.error || 'Failed to delete prompt')
    return data.data
  },

  // ==================== User Management ====================
  async listUsers(search?: string, limit = 50, offset = 0) {
    const { data, error } = await supabase.functions.invoke('admin-users-list', {
      body: { search, limit, offset },
    })
    if (error) throw error
    if (!data.success) throw new Error(data.message || data.error || 'Failed to list users')
    return data.data
  },

  async getUserDetail(userId: string) {
    const { data, error } = await supabase.functions.invoke('admin-users-detail', {
      body: { user_id: userId },
    })
    if (error) throw error
    if (!data.success) throw new Error(data.message || data.error || 'Failed to get user detail')
    return data.data
  },

  async banUser(userId: string, reason: string, durationHours?: number) {
    const { data, error } = await supabase.functions.invoke('admin-users-ban', {
      body: { user_id: userId, reason, duration_hours: durationHours },
    })
    if (error) throw error
    if (!data.success) throw new Error(data.message || data.error || 'Failed to ban user')
    return data.data
  },

  async unbanUser(userId: string) {
    const { data, error } = await supabase.functions.invoke('admin-users-unban', {
      body: { user_id: userId },
    })
    if (error) throw error
    if (!data.success) throw new Error(data.message || data.error || 'Failed to unban user')
    return data.data
  },

  // ==================== Statistics ====================
  async getOverallStats() {
    const { data, error } = await supabase.functions.invoke('admin-stats', {})
    if (error) throw error
    if (!data.success) throw new Error(data.message || data.error || 'Failed to get stats')
    return data.data
  },

  async getRoundStatsByRoundId(roundId: string) {
    // ID를 기반으로 round number를 가져와서 stats를 조회
    // 임시로 ID를 그대로 number로 사용 (실제로는 round 조회 필요)
    const roundNumber = Number.parseInt(roundId, 10)
    const { data, error } = await supabase.functions.invoke('admin-stats-rounds', {
      body: { round_number: roundNumber },
    })
    if (error) throw error
    if (!data.success) throw new Error(data.message || data.error || 'Failed to get round stats')
    return data.data
  },

  // ==================== Audit Log ====================
  async getAuditLog(filters?: {
    action?: string
    adminId?: string
    resourceType?: string
    startDate?: string
    endDate?: string
    limit?: number
    offset?: number
  }) {
    const { data, error } = await supabase.functions.invoke('admin-audit-log', {
      body: {
        action: filters?.action,
        admin_id: filters?.adminId,
        resource_type: filters?.resourceType,
        start_date: filters?.startDate,
        end_date: filters?.endDate,
        limit: filters?.limit || 50,
        offset: filters?.offset || 0,
      },
    })
    if (error) throw error
    if (!data.success) throw new Error(data.message || data.error || 'Failed to get audit log')
    return data.data
  },
}
