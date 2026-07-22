import { createServerFn } from '@tanstack/react-start'
import { getRequestHeaders } from '@tanstack/react-start/server'
import { auth } from './auth'
import { Effect } from 'effect'

export const getSessionEffect = () =>
  Effect.gen(function* () {
    const headers = yield* Effect.try({
      try: () => getRequestHeaders(),
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

