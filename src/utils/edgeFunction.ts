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
    const errorObj = error as any

    // Log error structure for debugging
    console.log('[extractEdgeFunctionError] Error keys:', Object.keys(errorObj))
    console.log('[extractEdgeFunctionError] Error context:', errorObj.context)
    console.log('[extractEdgeFunctionError] Error message:', errorObj.message)

    // Check if context exists and contains response data
    if (errorObj.context) {
      try {
        // The context might contain the full response
        const context = errorObj.context
        console.log('[extractEdgeFunctionError] Context type:', typeof context)
        console.log('[extractEdgeFunctionError] Context:', context)

        // Try different possible locations for the response body
        if (context.json && typeof context.json === 'object') {
          console.log('[extractEdgeFunctionError] Found json in context:', context.json)
          if (context.json.message) return context.json.message
          if (context.json.error) return context.json.error
        }

        if (context.body) {
          const body = typeof context.body === 'string' ? JSON.parse(context.body) : context.body
          console.log('[extractEdgeFunctionError] Parsed body:', body)
          if (body?.message) return body.message
          if (body?.error) return body.error
        }
      } catch (e) {
        console.warn('[extractEdgeFunctionError] Failed to parse context:', e)
      }
    }

    // Fallback to error message
    if (errorObj.message) {
      return errorObj.message
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
export interface EdgeFunctionResponse<T = any> {
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
export function handleEdgeFunctionResponse<T = any>(
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
