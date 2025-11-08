import type { Profile } from '@/types/profile.types'
import { handleEdgeFunctionResponse } from '@/utils/edgeFunction'
import { supabase } from './supabase'

let profileCache: { profile: Profile; timestamp: number } | null = null
const CACHE_DURATION = 5000 // 5 seconds

export const profileService = {
  /**
   * Get current user's profile from DB
   * Cached for 5 seconds to prevent duplicate calls
   */
  async getMyProfile(): Promise<Profile> {
    console.log('getMyProfile called')

    // Return cached profile if available and fresh
    if (profileCache && Date.now() - profileCache.timestamp < CACHE_DURATION) {
      console.log('Returning cached profile')
      return profileCache.profile
    }

    console.log('Fetching fresh profile from API...')

    // Add timeout to prevent infinite loading (10 seconds)
    const invokePromise = supabase.functions.invoke('get-my-profile', {})
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('get-my-profile timeout after 10s')), 10000)
    )

    try {
      console.log('Invoking get-my-profile...')
      const { data, error } = await Promise.race([invokePromise, timeoutPromise])

      console.log('get-my-profile response:', { hasData: !!data, hasError: !!error })

      const result = handleEdgeFunctionResponse<{ profile: Profile }>(
        data,
        error,
        'Failed to fetch profile'
      )

      // Cache the profile
      profileCache = {
        profile: result.profile,
        timestamp: Date.now(),
      }

      console.log('Profile fetched and cached')
      return result.profile
    } catch (err) {
      console.error('Profile fetch error:', err)
      throw err
    }
  },

  /**
   * Update user profile (display name, avatar)
   */
  async updateProfile(updates: { displayName?: string; avatarUrl?: string }) {
    const { data, error } = await supabase.functions.invoke('update-profile', {
      body: {
        display_name: updates.displayName,
        avatar_url: updates.avatarUrl,
      },
    })

    const result = handleEdgeFunctionResponse(data, error, 'Failed to update profile')

    // Clear cache after update
    profileCache = null

    return result
  },
}
