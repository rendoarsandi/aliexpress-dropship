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

export interface AuthUser {
  id: string
  email: string
  name: string
  role?: string
  emailVerified: boolean
  image?: string | null
}

export interface AuthSession {
  user: AuthUser
  session?: unknown
}

const getSession = (context?: { session?: AuthSession | null | unknown }) =>
  Effect.gen(function* () {
    if (context?.session !== undefined) {
      return (context.session as AuthSession | null) ?? null
    }
    return yield* Effect.tryPromise({
      try: () => {
        const headers = getRequestHeaders()
        return auth.api.getSession({ headers }) as Promise<AuthSession | null>
      },
      catch: () => null
    })
  })

const requireAdmin = (context?: { session?: AuthSession | null | unknown }) =>
  Effect.gen(function* () {
    const session = yield* getSession(context)
    const adminEmails = (typeof process !== 'undefined' && process.env.ADMIN_EMAILS ? process.env.ADMIN_EMAILS : 'admin@dstrkt.com')
      .toLowerCase()
      .split(',')
      .map(e => e.trim())
    const userEmail = session?.user?.email?.toLowerCase()
    const isAdmin = session?.user?.role === 'admin' || (userEmail && adminEmails.includes(userEmail))
    if (!session || !session.user || !isAdmin) {
      return yield* Effect.fail(new UnauthorizedError())
    }
    return session
  })

export interface SettingRecord {
  id: string
  markupType: string
  fixedMarkup: number
  marginMultiplier: number
  updatedAt: number
}

export const getSettingsEffect = (context?: { session?: AuthSession | null | unknown }) =>
  Effect.gen(function* () {
    yield* requireAdmin(context)

    const row = yield* Effect.tryPromise<SettingRecord | null, DatabaseError>({
      try: async () => {
        const res = await db.select().from(settings).where(eq(settings.id, 'markup_multiplier')).get()
        return (res as SettingRecord) || null
      },
      catch: (err: unknown) => new DatabaseError(err instanceof Error ? err.message : 'Failed to select from DB')
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
    Effect.catchAll((err: unknown) => {
      if (err instanceof UnauthorizedError || (typeof err === 'object' && err !== null && '_tag' in err && err._tag === 'UnauthorizedError')) {
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
  context?: { session?: AuthSession | null | unknown }
) =>
  Effect.gen(function* () {
    yield* requireAdmin(context)

    if (data.marginMultiplier < 0) {
      return yield* Effect.fail(new InvalidValueError('INVALID_VALUE: MULTIPLIER CANNOT BE NEGATIVE'))
    }

    const existing = yield* Effect.tryPromise<SettingRecord | null, DatabaseError>({
      try: async () => {
        const res = await db.select().from(settings).where(eq(settings.id, 'markup_multiplier')).get()
        return (res as SettingRecord) || null
      },
      catch: (err: unknown) => new DatabaseError(err instanceof Error ? err.message : 'Database select error')
    })

    if (existing) {
      yield* Effect.tryPromise({
        try: () => db.update(settings)
          .set({
            marginMultiplier: data.marginMultiplier,
            updatedAt: Date.now()
          })
          .where(eq(settings.id, 'markup_multiplier')),
        catch: (err: unknown) => new DatabaseError(err instanceof Error ? err.message : 'Database update error')
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
        catch: (err: unknown) => new DatabaseError(err instanceof Error ? err.message : 'Database insert error')
      })
    }

    return { success: true as const }
  })

// ==========================================
// Handlers (Adapters for TanStack Start / Tests)
// ==========================================

export async function getSettingsHandler(context?: { session?: AuthSession | null | unknown }): Promise<SettingRecord> {
  try {
    return await Effect.runPromise(getSettingsEffect(context))
  } catch (err: unknown) {
    if (err instanceof UnauthorizedError || (typeof err === 'object' && err !== null && 'message' in err && String((err as Error).message).includes('UNAUTHORIZED'))) {
      throw new Error('UNAUTHORIZED: ADMIN SESSION REQUIRED')
    }
    throw err
  }
}

export type UpdateSettingsResult = { success: true } | { error: string }

export async function updateSettingsHandler(
  data: { marginMultiplier: number },
  context?: { session?: AuthSession | null | unknown }
): Promise<UpdateSettingsResult> {
  const program = updateSettingsEffect(data, context).pipe(
    Effect.catchAll((err: unknown) => {
      if (err instanceof UnauthorizedError || (typeof err === 'object' && err !== null && '_tag' in err && err._tag === 'UnauthorizedError')) {
        return Effect.succeed({ error: (err as UnauthorizedError).message })
      }
      if (err instanceof InvalidValueError || (typeof err === 'object' && err !== null && '_tag' in err && err._tag === 'InvalidValueError')) {
        return Effect.succeed({ error: (err as InvalidValueError).message })
      }
      console.error('Failed to update settings:', err)
      const msg = err instanceof Error ? err.message : String(err)
      return Effect.succeed({ error: `DATABASE ERROR: ${msg}` })
    })
  )
  return Effect.runPromise(program)
}
