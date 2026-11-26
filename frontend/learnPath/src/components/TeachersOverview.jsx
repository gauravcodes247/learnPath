import { useEffect, useState } from 'react'
import { Bar, BarChart, CartesianGrid, Cell, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { api } from '../api'
import StudentsOverview from './StudentsOverview'

const tone = (acc) => (acc == null ? '' : acc < 60 ? 'bad' : acc < 80 ? 'warn' : 'good')
const colorFor = (acc) => (acc < 60 ? '#dc2626' : acc < 80 ? '#d97706' : '#16a34a')
const fmtPct = (v) => (v == null ? '–' : `${v}%`)
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }) : '–')

// Admin view: one row per teacher; click a teacher to see their students.
export default function TeachersOverview({ user }) {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    if (selected) return // reload the list when coming back (students may have been reassigned)
    api
      .get('/admin/teachers')
      .then(setData)
      .catch((e) => setError(e.message))
  }, [selected])

  if (error) return <p className="feedback bad">{error}</p>
  if (!data) return <p className="muted">Loading teachers…</p>

  if (selected)
    return (
      <div>
        <button className="btn ghost small back" onClick={() => setSelected(null)}>
          ← All teachers
        </button>
        <StudentsOverview user={user} teacher={selected} />
      </div>
    )

  const { teachers, unassigned } = data
  const assigned = teachers.reduce((sum, t) => sum + t.studentCount, 0)
  const chartData = teachers.filter((t) => t.accuracy != null)

  return (
    <div className="grid">
      <div className="stats">
        <Stat label="Teachers" value={teachers.length} />
        <Stat label="Students assigned" value={assigned} />
        <Stat label="Unassigned students" value={unassigned} tone={unassigned ? 'warn' : ''} />
        <Stat
          label="Students below 60%"
          value={teachers.reduce((sum, t) => sum + t.studentsBelowThreshold, 0)}
          tone="bad"
        />
      </div>

      <section className="card span-2">
        <h2>Teachers</h2>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Teacher</th>
                <th>Students</th>
                <th>Active this week</th>
                <th>Quizzes</th>
                <th>Class average</th>
                <th>Below 60%</th>
                <th>Weakest topic (class)</th>
                <th>Last activity</th>
              </tr>
            </thead>
            <tbody>
              {teachers.map((t) => (
                <tr key={t.id} onClick={() => setSelected(t)} title="Open this teacher's students">
                  <td>
                    <strong>{t.name}</strong>
                    <div className="muted small">{t.email}</div>
                  </td>
                  <td>
                    {t.studentCount}
                    <div className="muted small">{t.students.join(', ') || 'No students'}</div>
                  </td>
                  <td>
                    {t.thisWeek.activeStudents} / {t.studentCount}
                  </td>
                  <td>
                    {t.quizzes}
                    <div className="muted small">{t.thisWeek.quizzes} this week</div>
                  </td>
                  <td>
                    <div className="score">
                      <div className="score-bar">
                        <div className={tone(t.accuracy)} style={{ width: `${t.accuracy || 0}%` }} />
                      </div>
                      <span className={tone(t.accuracy)}>{fmtPct(t.accuracy)}</span>
                    </div>
                  </td>
                  <td className={t.studentsBelowThreshold ? 'bad' : ''}>{t.studentsBelowThreshold}</td>
                  <td>
                    {t.weakestTopic ? (
                      <>
                        {t.weakestTopic.topic} <span className={tone(t.weakestTopic.accuracy)}>({fmtPct(t.weakestTopic.accuracy)})</span>
                      </>
                    ) : (
                      '–'
                    )}
                  </td>
                  <td>{fmtDate(t.lastActive)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!teachers.length && <p className="muted">No teachers yet.</p>}
        </div>
      </section>

      <section className="card span-2">
        <h2>Class average by teacher</h2>
        {chartData.length ? (
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={chartData} margin={{ top: 10, right: 10, bottom: 10, left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" fontSize={12} />
              <YAxis domain={[0, 100]} unit="%" fontSize={12} />
              <Tooltip formatter={(v, _n, p) => [`${v}% (${p.payload.studentCount} students)`, 'Class average']} />
              <ReferenceLine y={60} stroke="#94a3b8" strokeDasharray="4 4" />
              <Bar dataKey="accuracy" radius={[6, 6, 0, 0]}>
                {chartData.map((t) => (
                  <Cell key={t.id} fill={colorFor(t.accuracy)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="muted">No quiz data yet.</p>
        )}
      </section>
    </div>
  )
}

function Stat({ label, value, tone: t }) {
  return (
    <div className="card stat">
      <span className="muted small">{label}</span>
      <span className={`stat-value ${t || ''}`}>{value}</span>
    </div>
  )
}
