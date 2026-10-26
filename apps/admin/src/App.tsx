import { useEffect, useState, type FormEvent } from 'react'
import { BadgeCheck, Download, Flag, LoaderCircle, LogOut, RefreshCw, RotateCw, Search, ShieldAlert, ShieldCheck, TriangleAlert, Users as UsersIcon } from 'lucide-react'
import { googleClaim, googleStart, login, logout, message, useAuth, useLoad } from './api.ts'
import { Hero } from './Hero.tsx'
import { Logo, Splash } from './Splash.tsx'
import { Avatar, Foundations, Imports, Moderation, Reports, State, Users, type Profile } from './views.tsx'

const tabs = {
  moderation: ['Moderación', Moderation, ShieldCheck, 'Aprueba o rechaza las publicaciones en revisión.'],
  foundations: ['Fundaciones', Foundations, BadgeCheck, 'Fundaciones que Stagehand leyó y solicitudes de verificación.'],
  users: ['Usuarios', Users, UsersIcon, 'Gestiona planes y suspende cuentas.'],
  reports: ['Reportes', Reports, Flag, 'Revisa los reportes abiertos de la comunidad.'],
  imports: ['Importaciones', Imports, Download, 'Importa publicaciones de una fundación con Stagehand.'],
} as const

const fold = (s: string) => s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase()

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

  return (
    <>
      <Splash />
      {claiming ? (
        <main className="center-page">
          <State icon={LoaderCircle} tone="busy" text="Iniciando sesión…" role="status" />
        </main>
      ) : !session ? (
        <Login error={error} />
      ) : (
        <Panel forbidden={forbidden} />
      )}
    </>
  )
}

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
    <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
    <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
    <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" />
    <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
  </svg>
)

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
    <main className="login">
      <section className="login-hero">
        <div className="login-brand">
          <Logo size={40} />
          <strong>Petzo</strong>
        </div>
        <Hero />
        <p className="login-line">Cada mascota merece un hogar.</p>
      </section>
      <section className="login-side">
        <form className="sheet" onSubmit={submit}>
          <div className="sheet-head">
            <Logo size={48} />
            <h1>Panel administrativo</h1>
            <p className="muted">Inicia sesión con tu cuenta de administrador.</p>
          </div>
          <label>
            Correo
            <input type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} required />
          </label>
          <label>
            Contraseña
            <input type="password" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} required />
          </label>
          {error && <p className="alert" role="alert">{error}</p>}
          <button disabled={busy}>Entrar</button>
          <button type="button" className="secondary" disabled={busy} onClick={() => run(googleStart)}>
            <GoogleIcon />
            Continuar con Google
          </button>
        </form>
      </section>
    </main>
  )
}

function Panel({ forbidden }: { forbidden: boolean }) {
  const me = useLoad<Profile>('/me')
  const [tab, setTab] = useState<keyof typeof tabs>('moderation')
  const [query, setQuery] = useState('')
  const [round, setRound] = useState(0)
  const [title, View, , description] = tabs[tab]

  if (me.error || !me.data || forbidden || me.data.role !== 'admin')
    return (
      <main className="center-page">
        {me.error ? (
          <State icon={TriangleAlert} tone="danger" text={me.error} role="alert">
            <button onClick={me.reload}>
              <RotateCw size={16} />
              Reintentar
            </button>
            <button className="secondary" onClick={logout}>
              <LogOut size={16} />
              Cerrar sesión
            </button>
          </State>
        ) : !me.data ? (
          <State icon={LoaderCircle} tone="busy" text="Cargando…" role="status" />
        ) : (
          <State
            icon={ShieldAlert}
            tone="danger"
            role="alert"
            text={<>Tu cuenta no tiene permisos de administrador{me.data.fullName && <span className="muted sub">{me.data.fullName}</span>}</>}
          >
            <button className="secondary" onClick={logout}>
              <LogOut size={16} />
              Cerrar sesión
            </button>
          </State>
        )}
      </main>
    )

  const items = Object.entries(tabs).filter(([, [label]]) => fold(label).includes(fold(query.trim())))

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <Logo size={36} />
          <strong>Petzo</strong>
        </div>
        <label className="search">
          <Search size={16} aria-hidden="true" />
          <span className="sr-only">Buscar sección</span>
          <input type="search" placeholder="Buscar" value={query} onChange={e => setQuery(e.target.value)} />
        </label>
        <nav aria-label="Secciones">
          {items.map(([key, [label, , Icon]]) => (
            <button key={key} className="nav-item" aria-current={key === tab ? 'page' : undefined} onClick={() => setTab(key as keyof typeof tabs)}>
              <Icon size={18} aria-hidden="true" />
              {label}
            </button>
          ))}
          {!items.length && <p className="muted nav-empty">Sin resultados</p>}
        </nav>
        <div className="account">
          <Avatar name={me.data.fullName} />
          <span className="account-name">
            <strong>{me.data.fullName ?? 'Administrador'}</strong>
            <span className="muted">Administrador</span>
          </span>
          <button className="icon" aria-label="Cerrar sesión" title="Cerrar sesión" onClick={logout}>
            <LogOut size={18} />
          </button>
        </div>
      </aside>
      <main className="content">
        <header className="content-head">
          <div>
            <h1>{title}</h1>
            <p className="muted">{description}</p>
          </div>
          {/* remount refetches the section through its own GET */}
          <button className="secondary" onClick={() => setRound(n => n + 1)}>
            <RefreshCw size={16} aria-hidden="true" />
            Actualizar
          </button>
        </header>
        <View key={round} />
      </main>
    </div>
  )
}
