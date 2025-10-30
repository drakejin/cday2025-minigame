import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { handleCors } from '../_shared/cors.ts'
import { errorResponse, successResponse } from '../_shared/response.ts'
import { verifyAdmin } from '../_shared/adminAuth.ts'
import { keysToCamelCase } from '../_shared/camelCase.ts'

serve(async (req) => {
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  try {
    const { error, status, admin, supabase } = await verifyAdmin(req, 'users')
    if (error || !admin || !supabase) {
      return errorResponse(error!, status)
    }

    const { user_id } = await req.json()

    if (!user_id) {
      return errorResponse('INVALID_REQUEST', 400, 'user_id가 필요합니다')
    }

    // 1. 캐릭터 정보
    const { data: character, error: charError } = await supabase
      .from('characters')
      .select('*')
      .eq('user_id', user_id)
      .maybeSingle()

    if (charError) {
      return errorResponse('DATABASE_ERROR', 500, charError.message)
    }

    // 2. 프롬프트 히스토리 (최근 10개)
    const { data: prompts } = await supabase
      .from('prompt_history')
      .select('*')
      .eq('user_id', user_id)
      .order('created_at', { ascending: false })
      .limit(10)

    // 3. 통계
    const { count: promptCount } = await supabase
      .from('prompt_history')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user_id)

    // 4. Auth 정보
    const { data: authUser } = await supabase.auth.admin.getUserById(user_id)

    return successResponse({
      user: keysToCamelCase(character || {}),
      characters: keysToCamelCase(characters || []),
      prompts: keysToCamelCase(prompts || []),
    })
  } catch (error) {
    return errorResponse('INTERNAL_ERROR', 500, (error as Error).message)
  }
})
