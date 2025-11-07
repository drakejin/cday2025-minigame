import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { verifyAdmin } from '../_shared/adminAuth.ts'
import { errorResponse, successResponse } from '../_shared/response.ts'
import { withLogging } from '../_shared/withLogging.ts'

serve(
  withLogging('admin-prompts-delete', async (req, logger) => {
    try {
      const { error, status, admin, supabase } = await verifyAdmin(req)
      logger.setUser(admin?.id, admin?.email)

      if (error || !admin || !supabase) {
        const errorMsg = error ?? 'UNAUTHORIZED'
        logger.logError(status, errorMsg)
        return errorResponse(errorMsg, status)
      }

      const { prompt_id, reason } = await req.json()
      logger.setRequestBody({ prompt_id, reason })

      if (!prompt_id) {
        logger.logError(400, 'prompt_id가 필요합니다')
        return errorResponse('INVALID_REQUEST', 400, 'prompt_id가 필요합니다')
      }

      // 1. 프롬프트 정보 조회
      const { data: prompt, error: fetchError } = await supabase
        .from('prompt_history')
        .select('*')
        .eq('id', prompt_id)
        .single()

      if (fetchError || !prompt) {
        logger.logError(404, '프롬프트를 찾을 수 없습니다')
        return errorResponse('PROMPT_NOT_FOUND', 404, '프롬프트를 찾을 수 없습니다')
      }

      if (prompt.is_deleted) {
        logger.logError(400, '이미 삭제된 프롬프트입니다')
        return errorResponse('ALREADY_DELETED', 400, '이미 삭제된 프롬프트입니다')
      }

      // 2. 소프트 삭제
      const { error: deleteError } = await supabase
        .from('prompt_history')
        .update({
          is_deleted: true,
          deleted_by: admin.id,
          deleted_at: new Date().toISOString(),
          delete_reason: reason || null,
        })
        .eq('id', prompt_id)

      if (deleteError) {
        logger.logError(500, deleteError.message)
        return errorResponse('DELETE_FAILED', 500, deleteError.message)
      }

      // 3. Audit log
      await supabase.from('admin_audit_log').insert({
        admin_id: admin.id,
        action: 'DELETE_PROMPT',
        resource_type: 'prompt_history',
        resource_id: prompt_id,
        changes: {
          prompt: prompt.prompt,
          character_id: prompt.character_id,
          round_number: prompt.round_number,
          reason,
        },
        ip_address: req.headers.get('x-forwarded-for') || 'unknown',
        user_agent: req.headers.get('user-agent'),
      })

      const responseData = {
        message: 'Prompt soft deleted successfully',
        prompt_id,
        deleted_at: new Date().toISOString(),
      }
      logger.logSuccess(200, responseData)
      return successResponse(responseData)
    } catch (error) {
      logger.logError(500, (error as Error).message)
      return errorResponse('INTERNAL_ERROR', 500, (error as Error).message)
    }
  })
)
