import { useState } from 'react';
import { useGame } from '../context/GameContext';
import type { Era } from '../context/GameContext';

export const Lobby = () => {
  const { 
    roomId, 
    players, 
    playerId, 
    selectedEra, 
    startGame, 
    startMultiplayerGame
  } = useGame();
  
  const [copied, setCopied] = useState(false);

  const eras: { label: string, value: Era, desc: string }[] = [
    { label: 'V10 ERA', value: 'V10', desc: '1995 - 2005' },
    { label: 'V8 ERA', value: 'V8', desc: '2006 - 2013' },
    { label: 'HYBRID ERA', value: 'Hybrid', desc: '2014 - 2021' },
    { label: 'GROUND EFFECT', value: 'Modern', desc: '2022 - 2025' },
    { label: 'ALL-TIME', value: 'All', desc: '1950 - 2025' },
  ];

  const isHost = players.find(p => p.id === playerId)?.isHost;
  const joinUrl = `${window.location.origin}${window.location.pathname}?room=${roomId}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(joinUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="f1-container">
      <div className="f1-card">
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ color: 'var(--f1-red)', margin: 0 }}>PADDOCK LOBBY</h1>
          <p style={{ letterSpacing: '2px', opacity: 0.7 }}>ROOM CODE: <span style={{ color: 'var(--f1-white)', fontWeight: 'bold' }}>{roomId}</span></p>
          
          <div style={{ marginTop: '1rem', display: 'flex', gap: '10px', justifyContent: 'center' }}>
            <button className="f1-button" style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }} onClick={copyToClipboard}>
              {copied ? 'COPIED!' : 'COPY INVITE LINK'}
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
          <div>
            <h3 style={{ borderBottom: '2px solid var(--f1-red)', paddingBottom: '0.5rem' }}>DRIVERS ({players.length}/15)</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '1rem' }}>
              {players.map(player => (
                <div key={player.id} style={{ 
                  padding: '10px', 
                  background: 'rgba(255,255,255,0.05)', 
                  borderLeft: `3px solid ${player.isHost ? 'var(--f1-red)' : '#666'}`,
                  display: 'flex',
                  justifyContent: 'space-between'
                }}>
                  <span>{player.name} {player.id === playerId && '(YOU)'}</span>
                  {player.isHost && <span style={{ fontSize: '0.7rem', color: 'var(--f1-red)', fontWeight: 'bold' }}>HOST</span>}
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 style={{ borderBottom: '2px solid var(--f1-red)', paddingBottom: '0.5rem' }}>RACE SETTINGS</h3>
            {isHost ? (
              <div style={{ marginTop: '1rem' }}>
                <p style={{ fontSize: '0.8rem', marginBottom: '1rem' }}>SELECT ERA:</p>
                <div style={{ display: 'grid', gap: '10px' }}>
                  {eras.map(era => (
                    <button 
                      key={era.value}
                      className={`f1-button ${selectedEra === era.value ? 'active' : ''}`}
                      style={{ 
                        background: selectedEra === era.value ? 'var(--f1-red)' : '#222',
                        textAlign: 'left',
                        clipPath: 'none',
                        padding: '0.8rem'
                      }}
                      onClick={() => startGame(era.value)}
                    >
                      {era.label}
                    </button>
                  ))}
                </div>
                <button 
                  className="f1-button" 
                  style={{ width: '100%', marginTop: '2rem', height: '60px', fontSize: '1.2rem' }}
                  onClick={startMultiplayerGame}
                  disabled={players.length < 1}
                >
                  START RACE
                </button>
              </div>
            ) : (
              <div style={{ marginTop: '1rem', textAlign: 'center', padding: '2rem', opacity: 0.5 }}>
                <p>WAITING FOR HOST TO START...</p>
                <p style={{ fontSize: '0.8rem' }}>SELECTED ERA: {selectedEra}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
