import { useState } from 'react'

// Controlled quiz: the selected option for each question lives in state.
// Picking an option locks the question and shows feedback immediately.
export default function Quiz({ questions, title, onFinish }) {
  const [index, setIndex] = useState(0)
  const [selected, setSelected] = useState({}) // { [questionIndex]: optionIndex }
  const [done, setDone] = useState(false)

  const q = questions[index]
  const answered = selected[index] !== undefined
  const isCorrect = selected[index] === q?.answerIndex
  const score = Object.entries(selected).filter(([i, opt]) => questions[i].answerIndex === opt).length

  const choose = (opt) => {
    if (answered) return
    setSelected({ ...selected, [index]: opt })
  }

  const next = () => {
    if (index < questions.length - 1) return setIndex(index + 1)
    setDone(true)
    onFinish(
      questions.map((qq, i) => ({
        questionId: qq._id,
        questionText: qq.question,
        topic: qq.topic,
        selectedIndex: selected[i],
        correct: selected[i] === qq.answerIndex,
      })),
    )
  }

  if (!questions.length) return <p className="muted">No questions available.</p>

  if (done) {
    const pct = Math.round((score / questions.length) * 100)
    return (
      <div className="card center">
        <h2>{title} complete</h2>
        <p className={`big ${pct >= 60 ? 'good' : 'bad'}`}>
          {score} / {questions.length} ({pct}%)
        </p>
        <p className="muted">Saved. Your dashboard and recommendations are updated.</p>
      </div>
    )
  }

  return (
    <div className="card quiz">
      <div className="quiz-head">
        <span className="pill">{q.topic}</span>
        <span className="muted">
          Question {index + 1} of {questions.length} · Score {score}
        </span>
      </div>
      <div className="progress">
        <div style={{ width: `${(index / questions.length) * 100}%` }} />
      </div>
      <h3>{q.question}</h3>
      <div className="options">
        {q.options.map((opt, i) => {
          let cls = 'option'
          if (answered && i === q.answerIndex) cls += ' correct'
          else if (answered && i === selected[index]) cls += ' wrong'
          return (
            <label key={i} className={cls}>
              <input
                type="radio"
                name={`q-${index}`}
                value={i}
                checked={selected[index] === i}
                onChange={() => choose(i)}
                disabled={answered}
              />
              {opt}
            </label>
          )
        })}
      </div>
      {answered && (
        <div className={`feedback ${isCorrect ? 'good' : 'bad'}`}>
          <strong>{isCorrect ? 'Correct!' : 'Not quite.'}</strong> {q.explanation}
        </div>
      )}
      <button className="btn primary" onClick={next} disabled={!answered}>
        {index < questions.length - 1 ? 'Next question' : 'Finish quiz'}
      </button>
    </div>
  )
}
