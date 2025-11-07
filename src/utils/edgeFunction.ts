// import type { FunctionsHttpError } from '@supabase/supabase-js'

/**
 * Extract error message from Supabase Edge Function error
 * Handles FunctionsHttpError which contains the response body
 */
export function extractEdgeFunctionError(error: unknown): string {
  if (!error) return 'Unknown error'

  console.log('[extractEdgeFunctionError] Received error:', error)

  // Try to access error details from FunctionsHttpError
  if (typeof error === 'object' && error !== null) {
    const errorObj = error as Record<string, unknown>

    // Log error structure for debugging
    console.log('[extractEdgeFunctionError] Error keys:', Object.keys(errorObj))

    const context = errorObj.context as Record<string, unknown> | undefined
    if (context) {
      console.log('[extractEdgeFunctionError] Error context:', context.body)
    }

    const message = errorObj.message
    if (typeof message === 'string') {
      console.log('[extractEdgeFunctionError] Error message:', message)
    }

    // Check if context exists and contains response data
    if (context) {
      try {
        console.log('[extractEdgeFunctionError] Context type:', typeof context)
        console.log('[extractEdgeFunctionError] Context:', context)

        // Try different possible locations for the response body
        const contextJson = context.json as Record<string, unknown> | undefined
        if (contextJson && typeof contextJson === 'object') {
          console.log('[extractEdgeFunctionError] Found json in context:', contextJson)
          if (typeof contextJson.message === 'string') return contextJson.message
          if (typeof contextJson.error === 'string') return contextJson.error
        }

        if (context.body) {
          const body = typeof context.body === 'string' ? JSON.parse(context.body) : context.body
          console.log('[extractEdgeFunctionError] Parsed body:', body)
          if (body?.message && typeof body.message === 'string') return body.message
          if (body?.error && typeof body.error === 'string') return body.error
        }
      } catch (e) {
        console.warn('[extractEdgeFunctionError] Failed to parse context:', e)
      }
    }

    // Fallback to error message
    if (typeof message === 'string') {
      return message
    }
  }

  // Error is just a string
  if (typeof error === 'string') {
    return error
  }

  // Fallback
  return 'Unknown error occurred'
}

/**
 * Standard response type from Edge Functions
 */
export interface EdgeFunctionResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

/**
 * Handle Edge Function response with proper error extraction
 *
 * Error priority:
 * 1. Response body message (data.message)
 * 2. Error object from HTTP error
 * 3. Fallback message
 */
export function handleEdgeFunctionResponse<T = unknown>(
  data: EdgeFunctionResponse<T> | null,
  error: unknown,
  fallbackMessage: string
): T {
  // Priority 1: Check response body message first
  if (data?.message) {
    throw new Error(data.message)
  }

  // Priority 2: Check error object
  if (error) {
    const errorMessage = extractEdgeFunctionError(error)
    throw new Error(errorMessage)
  }

  // Handle business logic errors from response body
  if (!data?.success) {
    // Priority 3: Fallback message
    throw new Error(fallbackMessage)
  }

  // Success case
  if (!data.data) {
    throw new Error(fallbackMessage)
  }

  return data.data
}
