import { useCallback, useEffect, useState, useSyncExternalStore } from 'react'

if (!import.meta.env.VITE_API_URL) throw Error('Falta VITE_API_URL en apps/admin/.env')
const API = import.meta.env.VITE_API_URL + '/api'
const SESSION = 'petzo.session'
const GOOGLE = 'petzo.google'

export type Session = { accessToken: string; refreshToken: string; expiresIn: number }

export class ApiError extends Error {
  status: number
  code?: string
  constructor(status: number, message: string, code?: string) {
    super(message)
    this.status = status
    this.code = code
  }
}

// Session store: memory + sessionStorage, read by React through useAuth()
let state = { session: JSON.parse(sessionStorage.getItem(SESSION) ?? 'null') as Session | null, forbidden: false }
const listeners = new Set<() => void>()

function setState(next: Partial<typeof state>) {
  state = { ...state, ...next }
  if (state.session) sessionStorage.setItem(SESSION, JSON.stringify(state.session))
  else sessionStorage.removeItem(SESSION)
  listeners.forEach(l => l())
}

export const useAuth = () =>
  useSyncExternalStore(
    cb => {
      listeners.add(cb)
      return () => listeners.delete(cb)
    },
    () => state,
  )

async function send(path: string, method: string, body?: unknown, token?: string) {
  const headers: Record<string, string> = {}
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (token) headers.Authorization = `Bearer ${token}`
  try {
    return await fetch(API + path, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) })
  } catch {
    throw new ApiError(0, 'No se pudo conectar con el servidor')
  }
}

// One refresh at a time: parallel 401s must not spend the same refresh token twice
let refreshing: Promise<boolean> | undefined
function refresh(refreshToken: string) {
  return (refreshing ??= send('/auth/refresh', 'POST', { refreshToken })
    .then(async res => {
      if (!res.ok) return false
      setState({ session: await res.json() })
      return true
    })
    .finally(() => (refreshing = undefined)))
}

export async function api<T = void>(path: string, method = 'GET', body?: unknown): Promise<T> {
  let res = await send(path, method, body, state.session?.accessToken)
  if (res.status === 401 && state.session) {
    if (await refresh(state.session.refreshToken)) res = await send(path, method, body, state.session?.accessToken)
    if (res.status === 401) setState({ session: null })
  }
  if (res.status === 403 && path.startsWith('/admin')) setState({ forbidden: true })
  if (!res.ok) {
    const p = await res.json().catch(() => ({}))
    const fields = Object.values(p.fields ?? {}).join('. ')
    throw new ApiError(res.status, [p.detail ?? `Error ${res.status}`, fields].filter(Boolean).join(': '), p.code)
  }
  return res.status === 204 ? (undefined as T) : res.json()
}

export const message = (e: unknown) => (e instanceof Error ? e.message : String(e))

export async function login(email: string, password: string) {
  setState({ session: await api<Session>('/auth/login', 'POST', { email, password }), forbidden: false })
}

export async function logout() {
  await send('/auth/logout', 'POST', undefined, state.session?.accessToken).catch(() => {})
  setState({ session: null, forbidden: false })
}

const base64url = (bytes: ArrayBuffer | Uint8Array) =>
  btoa(String.fromCharCode(...new Uint8Array(bytes))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')

export async function googleStart() {
  const flow = crypto.randomUUID()
  const secret = base64url(crypto.getRandomValues(new Uint8Array(32)))
  const challenge = base64url(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(secret)))
  sessionStorage.setItem(GOOGLE, JSON.stringify({ flow, secret }))
  const redirect = encodeURIComponent(location.origin + '/auth-callback')
  location.assign(`${API}/auth/google/start?flow=${flow}&challenge=${challenge}&redirect=${redirect}`)
}

/** Runs on /auth-callback. Clears the pending flow and the URL first, so a second call is a no-op. */
export async function googleClaim() {
  const pending = sessionStorage.getItem(GOOGLE)
  const error = new URLSearchParams(location.search).get('error')
  sessionStorage.removeItem(GOOGLE)
  history.replaceState(null, '', '/')
  if (error) throw new Error('No se pudo iniciar sesión con Google')
  if (!pending) throw new Error('El inicio de sesión con Google expiró; inténtalo de nuevo')
  setState({ session: await api<Session>('/auth/google/claim', 'POST', JSON.parse(pending)), forbidden: false })
}

export function useLoad<T>(path: string) {
  const [data, setData] = useState<T>()
  const [error, setError] = useState<string>()
  const reload = useCallback(
    () =>
      api<T>(path).then(
        d => {
          setData(d)
          setError(undefined)
        },
        e => setError(message(e)),
      ),
    [path],
  )
  useEffect(() => {
    reload()
  }, [reload])
  return { data, error, reload }
}

export type Load<T> = ReturnType<typeof useLoad<T>>

/** Runs one mutation at a time and reloads the view afterwards (also on error: the data may be stale). */
export function useAction(after: () => unknown) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string>()
  const run = async (fn: () => Promise<unknown>) => {
    setBusy(true)
    setError(undefined)
    try {
      await fn()
    } catch (e) {
      setError(message(e))
    } finally {
      await after()
      setBusy(false)
    }
  }
  return { busy, error, run }
}
