import { createServerFn } from '@tanstack/react-start'
import { getSettingsHandler, updateSettingsHandler } from './settingsSession.server'
import { decodeUpdateSettings } from './schemas'

// ==========================================
// TanStack Start Server Functions
// ==========================================

export const getSettingsFn = createServerFn({ method: 'GET' }).handler(async () => {
  return getSettingsHandler()
})

export const updateSettingsFn = createServerFn({ method: 'POST' })
  .validator((data: unknown) => {
    try {
      return decodeUpdateSettings(data)
    } catch (error) {
      console.error('Update settings validation failed via @effect/schema:', error)
      throw new Error(error instanceof Error ? error.message : 'Invalid settings payload')
    }
  })
  .handler(async ({ data }) => {
    return updateSettingsHandler(data)
  })
