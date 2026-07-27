import { createServerFn } from '@tanstack/react-start'
import { auth } from './auth'
import { Effect } from 'effect'

export const getSessionEffect = () =>
  Effect.gen(function* () {
    const headers = yield* Effect.tryPromise({
      try: async () => {
        if (typeof window !== 'undefined') return new Headers()
        const { getRequestHeaders } = await import('@tanstack/react-start/server')
        return getRequestHeaders()
      },
      catch: () => null
    })

    const session = yield* Effect.tryPromise({
      try: () => auth.api.getSession({ headers: headers || {} }),
      catch: (err) => {
        console.error('Error fetching session via Effect:', err)
        return null
      }
    })

    return session
  }).pipe(
    Effect.catchAll((err) => {
      console.error('Session retrieval failed in Effect pipeline:', err)
      return Effect.succeed(null)
    })
  )

export const getSessionFn = createServerFn({ method: 'GET' }).handler(async () => {
  return Effect.runPromise(getSessionEffect())
})

