import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { handleCors } from '../_shared/cors.ts'
import { successResponse, errorResponse } from '../_shared/response.ts'
import { createSupabaseClient } from '../_shared/db.ts'

serve(async (req) => {
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  try {
    const supabase = createSupabaseClient()
    const url = new URL(req.url)
    const limit = parseInt(url.searchParams.get('limit') || '100')
    const offset = parseInt(url.searchParams.get('offset') || '0')

    const { data: characters, error, count } = await supabase
      .from('characters')
      .select(`
        id,
        name,
        current_prompt,
        total_score,
        strength,
        charm,
        creativity,
        profiles:user_id (
          display_name,
          avatar_url
        )
      `, { count: 'exact' })
      .eq('is_active', true)
      .order('total_score', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      return errorResponse('DATABASE_ERROR', 500, error.message)
    }

    const leaderboard = characters?.map((char: any, index: number) => ({
      rank: offset + index + 1,
      character_id: char.id,
      character_name: char.name,
      display_name: char.profiles?.display_name || 'u…',
      avatar_url: char.profiles?.avatar_url || null,
      total_score: char.total_score,
      strength: char.strength,
      charm: char.charm,
      creativity: char.creativity,
      current_prompt: char.current_prompt,
    })) || []

    return successResponse({
      data: leaderboard,
      pagination: {
        total: count || 0,
        limit,
        offset,
      },
    })
  } catch (error) {
    return errorResponse('INTERNAL_ERROR', 500, (error as Error).message)
  }
})
