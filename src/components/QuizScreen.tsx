import { useGame } from '../context/GameContext';

export const QuizScreen = () => {
  const { currentQuestion, score, lives, questionNumber, timeLeft, heat, answerQuestion, isLoading } = useGame();

  if (isLoading) {
    return (
      <div className="f1-container">
        <div className="loading-spinner" />
        <p style={{ textAlign: 'center', marginTop: '1rem', fontWeight: 'bold' }}>ADJUSTING ENGINE MAPPING...</p>
        <p style={{ textAlign: 'center', fontSize: '0.8rem', opacity: 0.7 }}>CALCULATING DIFFICULTY (HEAT: {heat.toFixed(1)}x)</p>
      </div>
    );
  }

  if (!currentQuestion) return null;

  return (
    <div className="f1-container">
      <div className="header">
        <div className="lives-badge">CARS: {Array(lives).fill('🏎️').join(' ')}</div>
        <div style={{ textAlign: 'right' }}>
          <div className="score-badge">SCORE: {score}</div>
          <div style={{ fontSize: '0.8rem', marginTop: '5px', color: heat > 2.0 ? 'var(--f1-red)' : '#aaa', fontWeight: 'bold' }}>
            ENGINE HEAT: {heat.toFixed(1)}x {heat > 2.0 ? '🔥' : ''}
          </div>
        </div>
      </div>

      <div className="timer-container">
        <div className="timer-bar" style={{ width: `${(timeLeft / 15) * 100}%` }} />
      </div>

      <div className="f1-card">
        <p style={{ color: 'var(--f1-red)', fontWeight: 'bold' }}>LAP {questionNumber}: {currentQuestion.category.toUpperCase()}</p>
        <h2 className="question-text">{currentQuestion.question}</h2>
        <div className="option-grid">
          {currentQuestion.options.map((option, idx) => (
            <button
              key={idx}
              className="f1-button"
              onClick={() => answerQuestion(option)}
            >
              {option}
            </button>
          ))}
        </div>
        <p style={{ marginTop: '1.5rem', fontSize: '0.7rem', opacity: 0.5, textAlign: 'center' }}>
          HARDER QUESTIONS AND CONFUSING OPTIONS ARE ENABLED AT HIGHER HEAT LEVELS.
        </p>
      </div>
    </div>
  );
};
