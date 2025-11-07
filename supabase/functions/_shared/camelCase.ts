/**
 * Convert snake_case to camelCase
 */
export function toCamelCase(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
}

/**
 * Convert object keys from snake_case to camelCase
 */
export function keysToCamelCase<T = unknown>(obj: unknown): T {
  if (obj === null || obj === undefined) {
    return obj as T
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => keysToCamelCase(item)) as T
  }

  if (typeof obj === 'object' && obj.constructor === Object) {
    const result: Record<string, unknown> = {}
    for (const key in obj) {
      if (Object.hasOwn(obj, key)) {
        const camelKey = toCamelCase(key)
        result[camelKey] = keysToCamelCase((obj as Record<string, unknown>)[key])
      }
    }
    return result as T
  }

  return obj as T
}

/**
 * Convert Supabase query result to camelCase
 */
export function convertToCamelCase<T>(data: unknown): T {
  return keysToCamelCase<T>(data)
}
