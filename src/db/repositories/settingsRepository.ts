import { db } from '../index'
import { settings } from '../schema'
import { eq } from 'drizzle-orm'

export type SettingRecord = typeof settings.$inferSelect

export const settingsRepository = {
  async getSettings(): Promise<SettingRecord | null> {
    const res = await db.select().from(settings).where(eq(settings.id, 'markup_multiplier')).get()
    return res || null
  },

  async updateSettings(marginMultiplier: number): Promise<void> {
    await db.update(settings)
      .set({
        marginMultiplier,
        updatedAt: Date.now()
      })
      .where(eq(settings.id, 'markup_multiplier'))
  },

  async insertSettings(marginMultiplier: number): Promise<void> {
    await db.insert(settings).values({
      id: 'markup_multiplier',
      markupType: 'multiplier',
      fixedMarkup: 0.0,
      marginMultiplier,
      updatedAt: Date.now()
    })
  }
}
