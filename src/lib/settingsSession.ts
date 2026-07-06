import { createServerFn } from '@tanstack/react-start'
import { getRequestHeaders } from '@tanstack/react-start/server'
import { db } from '../db'
import { settings } from '../db/schema'
import { eq } from 'drizzle-orm'
import { auth } from './auth'

export async function getSettingsHandler(context?: { session?: unknown }) {
  let session: any = context?.session
  if (session === undefined) {
    try {
      const headers = getRequestHeaders()
      session = await auth.api.getSession({ headers })
    } catch {
      session = null
    }
  }

  if (!session || !session.user || session.user.email.toLowerCase() !== 'admin@dstrkt.com') {
    throw new Error('UNAUTHORIZED: ADMIN SESSION REQUIRED')
  }

  try {
    const row = await db.select().from(settings).where(eq(settings.id, 'markup_multiplier')).get()
    if (row) {
      return row
    }
    return {
      id: 'markup_multiplier',
      markupType: 'multiplier',
      fixedMarkup: 0.0,
      marginMultiplier: 1.5,
      updatedAt: Date.now()
    }
  } catch (err) {
    console.error('Failed to get settings:', err)
    return {
      id: 'markup_multiplier',
      markupType: 'multiplier',
      fixedMarkup: 0.0,
      marginMultiplier: 1.5,
      updatedAt: Date.now()
    }
  }
}

export async function updateSettingsHandler(
  data: { marginMultiplier: number },
  context?: { session?: unknown }
) {
  let session: any = context?.session
  if (session === undefined) {
    try {
      const headers = getRequestHeaders()
      session = await auth.api.getSession({ headers })
    } catch {
      session = null
    }
  }

  if (!session || !session.user || session.user.email.toLowerCase() !== 'admin@dstrkt.com') {
    return { error: 'UNAUTHORIZED: ADMIN SESSION REQUIRED' }
  }

  if (data.marginMultiplier < 0) {
    return { error: 'INVALID_VALUE: MULTIPLIER CANNOT BE NEGATIVE' }
  }

  try {
    const existing = await db.select().from(settings).where(eq(settings.id, 'markup_multiplier')).get()
    if (existing) {
      await db.update(settings)
        .set({
          marginMultiplier: data.marginMultiplier,
          updatedAt: Date.now()
        })
        .where(eq(settings.id, 'markup_multiplier'))
    } else {
      await db.insert(settings).values({
        id: 'markup_multiplier',
        markupType: 'multiplier',
        fixedMarkup: 0.0,
        marginMultiplier: data.marginMultiplier,
        updatedAt: Date.now()
      })
    }
    return { success: true }
  } catch (err: any) {
    console.error('Failed to update settings:', err)
    return { error: `DATABASE ERROR: ${err.message}` }
  }
}

export const getSettingsFn = createServerFn({ method: 'GET' }).handler(async () => {
  return getSettingsHandler()
})

export const updateSettingsFn = createServerFn({ method: 'POST' })
  .validator((data: { marginMultiplier: number }) => data)
  .handler(async ({ data }) => {
    return updateSettingsHandler(data)
  })
