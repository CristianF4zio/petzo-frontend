import { useEffect, useState, type FormEvent } from 'react'
import { googleClaim, googleStart, login, logout, message, useAuth, useLoad } from './api.ts'
import { Foundations, Imports, Moderation, Reports, Stats, Users, type Profile } from './views.tsx'

const tabs = {
  moderation: ['Moderación', Moderation],
  foundations: ['Fundaciones', Foundations],
  users: ['Usuarios', Users],
  reports: ['Reportes', Reports],
  imports: ['Importaciones', Imports],
  stats: ['Métricas', Stats],
} as const

export default function App() {
  const { session, forbidden } = useAuth()
  const [claiming, setClaiming] = useState(location.pathname === '/auth-callback')
  const [error, setError] = useState<string>()

  useEffect(() => {
    if (location.pathname !== '/auth-callback') return
    googleClaim()
      .catch(e => setError(message(e)))
      .finally(() => setClaiming(false))
  }, [])

  if (claiming) return <p className="center muted">Iniciando sesión…</p>
  if (!session) return <Login error={error} />
  return <Panel forbidden={forbidden} />
}

function Login({ error: initial }: { error?: string }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(initial)

  const run = async (fn: () => Promise<void>) => {
    setBusy(true)
    setError(undefined)
    try {
      await fn()
    } catch (e) {
      setError(message(e))
      setBusy(false)
    }
  }
  const submit = (e: FormEvent) => {
    e.preventDefault()
    run(() => login(email.trim(), password))
  }

  return (
    <form className="login card" onSubmit={submit}>
      <h1>Petzo · Panel admin</h1>
      <label>
        Correo
        <input type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} required />
      </label>
      <label>
        Contraseña
        <input type="password" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} required />
      </label>
      {error && <p className="error" role="alert">{error}</p>}
      <button disabled={busy}>Entrar</button>
      <button type="button" className="secondary" disabled={busy} onClick={() => run(googleStart)}>
        Continuar con Google
      </button>
    </form>
  )
}

function Panel({ forbidden }: { forbidden: boolean }) {
  const me = useLoad<Profile>('/me')
  const [tab, setTab] = useState<keyof typeof tabs>('moderation')
  const [, View] = tabs[tab]

  const body = me.error ? (
    <p className="error" role="alert">
      {me.error} <button onClick={me.reload}>Reintentar</button>
    </p>
  ) : !me.data ? (
    <p className="muted">Cargando…</p>
  ) : forbidden || me.data.role !== 'admin' ? (
    <p className="error" role="alert">Tu cuenta no tiene permisos de administrador</p>
  ) : (
    <>
      <nav>
        {Object.entries(tabs).map(([key, [label]]) => (
          <button key={key} className={key === tab ? 'tab active' : 'tab'} aria-current={key === tab} onClick={() => setTab(key as keyof typeof tabs)}>
            {label}
          </button>
        ))}
      </nav>
      <main>
        <View />
      </main>
    </>
  )

  return (
    <>
      <header>
        <strong>Petzo · Panel admin</strong>
        <span className="muted">{me.data?.fullName}</span>
        <button className="secondary" onClick={logout}>Cerrar sesión</button>
      </header>
      {body}
    </>
  )
}
