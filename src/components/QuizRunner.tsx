/**
 * QuizRunner — steps through a quiz one question at a time.
 *
 * Both "multiple-choice" and "predict-output" questions use the same pick-an-
 * option UI; the only difference is that predict-output prompts embed a code
 * block (rendered via Markdown). Feedback is immediate and the final score is
 * recorded to progress.
 */
import { useState } from 'react'
import type { Quiz } from '../types/content'
import { useProgress } from '../state/ProgressContext'
import Markdown from './Markdown'

interface Props {
  quiz: Quiz
}

export default function QuizRunner({ quiz }: Props) {
  const { recordQuizAttempt } = useProgress()
  const [index, setIndex] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [revealed, setRevealed] = useState(false)
  const [score, setScore] = useState(0)
  const [finished, setFinished] = useState(false)

  const question = quiz.questions[index]
  const isLast = index === quiz.questions.length - 1

  function choose(optionIndex: number) {
    if (revealed) return
    setSelected(optionIndex)
    setRevealed(true)
    if (optionIndex === question.answerIndex) setScore((s) => s + 1)
  }

  function next() {
    if (isLast) {
      recordQuizAttempt(quiz.id, score, quiz.questions.length)
      setFinished(true)
    } else {
      setIndex((i) => i + 1)
      setSelected(null)
      setRevealed(false)
    }
  }

  function restart() {
    setIndex(0)
    setSelected(null)
    setRevealed(false)
    setScore(0)
    setFinished(false)
  }

  if (finished) {
    const total = quiz.questions.length
    const pct = Math.round((score / total) * 100)
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-6 text-center">
        <h2 className="text-xl font-bold text-slate-900">Quiz complete</h2>
        <p className="mt-2 text-4xl font-bold text-brand-600">
          {score}/{total}
        </p>
        <p className="mt-1 text-slate-600">{pct}% correct</p>
        <button
          onClick={restart}
          className="mt-5 rounded-md bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600"
        >
          Try again
        </button>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6">
      <div className="mb-4 flex items-center justify-between text-sm text-slate-500">
        <span>
          Question {index + 1} of {quiz.questions.length}
        </span>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs">
          {question.kind === 'predict-output' ? 'Predict the output' : 'Multiple choice'}
        </span>
      </div>

      <div className="mb-4">
        <Markdown>{question.prompt}</Markdown>
      </div>

      <ul className="space-y-2">
        {question.options.map((option, i) => {
          const isCorrect = i === question.answerIndex
          const isChosen = i === selected
          let style = 'border-slate-200 hover:border-brand-400 hover:bg-brand-50'
          if (revealed && isCorrect) style = 'border-emerald-400 bg-emerald-50'
          else if (revealed && isChosen) style = 'border-red-400 bg-red-50'
          return (
            <li key={i}>
              <button
                onClick={() => choose(i)}
                disabled={revealed}
                className={`w-full rounded-md border px-4 py-2 text-left font-mono text-sm transition ${style}`}
              >
                {option}
                {revealed && isCorrect && <span className="ml-2">✓</span>}
                {revealed && isChosen && !isCorrect && <span className="ml-2">✗</span>}
              </button>
            </li>
          )
        })}
      </ul>

      {revealed && question.explanation && (
        <p className="mt-4 rounded-md bg-slate-50 p-3 text-sm text-slate-700">
          {question.explanation}
        </p>
      )}

      {revealed && (
        <div className="mt-5 flex justify-end">
          <button
            onClick={next}
            className="rounded-md bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600"
          >
            {isLast ? 'See results' : 'Next question'}
          </button>
        </div>
      )}
    </div>
  )
}
