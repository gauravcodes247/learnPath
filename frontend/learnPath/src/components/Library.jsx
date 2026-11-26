import { useEffect, useState } from 'react'
import { api } from '../api'

const TYPE_ICON = { note: '📄', video: '▶️', practice: '✏️' }

// Browse the content library, or search it semantically (vector search).
export default function Library() {
  const [items, setItems] = useState([])
  const [query, setQuery] = useState('')
  const [results, setResults] = useState(null)

  useEffect(() => {
    api.get('/content').then((d) => setItems(d.items))
  }, [])

  const search = async (e) => {
    e.preventDefault()
    if (!query.trim()) return setResults(null)
    setResults(await api.get(`/content/search?q=${encodeURIComponent(query)}`))
  }

  const list = results ? results.results : items

  return (
    <div className="card">
      <h2>Content library</h2>
      <form className="row gap" onSubmit={search}>
        <input
          placeholder='Search by meaning, e.g. "shortest path with weights"'
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button className="btn primary">Search</button>
      </form>
      {results && <p className="muted small">Method: {results.method}</p>}
      <div className="library">
        {list.map((c) => (
          <div key={c._id} className="lib-item">
            <div className="row between">
              <strong>
                {TYPE_ICON[c.type]} {c.title}
              </strong>
              {typeof c.score === 'number' && <span className="pill">{c.score.toFixed(2)}</span>}
            </div>
            <span className="muted small">
              {c.topic} · {c.type} · {c.difficulty}
            </span>
            <p className="small">{c.summary}</p>
            {c.url && (
              <a href={c.url} target="_blank" rel="noreferrer" className="small">
                Open resource
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
