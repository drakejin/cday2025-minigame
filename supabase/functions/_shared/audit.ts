import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface AuditLogData {
  admin_id: string
  action: string
  resource_type: string
  resource_id?: string
  changes?: Record<string, unknown>
  ip_address?: string
  user_agent?: string
}

/**
 * Create audit log entry
 */
export async function createAuditLog(
  supabase: SupabaseClient,
  data: AuditLogData
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase.from('admin_audit_log').insert({
    admin_id: data.admin_id,
    action: data.action,
    resource_type: data.resource_type,
    resource_id: data.resource_id || null,
    changes: data.changes || null,
    ip_address: data.ip_address || null,
    user_agent: data.user_agent || null,
  })

  if (error) {
    console.error('Failed to create audit log:', error)
    return { success: false, error: error.message }
  }

  return { success: true }
}

/**
 * Extract IP and User-Agent from request
 */
export function getRequestMetadata(req: Request) {
  return {
    ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || null,
    user_agent: req.headers.get('user-agent') || null,
  }
}
