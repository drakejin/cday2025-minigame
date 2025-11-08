import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { verifyAdmin } from '../_shared/adminAuth.ts'
import { errorResponse, successResponse } from '../_shared/response.ts'
import { withLogging } from '../_shared/withLogging.ts'

interface PromptWithRelations {
  id: string
  prompt_text: string
  round_number: number
  trial_no: number
  user_id: string
  character_id: string
  created_at: string
  characters: {
    id: string
    name: string
    user_id: string
  }
  profiles: {
    id: string
    email: string
    username: string
  }
}

serve(
  withLogging('admin-round-evaluator', async (req, logger) => {
    try {
      const { error, status, admin, supabase } = await verifyAdmin(req)
      logger.setUser(admin?.id, admin?.email)

      if (error || !admin || !supabase) {
        const errorMsg = error ?? 'UNAUTHORIZED'
        logger.logError(status, errorMsg)
        return errorResponse(errorMsg, status)
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
      const promptsData = (prompts as PromptWithRelations[]).map((p) => ({
        promptId: p.id,
        promptText: p.prompt_text,
        roundNumber: p.round_number,
        trialNo: p.trial_no,
        userId: p.user_id,
        characterId: p.character_id,
        characterName: p.characters.name,
        userEmail: p.profiles.email,
        username: p.profiles.username,
        createdAt: p.created_at,
      }))

      // 4. Claude API 호출
      const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY')
      if (!anthropicApiKey) {
        logger.logError(500, 'ANTHROPIC_API_KEY가 설정되지 않았습니다')
        return errorResponse('API_KEY_MISSING', 500, 'ANTHROPIC_API_KEY가 설정되지 않았습니다')
      }

      // Claude API에 보낼 메시지 구성
      const systemPrompt = `당신은 캐릭터 육성 게임의 프롬프트 평가 전문가입니다.

## 게임 규칙
- 플레이어는 30자 이내의 프롬프트로 캐릭터를 성장시킵니다
- 각 라운드마다 여러 시련(trial)이 있으며, 난이도에 따라 가중치가 다릅니다
- 프롬프트는 창의적이고 전략적이어야 하며, 캐릭터의 능력을 효과적으로 향상시켜야 합니다

## 평가 기준
1. **창의성 (Creativity)**: 독창적이고 흥미로운 접근 방식인가?
2. **전략성 (Strategy)**: 게임 진행에 도움이 되는 현명한 선택인가?
3. **규칙 준수 (Rule Compliance)**: 30자 제한과 게임 규칙을 준수하는가?
4. **명확성 (Clarity)**: 의도가 명확하고 이해하기 쉬운가?
5. **효과성 (Effectiveness)**: 캐릭터 성장에 실질적으로 도움이 될 것으로 예상되는가?

각 프롬프트를 위 5가지 기준으로 평가하고, 개선 제안과 함께 피드백을 제공해주세요.`

      const userPrompt = `# 라운드 ${round.round_number} 프롬프트 평가

총 ${promptsData.length}개의 프롬프트가 제출되었습니다.

${promptsData
  .map(
    (p, idx) => `
## ${idx + 1}. ${p.characterName} (${p.username || p.userEmail})
- **시련 번호**: Trial #${p.trialNo}
- **프롬프트**: "${p.promptText}"
- **글자 수**: ${p.promptText.length}자
- **제출 시간**: ${new Date(p.createdAt).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}
`
  )
  .join('\n')}

---

각 프롬프트에 대해 다음 형식으로 평가해주세요:

**프롬프트 #번호**
- 창의성: ⭐/5
- 전략성: ⭐/5
- 규칙 준수: ⭐/5
- 명확성: ⭐/5
- 효과성: ⭐/5
- **총평**: [간단한 평가]
- **개선 제안**: [구체적인 개선 방안]

마지막에 이번 라운드의 전체적인 트렌드와 특징, 그리고 가장 인상적인 프롬프트를 선정해주세요.`

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
