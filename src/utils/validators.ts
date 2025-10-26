import { z } from 'zod'

/**
 * Email validation schema
 */
export const emailSchema = z.string().email('올바른 이메일 형식이 아닙니다.')

/**
 * Password validation schema (minimum 6 characters)
 */
export const passwordSchema = z.string().min(6, '비밀번호는 최소 6자 이상이어야 합니다.')

/**
 * Username validation schema (3-20 characters, alphanumeric)
 */
export const usernameSchema = z
  .string()
  .min(3, '사용자명은 최소 3자 이상이어야 합니다.')
  .max(20, '사용자명은 최대 20자까지 가능합니다.')
  .regex(/^[a-zA-Z0-9_]+$/, '사용자명은 영문, 숫자, 밑줄(_)만 사용 가능합니다.')

/**
 * Display name validation schema
 */
export const displayNameSchema = z
  .string()
  .min(1, '표시 이름을 입력해주세요.')
  .max(100, '표시 이름은 최대 100자까지 가능합니다.')

/**
 * Character name validation schema
 */
export const characterNameSchema = z
  .string()
  .min(1, '캐릭터 이름을 입력해주세요.')
  .max(100, '캐릭터 이름은 최대 100자까지 가능합니다.')

/**
 * Prompt validation schema (1-30 characters)
 */
export const promptSchema = z
  .string()
  .min(1, '프롬프트를 입력해주세요.')
  .max(30, '프롬프트는 최대 30자까지 가능합니다.')

/**
 * Sign up form validation schema
 */
export const signUpFormSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
    passwordConfirm: z.string(),
    username: usernameSchema,
    displayName: displayNameSchema.optional(),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    message: '비밀번호가 일치하지 않습니다.',
    path: ['passwordConfirm'],
  })

/**
 * Sign in form validation schema
 */
export const signInFormSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
})

/**
 * Character creation form validation schema
 */
export const createCharacterFormSchema = z.object({
  name: characterNameSchema,
  initialPrompt: promptSchema,
})

/**
 * Prompt submission form validation schema
 */
export const submitPromptFormSchema = z.object({
  prompt: promptSchema,
})

/**
 * Profile edit form validation schema
 */
export const editProfileFormSchema = z.object({
  displayName: displayNameSchema,
  avatarUrl: z.string().url('올바른 URL 형식이 아닙니다.').optional().or(z.literal('')),
})

/**
 * Validate prompt length
 */
export const isValidPromptLength = (prompt: string): boolean => {
  return prompt.length >= 1 && prompt.length <= 30
}

/**
 * Validate email format
 */
export const isValidEmail = (email: string): boolean => {
  return emailSchema.safeParse(email).success
}

/**
 * Validate username format
 */
export const isValidUsername = (username: string): boolean => {
  return usernameSchema.safeParse(username).success
}
