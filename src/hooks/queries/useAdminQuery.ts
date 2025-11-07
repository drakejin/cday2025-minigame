import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminService } from '@/services/admin.service'
import { queryKeys } from '@/lib/queryKeys'

/**
 * Admin Rounds Queries
 */
export const useAdminRounds = () => {
  return useQuery({
    queryKey: queryKeys.admin.rounds,
    queryFn: () => adminService.listRounds(),
    staleTime: 1000 * 30, // 30 seconds
  })
}

export const useCreateRound = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      startTime,
      endTime,
      notes,
    }: {
      startTime: string
      endTime: string
      notes?: string
    }) => adminService.createRound(startTime, endTime, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.rounds })
      queryClient.invalidateQueries({ queryKey: queryKeys.round.all })
    },
  })
}

export const useStartRound = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (roundId: string) => adminService.startRound(roundId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.rounds })
      queryClient.invalidateQueries({ queryKey: queryKeys.round.all })
    },
  })
}

export const useEndRound = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (roundId: string) => adminService.endRound(roundId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.rounds })
      queryClient.invalidateQueries({ queryKey: queryKeys.round.all })
    },
  })
}

export const useCancelRound = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (roundId: string) => adminService.cancelRound(roundId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.rounds })
      queryClient.invalidateQueries({ queryKey: queryKeys.round.all })
    },
  })
}

export const useExtendRound = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ roundId, newEndTime }: { roundId: string; newEndTime: string }) =>
      adminService.extendRound(roundId, newEndTime),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.rounds })
      queryClient.invalidateQueries({ queryKey: queryKeys.round.all })
    },
  })
}

export const useEvaluateRound = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (roundId: string) => adminService.evaluateRound(roundId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.rounds })
    },
  })
}

/**
 * Admin Prompts Queries
 */
export const useAdminPrompts = (filters?: {
  userId?: string
  roundNumber?: number
  limit?: number
  offset?: number
}) => {
  return useQuery({
    queryKey: queryKeys.admin.prompts(filters),
    queryFn: () =>
      adminService.listPrompts(
        filters?.userId,
        filters?.roundNumber,
        filters?.limit,
        filters?.offset
      ),
    staleTime: 1000 * 30,
  })
}

export const useDeletePrompt = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ promptId, reason }: { promptId: string; reason: string }) =>
      adminService.deletePrompt(promptId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.prompts() })
    },
  })
}

/**
 * Admin Users Queries
 */
export const useAdminUsers = (filters?: { search?: string; limit?: number; offset?: number }) => {
  return useQuery({
    queryKey: queryKeys.admin.users(filters),
    queryFn: () => adminService.listUsers(filters?.search, filters?.limit, filters?.offset),
    staleTime: 1000 * 30,
  })
}

export const useAdminUserDetail = (userId?: string) => {
  return useQuery({
    queryKey: queryKeys.admin.user(userId!),
    queryFn: () => adminService.getUserDetail(userId!),
    enabled: !!userId,
    staleTime: 1000 * 30,
  })
}

export const useBanUser = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ userId, reason }: { userId: string; reason: string }) =>
      adminService.banUser(userId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.users() })
    },
  })
}

export const useUnbanUser = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (userId: string) => adminService.unbanUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.users() })
    },
  })
}

/**
 * Admin Stats Queries
 */

export const useAdminStatsRounds = (roundId?: string) => {
  return useQuery({
    queryKey: queryKeys.admin.statsRounds(roundId),
    queryFn: () => adminService.getRoundStatsByRoundId(roundId!),
    enabled: !!roundId,
    staleTime: 1000 * 60,
  })
}
