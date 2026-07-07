import { createServerFn } from '@tanstack/react-start'
import { getRequestHeaders } from '@tanstack/react-start/server'
import { db } from '../db'
import { settings } from '../db/schema'
import { eq } from 'drizzle-orm'
import { auth } from './auth'
import { Effect } from 'effect'

// ==========================================
// Custom Domain Errors
// ==========================================
export class UnauthorizedError {
  readonly _tag = 'UnauthorizedError'
  constructor(readonly message: string = 'UNAUTHORIZED: ADMIN SESSION REQUIRED') {}
}

export class InvalidValueError {
  readonly _tag = 'InvalidValueError'
  constructor(readonly message: string) {}
}

export class DatabaseError {
  readonly _tag = 'DatabaseError'
  constructor(readonly message: string) {}
}

// ==========================================
// Effect Pipelines & Core Logic
// ==========================================

const getSession = (context?: { session?: unknown }) =>
  Effect.gen(function* () {
    if (context?.session !== undefined) {
      return context.session as any
    }
    return yield* Effect.tryPromise({
      try: () => {
        const headers = getRequestHeaders()
        return auth.api.getSession({ headers })
      },
      catch: () => null
    })
  })

const requireAdmin = (context?: { session?: unknown }) =>
  Effect.gen(function* () {
    const session = yield* getSession(context)
    if (!session || !session.user || session.user.email.toLowerCase() !== 'admin@dstrkt.com') {
      return yield* Effect.fail(new UnauthorizedError())
    }
    return session
  })

export const getSettingsEffect = (context?: { session?: unknown }) =>
  Effect.gen(function* () {
    yield* requireAdmin(context)

    const row = yield* Effect.tryPromise({
      try: () => db.select().from(settings).where(eq(settings.id, 'markup_multiplier')).get(),
      catch: (err: any) => new DatabaseError(err.message || 'Failed to select from DB')
    })

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
  }).pipe(
    Effect.catchAll((err) => {
      if (err._tag === 'UnauthorizedError') {
        return Effect.fail(err)
      }
      // Log DB error and fallback to default row
      console.error('Failed to get settings:', err)
      return Effect.succeed({
        id: 'markup_multiplier',
        markupType: 'multiplier',
        fixedMarkup: 0.0,
        marginMultiplier: 1.5,
        updatedAt: Date.now()
      })
    })
  )

export const updateSettingsEffect = (
  data: { marginMultiplier: number },
  context?: { session?: unknown }
) =>
  Effect.gen(function* () {
    yield* requireAdmin(context)

    if (data.marginMultiplier < 0) {
      return yield* Effect.fail(new InvalidValueError('INVALID_VALUE: MULTIPLIER CANNOT BE NEGATIVE'))
    }

    const existing = yield* Effect.tryPromise({
      try: () => db.select().from(settings).where(eq(settings.id, 'markup_multiplier')).get(),
      catch: (err: any) => new DatabaseError(err.message || 'Database select error')
    })

    if (existing) {
      yield* Effect.tryPromise({
        try: () => db.update(settings)
          .set({
            marginMultiplier: data.marginMultiplier,
            updatedAt: Date.now()
          })
          .where(eq(settings.id, 'markup_multiplier')),
        catch: (err: any) => new DatabaseError(err.message || 'Database update error')
      })
    } else {
      yield* Effect.tryPromise({
        try: () => db.insert(settings).values({
          id: 'markup_multiplier',
          markupType: 'multiplier',
          fixedMarkup: 0.0,
          marginMultiplier: data.marginMultiplier,
          updatedAt: Date.now()
        }),
        catch: (err: any) => new DatabaseError(err.message || 'Database insert error')
      })
    }

    return { success: true as const }
  })

// ==========================================
// Handlers (Adapters for TanStack Start / Tests)
// ==========================================

export async function getSettingsHandler(context?: { session?: unknown }) {
  try {
    return await Effect.runPromise(getSettingsEffect(context))
  } catch (err: any) {
    if (err && (err._tag === 'UnauthorizedError' || err.message?.includes('UNAUTHORIZED') || String(err).includes('UNAUTHORIZED'))) {
      throw new Error('UNAUTHORIZED: ADMIN SESSION REQUIRED')
    }
    throw err
  }
}

export async function updateSettingsHandler(
  data: { marginMultiplier: number },
  context?: { session?: unknown }
) {
  const program = updateSettingsEffect(data, context).pipe(
    Effect.catchAll((err) => {
      if (err._tag === 'UnauthorizedError') {
        return Effect.succeed({ error: err.message })
      }
      if (err._tag === 'InvalidValueError') {
        return Effect.succeed({ error: err.message })
      }
      console.error('Failed to update settings:', err)
      return Effect.succeed({ error: `DATABASE ERROR: ${err.message}` })
    })
  )
  return Effect.runPromise(program)
}

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
