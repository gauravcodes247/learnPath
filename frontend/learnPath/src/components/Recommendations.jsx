import { useRecommendations } from '../hooks/useRecommendations'

const TYPE_ICON = { note: '📄', video: '▶️', practice: '✏️' }

export default function Recommendations({ userId, onPractice, readOnly = false }) {
  const { status, data, error, regenerate } = useRecommendations(userId)

  return (
    <section className="card">
      <div className="row between">
        <h2>Your study plan</h2>
        {status === 'ready' && (
          <button className="btn ghost small" onClick={regenerate}>
            Regenerate
          </button>
        )}
      </div>

      {status === 'loading' && (
        <div className="skeleton-group">
          <p className="muted">Analysing your attempts and searching the content library…</p>
          <div className="skeleton" />
          <div className="skeleton" />
          <div className="skeleton short" />
        </div>
      )}

      {status === 'error' && (
        <div className="feedback bad">
          Couldn't load recommendations: {error}{' '}
          <button className="link" onClick={regenerate}>
            Try again
          </button>
        </div>
      )}

      {status === 'empty' && <p className="muted">Take your first quiz to get a personalised plan.</p>}

      {status === 'ready' && data && (
        <>
          <div className="row gap wrap meta">
            <span className="pill">{data.cached ? 'Cached' : 'Fresh'}</span>
            <span className="pill">{data.generatedBy === 'gemini' ? 'AI-generated (Gemini)' : 'Rule-based (no LLM)'}</span>
            <span className="pill">Retrieval: {data.retrieval}</span>
          </div>

          <p className="summary">{data.summary}</p>

          <div className="row gap wrap">
            {data.weakTopics.map((w) => (
              <div key={w.topic} className="weak">
                <strong>{w.topic}</strong> <span className="bad">{w.accuracy}%</span>
                {w.reason && <p className="muted small">{w.reason}</p>}
              </div>
            ))}
          </div>

          <ol className="plan">
            {data.studyPlan.map((s) => (
              <li key={s.step}>
                <div>
                  <strong>{s.title}</strong>
                  <p className="muted small">{s.action}</p>
                </div>
                {s.resource && (
                  <div className="resource">
                    <span>
                      {TYPE_ICON[s.resource.type]} {s.resource.title}
                    </span>
                    <span className="muted small">
                      {s.resource.topic}
                      {typeof s.resource.score === 'number' && ` · match ${s.resource.score.toFixed(2)}`}
                    </span>
                    {s.resource.url && (
                      <a href={s.resource.url} target="_blank" rel="noreferrer">
                        Open
                      </a>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ol>

          {readOnly ? (
            <p className="muted small">{data.practiceQuestions.length} targeted practice questions generated for this student.</p>
          ) : data.practiceQuestions.length > 0 ? (
            <button className="btn primary" onClick={() => onPractice(data.practiceQuestions)}>
              Practise {data.practiceQuestions.length} targeted questions
            </button>
          ) : (
            <p className="muted">No extra practice questions this time.</p>
          )}
        </>
      )}
    </section>
  )
}
