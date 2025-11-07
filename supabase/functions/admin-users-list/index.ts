import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { verifyAdmin } from '../_shared/adminAuth.ts'
import { errorResponse, successResponse } from '../_shared/response.ts'
import { withLogging } from '../_shared/withLogging.ts'
import { keysToCamelCase } from '../_shared/camelCase.ts'

serve(
  withLogging('admin-users-list', async (req, logger) => {
    try {
      const { error, status, admin, supabase } = await verifyAdmin(req)
      logger.setUser(admin?.id, admin?.email)

      if (error || !admin || !supabase) {
        const errorMsg = error ?? 'UNAUTHORIZED'
        logger.logError(status, errorMsg)
        return errorResponse(errorMsg, status)
      }

      const { search, limit = 50, offset = 0 } = await req.json()
      logger.setRequestBody({ search, limit, offset })

      let query = supabase.from('profiles').select(
        `
        id,
        email,
        display_name,
        avatar_url,
        role,
        created_at,
        updated_at,
        characters(
          id,
          name,
          total_score,
          is_active
        )
      `,
        { count: 'exact' }
      )

      // 검색 (이메일 또는 이름으로)
      if (search) {
        query = query.or(`email.ilike.%${search}%,display_name.ilike.%${search}%`)
      }

      query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1)

      const { data: profiles, error: queryError, count } = await query

      if (queryError) {
        logger.logError(500, queryError.message)
        return errorResponse('DATABASE_ERROR', 500, queryError.message)
      }

      // Get prompt counts for each user
      const userIds = (profiles || []).map((p: any) => p.id)
      const { data: promptCounts } = await supabase
        .from('prompt_history')
        .select('user_id')
        .in('user_id', userIds)
        .eq('is_deleted', false)

      const promptCountMap = (promptCounts || []).reduce((acc: any, p: any) => {
        acc[p.user_id] = (acc[p.user_id] || 0) + 1
        return acc
      }, {})

      // Transform data to include aggregated info
      const users = (profiles || []).map((profile: any) => ({
        id: profile.id,
        userId: profile.id,
        email: profile.email,
        name: profile.display_name,
        avatarUrl: profile.avatar_url,
        role: profile.role,
        isBanned: false, // TODO: Add ban functionality to DB
        characterCount: profile.characters?.length || 0,
        promptCount: promptCountMap[profile.id] || 0,
        totalScore: Math.max(...(profile.characters?.map((c: any) => c.total_score) || [0])),
        createdAt: profile.created_at,
        updatedAt: profile.updated_at,
      }))

      const responseData = {
        users: keysToCamelCase(users),
        total: count || 0,
        limit,
        offset,
      }
      logger.logSuccess(200, responseData)
      return successResponse(responseData)
    } catch (error) {
      logger.logError(500, (error as Error).message)
      return errorResponse('INTERNAL_ERROR', 500, (error as Error).message)
    }
  })
)
