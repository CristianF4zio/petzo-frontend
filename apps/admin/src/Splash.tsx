import { useEffect, useState } from 'react'
import { PawPrint } from 'lucide-react'

export const Logo = ({ size = 40 }: { size?: number }) => (
  <span className="logo" style={{ width: size, height: size }}>
    <PawPrint size={size * 0.55} strokeWidth={2.25} />
  </span>
)

export function Splash() {
  const [phase, setPhase] = useState<'in' | 'out' | 'done'>('in')
  useEffect(() => {
    const ms = matchMedia('(prefers-reduced-motion: reduce)').matches ? 500 : 1200
    const out = setTimeout(() => setPhase('out'), ms)
    const done = setTimeout(() => setPhase('done'), ms + 250)
    return () => {
      clearTimeout(out)
      clearTimeout(done)
    }
  }, [])
  if (phase === 'done') return null
  return (
    <div className={phase === 'out' ? 'splash out' : 'splash'} aria-hidden="true">
      <div className="splash-mark">
        <span className="ring" />
        <Logo size={88} />
      </div>
      <strong>Petzo</strong>
      <span className="muted">Panel administrativo</span>
    </div>
  )
}
