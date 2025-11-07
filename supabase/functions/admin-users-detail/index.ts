import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { verifyAdmin } from '../_shared/adminAuth.ts'
import { errorResponse, successResponse } from '../_shared/response.ts'
import { withLogging } from '../_shared/withLogging.ts'
import { keysToCamelCase } from '../_shared/camelCase.ts'

serve(
  withLogging('admin-users-detail', async (req, logger) => {
    try {
      const { error, status, admin, supabase } = await verifyAdmin(req)
      logger.setUser(admin?.id, admin?.email)

      if (error || !admin || !supabase) {
        const errorMsg = error ?? 'UNAUTHORIZED'
        logger.logError(status, errorMsg)
        return errorResponse(errorMsg, status)
      }

      const { user_id } = await req.json()
      logger.setRequestBody({ user_id })

      if (!user_id) {
        logger.logError(400, 'user_id가 필요합니다')
        return errorResponse('INVALID_REQUEST', 400, 'user_id가 필요합니다')
      }

      // 모든 쿼리를 병렬로 실행
      const [
        { data: character, error: charError },
        { data: prompts },
        { count: promptCount },
        { data: authUser },
      ] = await Promise.all([
        // 1. 캐릭터 정보
        supabase.from('characters').select('*').eq('user_id', user_id).maybeSingle(),
        // 2. 프롬프트 히스토리 (최근 10개)
        supabase
          .from('prompt_history')
          .select('*')
          .eq('user_id', user_id)
          .order('created_at', { ascending: false })
          .limit(10),
        // 3. 통계
        supabase.from('prompt_history').select('*', { count: 'exact', head: true }).eq('user_id', user_id),
        // 4. Auth 정보
        supabase.auth.admin.getUserById(user_id),
      ])

      if (charError) {
        logger.logError(500, charError.message)
        return errorResponse('DATABASE_ERROR', 500, charError.message)
      }

      const responseData = {
        user: keysToCamelCase(character || {}),
        prompts: keysToCamelCase(prompts || []),
        stats: {
          promptCount: promptCount || 0,
        },
        auth: authUser?.user
          ? {
              id: authUser.user.id,
              email: authUser.user.email,
              createdAt: authUser.user.created_at,
            }
          : null,
      }
      logger.logSuccess(200, responseData)
      return successResponse(responseData)
    } catch (error) {
      logger.logError(500, (error as Error).message)
      return errorResponse('INTERNAL_ERROR', 500, (error as Error).message)
    }
  })
)
