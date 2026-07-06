import { createServerFn } from '@tanstack/react-start'
import { getRequestHeaders } from '@tanstack/react-start/server'
import { auth } from './auth'

export const getSessionFn = createServerFn({ method: 'GET' }).handler(async () => {
  const headers = getRequestHeaders()
  try {
    const session = await auth.api.getSession({ headers })
    return session
  } catch (error) {
    console.error('Error fetching session:', error)
    return null
  }
})
