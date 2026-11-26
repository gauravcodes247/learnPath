import { useEffect, useMemo, useState } from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { api } from '../api'
import Dashboard from './Dashboard'

const tone = (acc) => (acc == null ? '' : acc < 60 ? 'bad' : acc < 80 ? 'warn' : 'good')
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }) : '–')
const fmtPct = (v) => (v == null ? '–' : `${v}%`)

// Teacher: their own students. Admin: every student + reassign teacher.
// Main data for each student + drill-down into one student.
// `teacher` (admin only): show just that teacher's students.
export default function StudentsOverview({ user, teacher = null }) {
  const isAdmin = user.role === 'admin'
  const [students, setStudents] = useState(null)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)
  const [teachers, setTeachers] = useState([])

  useEffect(() => {
    api
      .get(`/teacher/students${teacher ? `?teacherId=${teacher.id}` : ''}`)
      .then((d) => setStudents(d.students))
      .catch((e) => setError(e.message))
    if (isAdmin) api.get('/users/teachers').then((d) => setTeachers(d.teachers))
  }, [isAdmin, teacher])

  const reassign = async (student, teacherId) => {
    try {
      await api.patch(`/admin/students/${student.id}/teacher`, { teacherId: teacherId || null })
      const teacherName = teachers.find((t) => t.id === teacherId)?.name || null
      setStudents((list) =>
        list
          .map((s) => (s.id === student.id ? { ...s, teacherId: teacherId || null, teacherName } : s))
          // viewing one teacher's class: a student moved elsewhere leaves this list
          .filter((s) => !teacher || s.teacherId === teacher.id),
      )
    } catch (e) {
      setError(e.message)
    }
  }

  // How many students are weak in each topic (for the class chart)
  const weakByTopic = useMemo(() => {
    const counts = {}
    for (const s of students || []) for (const t of s.weakTopics) counts[t] = (counts[t] || 0) + 1
    return Object.entries(counts)
      .map(([topic, count]) => ({ topic, count }))
      .sort((a, b) => b.count - a.count)
  }, [students])

  if (error) return <p className="feedback bad">{error}</p>
  if (!students) return <p className="muted">Loading students…</p>

  if (selected)
    return (
      <div>
        <button className="btn ghost small back" onClick={() => setSelected(null)}>
          ← All students
        </button>
        <h2 className="drill-title">
          {selected.name} <span className="muted small">{selected.email}</span>
        </h2>
        <Dashboard user={selected} readOnly />
      </div>
    )

  const active = students.filter((s) => s.thisWeek.quizzes > 0).length
  const withData = students.filter((s) => s.accuracy != null)
  const classAvg = withData.length
    ? Math.round((withData.reduce((sum, s) => sum + s.accuracy, 0) / withData.length) * 10) / 10
    : null
  const shown = students.filter((s) =>
    `${s.name} ${s.email}`.toLowerCase().includes(search.trim().toLowerCase()),
  )

  return (
    <div className="grid">
      <div className="stats">
        <Stat label={isAdmin && !teacher ? 'Students' : 'Students in class'} value={students.length} />
        <Stat label="Active this week" value={`${active} / ${students.length}`} />
        <Stat label="Class average" value={fmtPct(classAvg)} tone={tone(classAvg)} />
        <Stat label="Most common weak topic" value={weakByTopic[0]?.topic || '–'} tone="bad" />
      </div>

      <section className="card span-2">
        <div className="row between wrap gap">
          <h2>{teacher ? `${teacher.name}'s students` : isAdmin ? 'All students' : `My students (${user.name})`}</h2>
          <input
            className="search"
            placeholder="Search by name or email"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Quizzes</th>
                <th>This week</th>
                <th>Questions</th>
                <th>Score</th>
                <th>Weak topics</th>
                <th>Strongest</th>
                <th>Last active</th>
                {isAdmin && <th>Teacher</th>}
              </tr>
            </thead>
            <tbody>
              {shown.map((s) => (
                <tr key={s.id} onClick={() => setSelected(s)} title="Open student dashboard">
                  <td>
                    <strong>{s.name}</strong>
                    <div className="muted small">{s.email}</div>
                  </td>
                  <td>{s.quizzes}</td>
                  <td>
                    {s.thisWeek.quizzes} quiz{s.thisWeek.quizzes === 1 ? '' : 'zes'}
                    <div className={`small ${tone(s.thisWeek.accuracy)}`}>{fmtPct(s.thisWeek.accuracy)}</div>
                  </td>
                  <td>
                    {s.correct}/{s.questions}
                  </td>
                  <td>
                    <div className="score">
                      <div className="score-bar">
                        <div className={tone(s.accuracy)} style={{ width: `${s.accuracy || 0}%` }} />
                      </div>
                      <span className={tone(s.accuracy)}>{fmtPct(s.accuracy)}</span>
                    </div>
                  </td>
                  <td>
                    {s.weakTopics.length ? (
                      <div className="chips">
                        {s.weakTopics.map((t) => (
                          <span key={t} className="chip bad-chip">
                            {t}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="muted small">{s.quizzes ? 'None' : 'No quizzes yet'}</span>
                    )}
                  </td>
                  <td>{s.strongestTopic || '–'}</td>
                  <td>{fmtDate(s.lastActive)}</td>
                  {isAdmin && (
                    <td onClick={(e) => e.stopPropagation()}>
                      <select className="teacher-select" value={s.teacherId || ''} onChange={(e) => reassign(s, e.target.value)}>
                        <option value="">Unassigned</option>
                        {teachers.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name}
                          </option>
                        ))}
                      </select>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          {!students.length && (
            <p className="muted">
              {isAdmin ? 'No students yet.' : 'No students are assigned to you yet. The admin can assign them.'}
            </p>
          )}
          {students.length > 0 && !shown.length && <p className="muted">No students match "{search}".</p>}
        </div>
      </section>

      <section className="card span-2">
        <h2>Students weak in each topic</h2>
        {weakByTopic.length ? (
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={weakByTopic} margin={{ top: 10, right: 10, bottom: 10, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="topic" fontSize={12} />
              <YAxis allowDecimals={false} fontSize={12} />
              <Tooltip formatter={(v) => [`${v} student${v === 1 ? '' : 's'}`, 'Below 60%']} />
              <Bar dataKey="count" fill="#dc2626" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="muted">No weak topics across the class.</p>
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
