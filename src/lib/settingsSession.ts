import { createServerFn } from '@tanstack/react-start'
import { getSettingsHandler, updateSettingsHandler } from './settingsSession.server'

// ==========================================
// TanStack Start Server Functions
// ==========================================

export const getSettingsFn = createServerFn({ method: 'GET' }).handler(async () => {
  return getSettingsHandler()
})

export const updateSettingsFn = createServerFn({ method: 'POST' })
  .validator((data: { marginMultiplier: number }) => data)
  .handler(async ({ data }) => {
    return updateSettingsHandler(data)
  })
