import { useEffect, useState } from 'react'
import { api } from '../api'
import { clearRecommendationCache } from '../hooks/useRecommendations'
import Quiz from './Quiz'

// mode "topic": student picks a topic, questions come from the bank.
// mode "practice": questions are the targeted set from the study plan.
export default function QuizPage({ user, practiceSet }) {
  const [topics, setTopics] = useState([])
  const [topic, setTopic] = useState('')
  const [questions, setQuestions] = useState(practiceSet || null)
  const [error, setError] = useState('')
  const mode = practiceSet ? 'practice' : 'topic'

  useEffect(() => {
    if (!practiceSet) api.get('/quiz/topics').then((d) => setTopics(d.topics)).catch((e) => setError(e.message))
  }, [practiceSet])

  const start = async () => {
    try {
      const d = await api.get(`/quiz/questions?topic=${encodeURIComponent(topic)}&limit=5`)
      setQuestions(d.questions)
    } catch (e) {
      setError(e.message)
    }
  }

  const finish = async (answers) => {
    try {
      await api.post('/quiz/attempts', { mode, topic: mode === 'practice' ? 'Mixed' : topic, answers })
      clearRecommendationCache(user.id)
    } catch (e) {
      setError(e.message)
    }
  }

  if (error) return <p className="feedback bad">{error}</p>

  if (!questions)
    return (
      <div className="card center">
        <h2>Take a quiz</h2>
        <p className="muted">Pick a topic. You'll get 5 random questions with instant feedback.</p>
        <select value={topic} onChange={(e) => setTopic(e.target.value)}>
          <option value="">Choose a topic…</option>
          {topics.map((t) => (
            <option key={t.topic} value={t.topic}>
              {t.topic} ({t.questions} questions)
            </option>
          ))}
        </select>
        <button className="btn primary" disabled={!topic} onClick={start}>
          Start quiz
        </button>
      </div>
    )

  return <Quiz questions={questions} title={mode === 'practice' ? 'Targeted practice' : `${topic} quiz`} onFinish={finish} />
}
