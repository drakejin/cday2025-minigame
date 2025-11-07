// @ts-nocheck
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { withLogging } from '../_shared/withLogging.ts'
import { errorResponse, successResponse } from '../_shared/response.ts'
import { verifyAdmin } from '../_shared/adminAuth.ts'
import { createSupabaseClient } from '../_shared/db.ts'

// Admin utility: re-evaluate all trial_results that are marked as needs_revalidation
serve(
  withLogging('re-evaluate-stale', async (req, logger) => {
    try {
      const { error, status, admin } = await verifyAdmin(req)
      logger.setUser(admin?.id, admin?.email)
      if (error || !admin) {
        return errorResponse(error || 'UNAUTHORIZED', status || 401)
      }

      const { character_id } = await req.json()
      logger.setRequestBody({ character_id })

      const supabase = createSupabaseClient()
      let query = supabase
        .from('trial_results')
        .select('id, trial_id, character_id, prompt_history_id')
        .eq('needs_revalidation', true)
      if (character_id) {
        query = query.eq('character_id', character_id)
      }
      const { data: results, error: listErr } = await query
      if (listErr) return errorResponse('LIST_FAILED', 500, listErr.message)

      const updated: string[] = []
      for (const r of results || []) {
        const { data: trial } = await supabase
          .from('trials')
          .select('*')
          .eq('id', r.trial_id)
          .maybeSingle()
        if (!trial) continue

        // Temporary randomized evaluation
        const score_strength = Math.floor(Math.random() * 30) + 5
        const score_dexterity = Math.floor(Math.random() * 30) + 5
        const score_constitution = Math.floor(Math.random() * 30) + 5
        const score_intelligence = Math.floor(Math.random() * 30) + 5
        const total = score_strength + score_dexterity + score_constitution + score_intelligence
        const weighted_total = total * (trial.weight_multiplier ?? 1)

        const { error: upErr } = await supabase
          .from('trial_results')
          .update({
            score_strength,
            score_dexterity,
            score_constitution,
            score_intelligence,
            total_score: total,
            weighted_total,
            needs_revalidation: false,
          })
          .eq('id', r.id)

        if (!upErr) updated.push(r.id)
      }

      logger.logSuccess(200, { updated_count: updated.length })
      return successResponse({ updated_count: updated.length })
    } catch (e) {
      return errorResponse('INTERNAL_ERROR', 500, (e as Error).message)
    }
  })
)
