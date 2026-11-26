import { useEffect, useState } from 'react'
import { auth, onUnauthorized } from './api'
import Auth from './components/Auth'
import Dashboard from './components/Dashboard'
import QuizPage from './components/QuizPage'
import Library from './components/Library'
import StudentsOverview from './components/StudentsOverview'
import TeachersOverview from './components/TeachersOverview'

// A saved user only counts if there is also a token (older sessions had none).
const loadUser = () => {
  try {
    return auth.get() ? JSON.parse(localStorage.getItem('lp-user')) : null
  } catch {
    return null
  }
}

const isStaff = (u) => u?.role === 'teacher' || u?.role === 'admin'
const homeView = (u) => (u?.role === 'admin' ? 'teachers' : isStaff(u) ? 'students' : 'dashboard')
const navFor = (u) =>
  u.role === 'admin'
    ? ['teachers', 'students', 'library']
    : u.role === 'teacher'
      ? ['students', 'library']
      : ['dashboard', 'quiz', 'library']

export default function App() {
  const [user, setUser] = useState(loadUser)
  const [view, setView] = useState(() => homeView(loadUser()))
  const [practiceSet, setPracticeSet] = useState(null)
  const [quizKey, setQuizKey] = useState(0) // remount quiz page for a fresh quiz
  const [notice, setNotice] = useState('')

  const login = (u, token) => {
    auth.set(token)
    localStorage.setItem('lp-user', JSON.stringify(u))
    setNotice('')
    setView(homeView(u))
    setUser(u)
  }
  const logout = (message = '') => {
    auth.clear()
    localStorage.removeItem('lp-user')
    sessionStorage.clear()
    setNotice(message)
    setUser(null)
  }

  // Any API call that comes back 401 (expired/invalid token) logs the user out.
  useEffect(() => {
    onUnauthorized((message) => logout(message || 'Please log in again'))
  }, [])
  const go = (v) => {
    setPracticeSet(null)
    setQuizKey((k) => k + 1)
    setView(v)
  }

  if (!user) return <Auth onLogin={login} notice={notice} />

  return (
    <div className="app">
      <header className="topbar">
        <span className="brand">LearnPath</span>
        <nav>
          {navFor(user).map((v) => (
            <button key={v} className={view === v ? 'active' : ''} onClick={() => go(v)}>
              {v[0].toUpperCase() + v.slice(1)}
            </button>
          ))}
        </nav>
        <span className="muted small">
          {user.name}
          {isStaff(user) && ` (${user.role})`} ·{' '}
          <button className="link" onClick={() => logout()}>
            Log out
          </button>
        </span>
      </header>

      <main>
        {view === 'dashboard' && (
          <Dashboard
            user={user}
            onStartQuiz={() => go('quiz')}
            onPractice={(qs) => {
              setPracticeSet(qs)
              setQuizKey((k) => k + 1)
              setView('quiz')
            }}
          />
        )}
        {view === 'quiz' && <QuizPage key={quizKey} user={user} practiceSet={practiceSet} />}
        {view === 'library' && <Library />}
        {view === 'students' && isStaff(user) && <StudentsOverview user={user} />}
        {view === 'teachers' && user.role === 'admin' && <TeachersOverview user={user} />}
      </main>
    </div>
  )
}
