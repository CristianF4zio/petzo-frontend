import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
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

function Loaded<T>({ load, error, children }: { load: Load<T>; error?: string; children: (data: T) => ReactNode }) {
  if (load.error)
    return (
      <p className="error" role="alert">
        {load.error} <button onClick={load.reload}>Reintentar</button>
      </p>
    )
  if (load.data === undefined) return <p className="muted">Cargando…</p>
  return (
    <>
      {error && <p className="error" role="alert">{error}</p>}
      {children(load.data)}
    </>
  )
}

const empty = (text: string) => <p className="muted">{text}</p>

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
        pets.length
          ? pets.map(p => (
              <article key={p.id} className="card">
                <div className="photos">
                  {p.photos.map(ph => <img key={ph.id} src={ph.url} alt={p.name} />)}
                </div>
                <h3>{p.name} <span className="muted">· {p.species === 'dog' ? 'Perro' : 'Gato'}</span></h3>
                <p className="muted">Publicado por {p.publisher?.name ?? '—'}</p>
                <p><b>Riesgo:</b> {p.riskScore ?? '—'} / 100</p>
                <p><b>Motivo:</b> {p.moderationReason ?? '—'}</p>
                {p.description && <p>{p.description}</p>}
                <div className="actions">
                  <button disabled={act.busy} onClick={() => act.run(() => api(`/admin/pets/${p.id}/approve?version=${p.version}`, 'POST'))}>
                    Aprobar
                  </button>
                  <button className="danger" disabled={act.busy} onClick={() => reject(p)}>Rechazar</button>
                </div>
              </article>
            ))
          : empty('No hay publicaciones en revisión.')
      }
    </Loaded>
  )
}

export function Foundations() {
  const load = useLoad<Profile[]>('/admin/foundations')
  const act = useAction(load.reload)
  return (
    <Loaded load={load} error={act.error}>
      {list =>
        list.length
          ? list.map(f => (
              <article key={f.id} className="card">
                <h3>{f.foundationName}</h3>
                <p className="muted">
                  {f.foundationInstagram && `@${f.foundationInstagram.replace(/^@/, '')} · `}
                  {f.fullName}
                </p>
                {f.foundationBio && <p>{f.foundationBio}</p>}
                <div className="actions">
                  <button disabled={act.busy} onClick={() => act.run(() => api(`/admin/foundations/${f.id}/verify`, 'POST'))}>
                    Verificar (plan Pro)
                  </button>
                  <button
                    className="danger"
                    disabled={act.busy}
                    onClick={() => confirm(`¿Rechazar la verificación de ${f.foundationName}?`) && act.run(() => api(`/admin/foundations/${f.id}/reject`, 'POST'))}
                  >
                    Rechazar
                  </button>
                </div>
              </article>
            ))
          : empty('No hay fundaciones pendientes de verificación.')
      }
    </Loaded>
  )
}

const verification = { none: '—', pending: 'Pendiente', verified: 'Verificada', rejected: 'Rechazada' }

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
          <table>
            <thead>
              <tr><th>Nombre</th><th>Tipo</th><th>Verificación</th><th>Plan</th><th>Cuenta</th></tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td>{u.fullName ?? '—'}{u.role === 'admin' && <span className="muted"> (admin)</span>}</td>
                  <td>{u.accountType === 'foundation' ? u.foundationName ?? 'Fundación' : 'Persona'}</td>
                  <td>{verification[u.verificationStatus]}</td>
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
                    <div className="actions">
                      {u.suspended ? (
                        <button disabled={act.busy} onClick={() => suspend(u, false)}>Reactivar</button>
                      ) : (
                        <button className="danger" disabled={act.busy} onClick={() => suspend(u, true)}>Suspender</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
          <table>
            <thead>
              <tr><th>Publicación</th><th>Motivo</th><th>Fecha</th><th /></tr>
            </thead>
            <tbody>
              {reports.map(r => (
                <tr key={r.id}>
                  <td>{r.petName}</td>
                  <td>{r.reason}</td>
                  <td>{date(r.createdAt)}</td>
                  <td>
                    <div className="actions">
                      <button disabled={act.busy} onClick={() => act.run(() => api(`/admin/reports/${r.id}/resolve`, 'POST'))}>Descartar</button>
                      <button className="danger" disabled={act.busy} onClick={() => takeDown(r)}>Retirar publicación</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
      <form className="row" onSubmit={submit}>
        <label>
          Fundación (identificador)
          <input value={handle} onChange={e => setHandle(e.target.value)} placeholder="patas-del-avila" required />
        </label>
        <button disabled={act.busy || !handle.trim()}>Importar</button>
      </form>
      <Loaded load={load} error={act.error}>
        {jobs =>
          jobs.length ? (
            <table>
              <thead>
                <tr><th>Fundación</th><th>Estado</th><th>Creadas</th><th>Error</th><th>Fecha</th></tr>
              </thead>
              <tbody>
                {jobs.map(j => (
                  <tr key={j.id}>
                    <td>{j.instagramHandle}</td>
                    <td>{importStatus[j.status]}</td>
                    <td>{j.petsCreated}</td>
                    <td>{j.error ?? '—'}</td>
                    <td>{date(j.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            empty('Aún no hay importaciones.')
          )
        }
      </Loaded>
    </>
  )
}

const stats = {
  active_pets: 'Publicaciones activas',
  pending_review: 'En revisión',
  rejected: 'Rechazadas',
  adopted: 'Adoptadas',
  requests: 'Solicitudes',
  users: 'Usuarios',
}

export function Stats() {
  const load = useLoad<Record<keyof typeof stats, number>>('/admin/stats')
  return (
    <Loaded load={load}>
      {data => (
        <div className="stats">
          {Object.entries(stats).map(([key, label]) => (
            <div key={key} className="card">
              <strong>{data[key as keyof typeof stats]}</strong>
              <span className="muted">{label}</span>
            </div>
          ))}
        </div>
      )}
    </Loaded>
  )
}
