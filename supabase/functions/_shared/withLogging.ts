/**
 * Higher-order function wrapper that adds logging to Edge Functions
 * Automatically logs request/response/duration for all functions
 */

import { handleCors } from './cors.ts'
import { RequestLogger } from './logger.ts'
import { errorResponse } from './response.ts'

export type HandlerFunction = (req: Request, logger: RequestLogger) => Promise<Response>

export function withLogging(functionName: string, handler: HandlerFunction) {
  return async (req: Request): Promise<Response> => {
    // Handle CORS preflight
    const corsResponse = handleCors(req)
    if (corsResponse) return corsResponse

    const logger = new RequestLogger(functionName, req)

    try {
      // Parse request body if exists
      if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
        try {
          const clonedReq = req.clone()
          const body = await clonedReq.json()
          logger.setRequestBody(body)
        } catch {
          // Body might not be JSON, skip
        }
      }

      // Call the actual handler
      const response = await handler(req, logger)

      return response
    } catch (error) {
      const errorMsg = (error as Error).message
      logger.logError(500, errorMsg)
      return errorResponse('INTERNAL_ERROR', 500, errorMsg)
    }
  }
}
