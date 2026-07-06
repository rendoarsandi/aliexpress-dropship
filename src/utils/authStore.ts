import { Store } from '@tanstack/react-store'

export interface UserSession {
  email: string
  fullName: string
  walletId?: string
  shippingAddress?: string
  joinedAt: string
}

export interface AuthState {
  user: UserSession | null
  error: string | null
  isLoading: boolean
}

const isBrowser = typeof window !== 'undefined'

function getInitialAuthState(): AuthState {
  if (!isBrowser) return { user: null, error: null, isLoading: false }
  try {
    const stored = window.localStorage.getItem('dstrkt_session')
    return stored ? { user: JSON.parse(stored), error: null, isLoading: false } : { user: null, error: null, isLoading: false }
  } catch (e) {
    return { user: null, error: null, isLoading: false }
  }
}

export const authStore = new Store<AuthState>(getInitialAuthState())

function saveSession(user: UserSession | null) {
  if (isBrowser) {
    try {
      if (user) {
        window.localStorage.setItem('dstrkt_session', JSON.stringify(user))
      } else {
        window.localStorage.removeItem('dstrkt_session')
      }
    } catch (e) {
      // ignore
    }
  }
}

// Simple simulation of database users stored in localStorage
function getRegisteredUsers(): Record<string, { email: string; fullName: string; pass: string; walletId?: string; joinedAt: string }> {
  if (!isBrowser) return {}
  try {
    const stored = window.localStorage.getItem('dstrkt_registered_users')
    return stored ? JSON.parse(stored) : {
      'operative_099@domain.com': {
        email: 'operative_099@domain.com',
        fullName: 'ALEX CHEN',
        pass: 'dstrkt123',
        walletId: '0x71C2B9e3d99FF817a0fE37C0DEb72Cd9Eef98F09',
        joinedAt: '2026-01-01'
      }
    }
  } catch (e) {
    return {}
  }
}

function saveRegisteredUsers(users: ReturnType<typeof getRegisteredUsers>) {
  if (isBrowser) {
    try {
      window.localStorage.setItem('dstrkt_registered_users', JSON.stringify(users))
    } catch (e) {
      // ignore
    }
  }
}

export const loginUser = async (email: string, pass: string): Promise<boolean> => {
  authStore.setState((s) => ({ ...s, isLoading: true, error: null }))
  await new Promise((r) => setTimeout(r, 800)) // simulate response delay

  const users = getRegisteredUsers()
  const user = users[email.toLowerCase()]

  if (user && user.pass === pass) {
    const session: UserSession = {
      email: user.email,
      fullName: user.fullName,
      walletId: user.walletId,
      joinedAt: user.joinedAt
    }
    authStore.setState((s) => ({ ...s, user: session, isLoading: false }))
    saveSession(session)
    return true
  } else {
    authStore.setState((s) => ({ ...s, error: 'INVALID SIGNATURE OR ACCESS PASS', isLoading: false }))
    return false
  }
}

export const registerUser = async (email: string, fullName: string, pass: string, walletId?: string): Promise<boolean> => {
  authStore.setState((s) => ({ ...s, isLoading: true, error: null }))
  await new Promise((r) => setTimeout(r, 800))

  const users = getRegisteredUsers()
  const normalizedEmail = email.toLowerCase()

  if (users[normalizedEmail]) {
    authStore.setState((s) => ({ ...s, error: 'OPERATIVE EMBARKATION ALREADY REGISTERED', isLoading: false }))
    return false
  }

  const newUser = {
    email: normalizedEmail,
    fullName,
    pass,
    walletId: walletId || `0x${Math.random().toString(16).substring(2, 42)}`,
    joinedAt: new Date().toISOString().split('T')[0]
  }

  users[normalizedEmail] = newUser
  saveRegisteredUsers(users)

  const session: UserSession = {
    email: newUser.email,
    fullName: newUser.fullName,
    walletId: newUser.walletId,
    joinedAt: newUser.joinedAt
  }

  authStore.setState((s) => ({ ...s, user: session, isLoading: false }))
  saveSession(session)
  return true
}

export const logoutUser = () => {
  authStore.setState((s) => ({ ...s, user: null, error: null }))
  saveSession(null)
}
