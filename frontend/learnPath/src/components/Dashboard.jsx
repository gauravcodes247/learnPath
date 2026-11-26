import { useEffect, useState } from 'react'
import {
  Bar, BarChart, CartesianGrid, Cell, Line, LineChart, ReferenceLine,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import { api } from '../api'
import Recommendations from './Recommendations'

const colorFor = (acc) => (acc < 60 ? '#dc2626' : acc < 80 ? '#d97706' : '#16a34a')

export default function Dashboard({ user, onPractice, onStartQuiz, readOnly = false }) {
  const [analytics, setAnalytics] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api
      .get(`/students/${user.id}/analytics`)
      .then(setAnalytics)
      .catch((e) => setError(e.message))
  }, [user.id])

  if (error) return <p className="feedback bad">{error}</p>
  if (!analytics) return <p className="muted">Loading dashboard…</p>

  const { byTopic, overall, trend } = analytics
  const weakest = byTopic[0]
  const trendData = trend.map((t) => ({ ...t, label: new Date(t.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }) }))

  if (!byTopic.length)
    return (
      <div className="card center">
        {readOnly ? (
          <p className="muted">{user.name} hasn't taken any quizzes yet.</p>
        ) : (
          <>
            <h2>Welcome, {user.name}!</h2>
            <p className="muted">No quiz attempts yet. Take a quiz to see your progress and get a study plan.</p>
            <button className="btn primary" onClick={onStartQuiz}>
              Take a quiz
            </button>
          </>
        )}
      </div>
    )

  return (
    <div className="grid">
      <div className="stats">
        <Stat label="Overall accuracy" value={`${overall.accuracy}%`} />
        <Stat label="Quizzes taken" value={overall.attempts} />
        <Stat label="Questions answered" value={overall.questions} />
        <Stat label="Weakest topic" value={weakest?.topic} tone="bad" />
      </div>

      <section className="card">
        <h2>Accuracy by topic</h2>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={byTopic} margin={{ top: 10, right: 10, bottom: 30, left: -10 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="topic" interval={0} angle={-20} textAnchor="end" fontSize={12} />
            <YAxis domain={[0, 100]} unit="%" fontSize={12} />
            <Tooltip formatter={(v, _n, p) => [`${v}% (${p.payload.correct}/${p.payload.attempted})`, 'Accuracy']} />
            <ReferenceLine y={60} stroke="#94a3b8" strokeDasharray="4 4" label={{ value: 'weak < 60%', fontSize: 11, position: 'insideTopRight' }} />
            <Bar dataKey="accuracy" radius={[6, 6, 0, 0]}>
              {byTopic.map((t) => (
                <Cell key={t.topic} fill={colorFor(t.accuracy)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </section>

      <section className="card">
        <h2>Recent quiz scores</h2>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={trendData} margin={{ top: 10, right: 10, bottom: 10, left: -10 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="label" fontSize={12} />
            <YAxis domain={[0, 100]} unit="%" fontSize={12} />
            <Tooltip formatter={(v, _n, p) => [`${v}%`, p.payload.topic]} />
            <Line type="monotone" dataKey="percent" stroke="#4f46e5" strokeWidth={2} dot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </section>

      <div className="span-2">
        <Recommendations userId={user.id} onPractice={onPractice} readOnly={readOnly} />
      </div>
    </div>
  )
}

function Stat({ label, value, tone }) {
  return (
    <div className="card stat">
      <span className="muted small">{label}</span>
      <span className={`stat-value ${tone || ''}`}>{value}</span>
    </div>
  )
}
