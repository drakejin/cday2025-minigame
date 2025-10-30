/**
 * Convert snake_case to camelCase
 */
export function toCamelCase(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
}

/**
 * Convert object keys from snake_case to camelCase
 */
export function keysToCamelCase<T = any>(obj: any): T {
  if (obj === null || obj === undefined) {
    return obj
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => keysToCamelCase(item)) as T
  }

  if (typeof obj === 'object' && obj.constructor === Object) {
    const result: any = {}
    for (const key in obj) {
      if (Object.hasOwn(obj, key)) {
        const camelKey = toCamelCase(key)
        result[camelKey] = keysToCamelCase(obj[key])
      }
    }
    return result as T
  }

  return obj
}

/**
 * Convert Supabase query result to camelCase
 */
export function convertToCamelCase<T>(data: any): T {
  return keysToCamelCase<T>(data)
}
