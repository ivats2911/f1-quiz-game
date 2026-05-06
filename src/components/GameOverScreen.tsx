import { useGame } from '../context/GameContext';

export const GameOverScreen = () => {
  const { score, resetGame } = useGame();

  return (
    <div className="f1-container">
      <div className="f1-card" style={{ textAlign: 'center' }}>
        <h1 style={{ color: 'var(--f1-red)', fontSize: '3rem' }}>CHECKERED FLAG</h1>
        <p style={{ fontSize: '1.5rem', margin: '2rem 0' }}>FINAL SCORE: {score}</p>
        <button className="f1-button" onClick={resetGame}>
          RETURN TO PADDOCK
        </button>
      </div>
    </div>
  );
};
