import { useGame } from '../context/GameContext';

export const MultiplayerLeaderboard = () => {
  const { players, resetGame, isMultiplayer } = useGame();

  const sortedPlayers = [...players].sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    return a.totalTime - b.totalTime;
  });

  const getTrophy = (index: number) => {
    if (index === 0) return '🏆';
    if (index === 1) return '🥈';
    if (index === 2) return '🥉';
    return `${index + 1}.`;
  };

  return (
    <div className="f1-container">
      <div className="f1-card">
        <h1 style={{ color: 'var(--f1-red)', textAlign: 'center', fontSize: '3rem', marginBottom: '2rem' }}>
          {isMultiplayer ? 'PODIUM' : 'CHECKERED FLAG'}
        </h1>

        <div className="leaderboard" style={{ margin: '2rem 0' }}>
          {sortedPlayers.map((player, idx) => (
            <div 
              key={player.id} 
              style={{ 
                display: 'grid', 
                gridTemplateColumns: '50px 1fr 100px 120px',
                padding: '1.2rem',
                background: idx === 0 ? 'rgba(225, 6, 0, 0.1)' : idx % 2 === 0 ? 'rgba(255,255,255,0.03)' : 'transparent',
                borderLeft: idx === 0 ? '5px solid var(--f1-red)' : '5px solid transparent',
                alignItems: 'center',
                marginBottom: '5px',
                borderRadius: '4px'
              }}
            >
              <span style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{getTrophy(idx)}</span>
              <span style={{ fontWeight: '800', fontSize: '1.2rem' }}>
                {player.name.toUpperCase()}
                {isMultiplayer && player.status === 'playing' && (
                  <span style={{ fontSize: '0.6rem', color: '#666', marginLeft: '10px', verticalAlign: 'middle' }}>RACING...</span>
                )}
                {isMultiplayer && player.status === 'finished' && (
                  <span style={{ fontSize: '0.6rem', color: 'var(--f1-red)', marginLeft: '10px', verticalAlign: 'middle' }}>FINISHED</span>
                )}
              </span>
              <span style={{ color: 'var(--f1-red)', fontWeight: 'bold', textAlign: 'right' }}>{player.score} PTS</span>
              <span style={{ textAlign: 'right', opacity: 0.6, fontSize: '0.9rem' }}>{player.totalTime}s TOTAL</span>
            </div>
          ))}
        </div>

        <div style={{ textAlign: 'center', marginTop: '3rem' }}>
          <button className="f1-button" onClick={resetGame} style={{ padding: '1.5rem 3rem' }}>
            RETURN TO PADDOCK
          </button>
        </div>
      </div>
    </div>
  );
};
