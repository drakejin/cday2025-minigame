import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { successResponse } from '../_shared/response.ts'

const EDGE_FUNCTIONS = [
  // Admin Functions
  'admin-audit-log',
  'admin-prompts-delete',
  'admin-prompts-list',
  'admin-round-evaluator',
  'admin-rounds-cancel',
  'admin-rounds-create',
  'admin-rounds-end',
  'admin-rounds-extend',
  'admin-rounds-list',
  'admin-rounds-start',
  'admin-stats',
  'admin-stats-rounds',
  'admin-trials-create',
  'admin-trials-delete',
  'admin-trials-list',
  'admin-trials-update',
  'admin-users-ban',
  'admin-users-detail',
  'admin-users-list',
  'admin-users-unban',
  // User Functions
  'create-character',
  'get-characters-ranking',
  'get-current-round',
  'get-my-character',
  'get-my-character-stats',
  'get-my-plan',
  'get-my-profile',
  'get-my-rank',
  'get-my-round-history',
  'get-my-trials',
  'get-round-trials',
  'submit-prompt',
  'update-character-name',
  'update-profile',
  'upsert-plan',
]

serve(async (req) => {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')

    if (!supabaseUrl) {
      throw new Error('SUPABASE_URL not found')
    }

    const startTime = Date.now()
    const results = await Promise.allSettled(
      EDGE_FUNCTIONS.map(async (functionName) => {
        const url = `${supabaseUrl}/functions/v1/${functionName}`

        try {
          const response = await fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({}),
            signal: AbortSignal.timeout(5000), // 5초 타임아웃
          })

          return {
            function: functionName,
            status: response.status,
            success: true,
          }
        } catch (error) {
          // 에러가 나도 괜찮음 (인증 실패 등) - cold start만 방지하면 됨
          return {
            function: functionName,
            status: 0,
            success: false,
            error: (error as Error).message,
          }
        }
      })
    )

    const duration = Date.now() - startTime
    const summary = {
      total: results.length,
      warmed: results.filter((r) => r.status === 'fulfilled').length,
      duration_ms: duration,
      timestamp: new Date().toISOString(),
      details: results.map((result) => {
        if (result.status === 'fulfilled') {
          return result.value
        }
        return {
          function: 'unknown',
          success: false,
          error: 'Promise rejected',
        }
      }),
    }

    return successResponse(summary)
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: (error as Error).message,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
})
