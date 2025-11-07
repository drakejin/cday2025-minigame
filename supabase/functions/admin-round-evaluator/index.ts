import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { errorResponse, successResponse } from '../_shared/response.ts'
import { verifyAdmin } from '../_shared/adminAuth.ts'
import { withLogging } from '../_shared/withLogging.ts'

serve(
  withLogging('admin-round-evaluator', async (req, logger) => {
    try {
      const { error, status, admin, supabase } = await verifyAdmin(req)
      logger.setUser(admin?.id, admin?.email)

      if (error || !admin || !supabase) {
        logger.logError(status, error!)
        return errorResponse(error!, status)
      }

      const { round_id } = await req.json()
      logger.setRequestBody({ round_id })

      if (!round_id) {
        logger.logError(400, 'round_id가 필요합니다')
        return errorResponse('INVALID_REQUEST', 400, 'round_id가 필요합니다')
      }

      // 1. 시련 정보 조회
      const { data: round, error: roundError } = await supabase
        .from('game_rounds')
        .select('id, round_number, status')
        .eq('id', round_id)
        .single()

      if (roundError || !round) {
        logger.logError(404, '시련를 찾을 수 없습니다')
        return errorResponse('ROUND_NOT_FOUND', 404, '시련를 찾을 수 없습니다')
      }

      // 2. 해당 시련에 제출된 프롬프트 정보 조회
      const { data: prompts, error: promptsError } = await supabase
        .from('prompt_history')
        .select(
          `
          id,
          prompt_text,
          round_number,
          trial_no,
          user_id,
          character_id,
          created_at,
          characters!inner(
            id,
            name,
            user_id
          ),
          profiles!inner(
            id,
            email,
            username
          )
        `
        )
        .eq('round_number', round.round_number)
        .order('created_at', { ascending: true })

      if (promptsError) {
        logger.logError(500, promptsError.message)
        return errorResponse('DATABASE_ERROR', 500, promptsError.message)
      }

      if (!prompts || prompts.length === 0) {
        logger.logError(404, '해당 시련에 제출된 프롬프트가 없습니다')
        return errorResponse('NO_PROMPTS_FOUND', 404, '해당 시련에 제출된 프롬프트가 없습니다')
      }

      // 3. Claude API 호출을 위한 데이터 준비
      const promptsData = prompts.map((p) => ({
        promptId: p.id,
        promptText: p.prompt_text,
        roundNumber: p.round_number,
        trialNo: p.trial_no,
        userId: p.user_id,
        characterId: p.character_id,
        characterName: (p.characters as any)?.name,
        userEmail: (p.profiles as any)?.email,
        username: (p.profiles as any)?.username,
        createdAt: p.created_at,
      }))

      // 4. Claude API 호출
      const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY')
      if (!anthropicApiKey) {
        logger.logError(500, 'ANTHROPIC_API_KEY가 설정되지 않았습니다')
        return errorResponse('API_KEY_MISSING', 500, 'ANTHROPIC_API_KEY가 설정되지 않았습니다')
      }

      // Claude API에 보낼 메시지 구성
      const systemPrompt = `당신은 게임 시련의 프롬프트들을 평가하는 AI입니다.
각 프롬프트의 창의성, 적절성, 게임 규칙 준수 여부를 평가해주세요.`

      const userPrompt = `다음은 시련 ${round.round_number}에 제출된 프롬프트들입니다:

${promptsData
  .map(
    (p, idx) => `
${idx + 1}. 캐릭터: ${p.characterName}
   사용자: ${p.username || p.userEmail}
   시련 번호: ${p.trialNo}
   프롬프트: ${p.promptText}
   제출 시간: ${p.createdAt}
`
  )
  .join('\n')}

각 프롬프트를 평가해주세요.`

      const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': anthropicApiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 4096,
          system: systemPrompt,
          messages: [
            {
              role: 'user',
              content: userPrompt,
            },
          ],
        }),
      })

      if (!claudeResponse.ok) {
        const errorText = await claudeResponse.text()
        logger.logError(claudeResponse.status, `Claude API 호출 실패: ${errorText}`)
        return errorResponse(
          'CLAUDE_API_ERROR',
          claudeResponse.status,
          `Claude API 호출 실패: ${errorText}`
        )
      }

      const claudeData = await claudeResponse.json()
      const evaluation = claudeData.content[0].text

      // 5. 평가 결과 저장 (audit log에 기록)
      await supabase.from('admin_audit_log').insert({
        admin_id: admin.id,
        action: 'EVALUATE_ROUND',
        resource_type: 'game_rounds',
        resource_id: round_id,
        changes: {
          round_number: round.round_number,
          prompts_count: prompts.length,
          evaluation_result: evaluation,
        },
        ip_address: req.headers.get('x-forwarded-for') || 'unknown',
        user_agent: req.headers.get('user-agent'),
      })

      const responseData = {
        round,
        promptsCount: prompts.length,
        prompts: promptsData,
        evaluation,
      }

      logger.logSuccess(200, responseData)
      return successResponse(responseData)
    } catch (error) {
      const errorMsg = (error as Error).message
      logger.logError(500, errorMsg)
      return errorResponse('INTERNAL_ERROR', 500, errorMsg)
    }
  })
)
