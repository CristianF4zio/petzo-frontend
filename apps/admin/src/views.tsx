import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { BadgeCheck, Check, Download, Inbox, LoaderCircle, RotateCw, Trash2, TriangleAlert, X, type LucideIcon } from 'lucide-react'
import { api, ApiError, useAction, useLoad, type Load } from './api.ts'

export type Profile = {
  id: string
  fullName: string | null
  role: 'user' | 'admin'
  accountType: 'person' | 'foundation'
  foundationName: string | null
  foundationInstagram: string | null
  foundationBio: string | null
  verificationStatus: 'none' | 'pending' | 'verified' | 'rejected'
  plan: 'free' | 'pro'
  suspended: boolean
}

type Pet = {
  id: string
  name: string
  species: 'dog' | 'cat'
  description: string | null
  version: number
  photos: { id: string; url: string }[]
  publisher: { name: string } | null
  moderationReason: string | null
  riskScore: number | null
}

type Report = { id: string; petId: string; petName: string; reason: string; createdAt: string }

type ImportJob = { id: string; instagramHandle: string; status: 'queued' | 'running' | 'done' | 'failed'; petsCreated: number; error: string | null; createdAt: string }

const date = (iso: string) => new Date(iso).toLocaleString('es')

export const Avatar = ({ name }: { name: string | null }) => (
  <span className="avatar" aria-hidden="true">{name?.trim()[0]?.toUpperCase() ?? '?'}</span>
)

// Centered empty/loading/error state: pastel circle + icon + text (+ actions)
export const State = ({ icon: Icon, tone, text, role, children }: { icon: LucideIcon; tone: 'mint' | 'busy' | 'danger'; text: ReactNode; role?: 'status' | 'alert'; children?: ReactNode }) => (
  <div className="state">
    <span className={`state-icon ${tone}`}><Icon size={28} aria-hidden="true" /></span>
    <p role={role}>{text}</p>
    {children && <div className="actions">{children}</div>}
  </div>
)

function Loaded<T>({ load, error, children }: { load: Load<T>; error?: string; children: (data: T) => ReactNode }) {
  if (load.error)
    return (
      <State icon={TriangleAlert} tone="danger" text={load.error} role="alert">
        <button className="secondary" onClick={load.reload}>
          <RotateCw size={16} />
          Reintentar
        </button>
      </State>
    )
  if (load.data === undefined) return <State icon={LoaderCircle} tone="busy" text="Cargando…" role="status" />
  return (
    <>
      {error && <p className="alert" role="alert">{error}</p>}
      {children(load.data)}
    </>
  )
}

const empty = (text: string) => <State icon={Inbox} tone="mint" text={text} />

const risk = (score: number | null) => (score === null ? '' : score >= 70 ? 'high' : score >= 40 ? 'mid' : 'low')
const riskLabel = { high: 'Riesgo alto', mid: 'Riesgo medio', low: 'Riesgo bajo', '': 'Sin análisis' }

export function Moderation() {
  const load = useLoad<Pet[]>('/admin/moderation')
  const act = useAction(load.reload)
  const reject = (p: Pet) => {
    const reason = prompt(`Motivo del rechazo de "${p.name}":`)?.trim()
    if (reason) act.run(() => api(`/admin/pets/${p.id}/reject`, 'POST', { reason }))
  }
  return (
    <Loaded load={load} error={act.error}>
      {pets =>
        pets.length ? (
          <div className="grid">
            {pets.map(p => (
              <article key={p.id} className="card">
                {p.photos.length > 0 && (
                  <div className="photos">
                    {p.photos.map(ph => <img key={ph.id} src={ph.url} alt={p.name} width={120} height={120} loading="lazy" />)}
                  </div>
                )}
                <div className="card-head">
                  <div>
                    <h2>{p.name}</h2>
                    <p className="muted">{p.species === 'dog' ? 'Perro' : 'Gato'} · Publicado por {p.publisher?.name ?? '—'}</p>
                  </div>
                  <span className={`badge ${risk(p.riskScore)}`}>
                    {riskLabel[risk(p.riskScore)]}{p.riskScore !== null && ` · ${p.riskScore}/100`}
                  </span>
                </div>
                <p className="reason"><b>Motivo:</b> {p.moderationReason ?? '—'}</p>
                {p.description && <p className="desc">{p.description}</p>}
                <div className="actions">
                  <button disabled={act.busy} onClick={() => act.run(() => api(`/admin/pets/${p.id}/approve?version=${p.version}`, 'POST'))}>
                    <Check size={16} />
                    Aprobar
                  </button>
                  <button className="danger" disabled={act.busy} onClick={() => reject(p)}>
                    <X size={16} />
                    Rechazar
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          empty('No hay publicaciones en revisión.')
        )
      }
    </Loaded>
  )
}

const verification = { none: '—', pending: 'Pendiente', verified: 'Verificada', rejected: 'Rechazada' }

const Verification = ({ status }: { status: Profile['verificationStatus'] }) =>
  status === 'none' ? (
    <span className="muted">—</span>
  ) : (
    <span className={`badge ${status}`}>
      {status === 'verified' && <BadgeCheck size={14} aria-hidden="true" />}
      {verification[status]}
    </span>
  )

export function Foundations() {
  const load = useLoad<Profile[]>('/admin/foundations')
  const act = useAction(load.reload)
  return (
    <Loaded load={load} error={act.error}>
      {list =>
        list.length ? (
          <div className="grid">
            {list.map(f => (
              <article key={f.id} className="card">
                <div className="card-head">
                  <div className="who">
                    <Avatar name={f.foundationName} />
                    <div>
                      <h2>{f.foundationName}</h2>
                      <p className="muted">
                        {f.foundationInstagram && <span className="handle">@{f.foundationInstagram.replace(/^@/, '')}</span>}
                        {f.foundationInstagram && f.fullName && ' · '}
                        {f.fullName}
                      </p>
                    </div>
                  </div>
                  <Verification status={f.verificationStatus} />
                </div>
                {f.foundationBio && <p className="desc">{f.foundationBio}</p>}
                <div className="actions">
                  <button disabled={act.busy} onClick={() => act.run(() => api(`/admin/foundations/${f.id}/verify`, 'POST'))}>
                    <BadgeCheck size={16} />
                    Verificar (plan Pro)
                  </button>
                  <button
                    className="danger"
                    disabled={act.busy}
                    onClick={() => confirm(`¿Rechazar la verificación de ${f.foundationName}?`) && act.run(() => api(`/admin/foundations/${f.id}/reject`, 'POST'))}
                  >
                    <X size={16} />
                    Rechazar
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          empty('No hay fundaciones pendientes de verificación.')
        )
      }
    </Loaded>
  )
}

export function Users() {
  const load = useLoad<Profile[]>('/admin/users')
  const act = useAction(load.reload)
  const suspend = (u: Profile, suspended: boolean) =>
    (!suspended || confirm(`¿Suspender a ${u.fullName ?? 'este usuario'}?`)) &&
    act.run(() => api(`/admin/users/${u.id}/suspend`, 'PUT', { suspended }))
  return (
    <Loaded load={load} error={act.error}>
      {users =>
        users.length ? (
          <div className="table-card">
            <table>
              <thead>
                <tr><th>Nombre</th><th>Tipo</th><th>Verificación</th><th>Plan</th><th>Cuenta</th></tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td>
                      <span className="who">
                        <Avatar name={u.fullName} />
                        <strong>{u.fullName ?? '—'}</strong>
                        {u.role === 'admin' && <span className="badge">Admin</span>}
                      </span>
                    </td>
                    <td>{u.accountType === 'foundation' ? u.foundationName ?? 'Fundación' : 'Persona'}</td>
                    <td><Verification status={u.verificationStatus} /></td>
                    <td>
                      <select
                        aria-label={`Plan de ${u.fullName ?? u.id}`}
                        value={u.plan}
                        disabled={act.busy}
                        onChange={e => act.run(() => api(`/admin/users/${u.id}/plan`, 'PUT', { plan: e.target.value }))}
                      >
                        <option value="free">Gratis</option>
                        <option value="pro">Pro</option>
                      </select>
                    </td>
                    <td>
                      <span className="toggle">
                        <button
                          role="switch"
                          className="switch"
                          aria-checked={!u.suspended}
                          aria-label={`Cuenta activa de ${u.fullName ?? u.id}`}
                          disabled={act.busy}
                          onClick={() => suspend(u, !u.suspended)}
                        />
                        <span className={u.suspended ? 'muted' : undefined}>{u.suspended ? 'Suspendida' : 'Activa'}</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          empty('No hay usuarios.')
        )
      }
    </Loaded>
  )
}

export function Reports() {
  const load = useLoad<Report[]>('/admin/reports')
  const act = useAction(load.reload)
  const takeDown = (r: Report) => {
    const reason = prompt(`Motivo para retirar "${r.petName}":`, r.reason)?.trim()
    if (reason)
      act.run(async () => {
        // 409: already taken down (another report) or paused; the report still gets closed
        await api(`/admin/pets/${r.petId}/reject`, 'POST', { reason }).catch(e => {
          if (!(e instanceof ApiError && e.status === 409)) throw e
        })
        await api(`/admin/reports/${r.id}/resolve`, 'POST')
      })
  }
  return (
    <Loaded load={load} error={act.error}>
      {reports =>
        reports.length ? (
          <div className="table-card">
            <table>
              <thead>
                <tr><th>Publicación</th><th>Motivo</th><th>Fecha</th><th><span className="sr-only">Acciones</span></th></tr>
              </thead>
              <tbody>
                {reports.map(r => (
                  <tr key={r.id}>
                    <td><strong>{r.petName}</strong></td>
                    <td>{r.reason}</td>
                    <td className="muted nowrap">{date(r.createdAt)}</td>
                    <td>
                      <div className="actions end">
                        <button className="secondary" disabled={act.busy} onClick={() => act.run(() => api(`/admin/reports/${r.id}/resolve`, 'POST'))}>Descartar</button>
                        <button className="danger" disabled={act.busy} onClick={() => takeDown(r)}>
                          <Trash2 size={16} />
                          Retirar publicación
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          empty('No hay reportes abiertos.')
        )
      }
    </Loaded>
  )
}

const importStatus = { queued: 'En cola', running: 'En curso', done: 'Listo', failed: 'Falló' }

export function Imports() {
  const load = useLoad<ImportJob[]>('/admin/imports')
  const act = useAction(load.reload)
  const [handle, setHandle] = useState('')
  const active = load.data?.some(j => j.status === 'queued' || j.status === 'running')
  useEffect(() => {
    if (!active) return
    const t = setInterval(load.reload, 5000)
    return () => clearInterval(t)
  }, [active, load.reload])

  const submit = (e: FormEvent) => {
    e.preventDefault()
    act.run(async () => {
      await api('/admin/imports', 'POST', { instagramHandle: handle.trim() })
      setHandle('')
    })
  }
  return (
    <>
      <form className="card row" onSubmit={submit}>
        <label>
          Fundación (identificador)
          <input value={handle} onChange={e => setHandle(e.target.value)} placeholder="patas-del-avila" required />
        </label>
        <button disabled={act.busy || !handle.trim()}>
          <Download size={16} />
          Importar
        </button>
      </form>
      <Loaded load={load} error={act.error}>
        {jobs =>
          jobs.length ? (
            <div className="table-card">
              <table>
                <thead>
                  <tr><th>Fundación</th><th>Estado</th><th>Creadas</th><th>Error</th><th>Fecha</th></tr>
                </thead>
                <tbody>
                  {jobs.map(j => (
                    <tr key={j.id}>
                      <td><strong>{j.instagramHandle}</strong></td>
                      <td><span className={`badge ${j.status}`}>{importStatus[j.status]}</span></td>
                      <td>{j.petsCreated}</td>
                      <td className={j.error ? 'error' : 'muted'}>{j.error ?? '—'}</td>
                      <td className="muted nowrap">{date(j.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            empty('Aún no hay importaciones.')
          )
        }
      </Loaded>
    </>
  )
}
