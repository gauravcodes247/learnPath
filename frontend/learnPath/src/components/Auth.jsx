import { useEffect, useState } from 'react'
import { api } from '../api'

export default function Auth({ onLogin, notice }) {
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({ name: '', email: '', password: '', teacherId: '' })
  const [teachers, setTeachers] = useState([])

  // Load teachers for the sign-up dropdown (public endpoint)
  useEffect(() => {
    if (mode === 'register' && !teachers.length)
      api.get('/users/teachers').then((d) => setTeachers(d.teachers)).catch(() => {})
  }, [mode, teachers.length])
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const update = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      // Both endpoints return { token, user }
      const { token, user } =
        mode === 'register'
          ? await api.post('/users/register', { ...form, teacherId: form.teacherId || undefined })
          : await api.post('/users/login', { email: form.email, password: form.password })
      onLogin(user, token)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="auth-wrap">
      <form className="card auth" onSubmit={submit}>
        <h1 className="brand">LearnPath</h1>
        <p className="muted">Personalised study plans from your quiz performance.</p>
        {notice && <p className="error">{notice}</p>}
        {mode === 'register' && (
          <>
            <input name="name" placeholder="Name" value={form.name} onChange={update} required />
            <select name="teacherId" value={form.teacherId} onChange={update}>
              <option value="">Choose your teacher (optional)</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </>
        )}
        <input name="email" type="email" placeholder="Email" value={form.email} onChange={update} required />
        <input name="password" type="password" placeholder="Password (min 6)" minLength={6} value={form.password} onChange={update} required />
        {error && <p className="error">{error}</p>}
        <button className="btn primary" disabled={busy}>
          {busy ? 'Please wait…' : mode === 'login' ? 'Log in' : 'Create account'}
        </button>
        <button type="button" className="link" onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>
          {mode === 'login' ? 'New here? Create an account' : 'Have an account? Log in'}
        </button>
        <button
          type="button"
          className="btn ghost"
          onClick={() => setForm({ ...form, email: 'demo@learnpath.com', password: '123456' })}
        >
          Fill demo student
        </button>
      </form>
    </div>
  )
}
