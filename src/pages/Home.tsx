import { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import type { Era } from '../context/GameContext';
import heroImage from '../assets/hero.png';

export const Home = () => {
  const { startGame, createLobby, joinLobby, playerName, updatePlayerName, roomId } = useGame();
  const [showMultiplayer, setShowMultiplayer] = useState(false);
  const [roomInput, setRoomInput] = useState('');
  const [error, setError] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const roomFromUrl = urlParams.get('room');
    const savedRoomId = sessionStorage.getItem('f1_room_id');
    
    if (roomFromUrl) {
      setRoomInput(roomFromUrl.toUpperCase());
      setShowMultiplayer(true);
    } else if (savedRoomId) {
      setShowMultiplayer(true);
    }
  }, []);

  const handleCreateLobby = async () => {
    if (roomId) return; // Don't recreate if we have one
    if (!playerName.trim()) return setError('PLEASE ENTER YOUR DRIVER NAME TO START');
    setIsCreating(true);
    setError('');
    try {
      const id = await createLobby(playerName);
      const newUrl = `${window.location.origin}${window.location.pathname}?room=${id}`;
      window.history.pushState({ path: newUrl }, '', newUrl);
    } catch (err: any) {
      setError(err.message || 'FAILED TO CREATE LOBBY');
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinLobby = async () => {
    if (!playerName.trim()) return setError('PLEASE ENTER YOUR DRIVER NAME TO JOIN');
    if (!roomInput.trim()) return setError('ENTER A VALID ROOM CODE');
    setError('');
    try {
      await joinLobby(roomInput.toUpperCase(), playerName);
      const newUrl = `${window.location.origin}${window.location.pathname}?room=${roomInput.toUpperCase()}`;
      window.history.pushState({ path: newUrl }, '', newUrl);
    } catch (err: any) {
      setError(err.message || 'ROOM NOT FOUND');
    }
  };

  const eras: { label: string, value: Era, desc: string, subtitle: string }[] = [
    { label: 'V10 ERA', value: 'V10', desc: '1995 - 2005', subtitle: 'The Glory Days' },
    { label: 'V8 ERA', value: 'V8', desc: '2006 - 2013', subtitle: 'High Revs' },
    { label: 'HYBRID ERA', value: 'Hybrid', desc: '2014 - 2021', subtitle: 'Electrical Power' },
    { label: 'GROUND EFFECT', value: 'Modern', desc: '2022 - 2025', subtitle: 'Close Racing' },
    { label: 'ALL-TIME', value: 'All', desc: '1950 - 2025', subtitle: 'Ultimate History' },
  ];

  return (
    <div className="home-page">
      <section className="hero-section" style={{ backgroundImage: `linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.7)), url(${heroImage})` }}>
        <div className="hero-content">
          <h1 className="f1-title">F1 STATS QUIZ</h1>
          <p className="hero-tagline">MASTER THE DATA. CONQUER THE GRID.</p>
          
            <div className="registration-container">
              <div className="registration-box">
                <p className="reg-label">DRIVER REGISTRATION</p>
                <input 
                  type="text" 
                  placeholder="ENTER NAME"
                  className="f1-name-input"
                  value={playerName}
                  onChange={(e) => updatePlayerName(e.target.value.toUpperCase())}
                />
                {error && <p className="error-text" style={{ color: 'yellow', fontWeight: 'bold' }}>{error}</p>}
              </div>

            <div className={`multiplayer-box ${showMultiplayer ? 'active' : ''}`}>
              {!showMultiplayer ? (
                <button 
                  className="f1-button multiplayer-toggle" 
                  onClick={() => {
                    setShowMultiplayer(true);
                    if (playerName.trim()) handleCreateLobby();
                  }}
                >
                  PLAY WITH FRIENDS 🏁
                </button>
              ) : (
                <div className="lobby-interface">
                  {!roomId ? (
                    <button className="f1-button create-btn" onClick={handleCreateLobby} disabled={isCreating}>
                      {isCreating ? 'CREATING LOBBY...' : 'CREATE PRIVATE LOBBY'}
                    </button>
                  ) : (
                    <div className="active-lobby-info" style={{ marginBottom: '1rem', padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', border: '1px solid var(--f1-red)' }}>
                      <p style={{ fontSize: '0.8rem', margin: '0 0 0.5rem 0', opacity: 0.7 }}>YOUR LOBBY IS READY:</p>
                      <h2 style={{ color: 'var(--f1-red)', margin: '0 0 0.5rem 0' }}>{roomId}</h2>
                      <button 
                        className="f1-button" 
                        style={{ width: '100%', fontSize: '0.8rem', padding: '0.5rem' }}
                        onClick={() => {
                          const joinUrl = `${window.location.origin}${window.location.pathname}?room=${roomId}`;
                          navigator.clipboard.writeText(joinUrl);
                          alert('INVITE LINK COPIED!');
                        }}
                      >
                        COPY INVITE LINK
                      </button>
                      <button 
                        className="f1-button" 
                        style={{ width: '100%', marginTop: '0.5rem', background: 'var(--f1-red)' }}
                        onClick={() => handleJoinLobby()}
                      >
                        ENTER PADDOCK
                      </button>
                    </div>
                  )}
                  <div className="join-interface">
                    <input 
                      type="text" 
                      placeholder="ROOM CODE" 
                      value={roomInput}
                      onChange={(e) => setRoomInput(e.target.value.toUpperCase())}
                    />
                    <button className="join-btn" onClick={handleJoinLobby}>JOIN</button>
                  </div>
                  <button className="cancel-link" onClick={() => setShowMultiplayer(false)}>CANCEL</button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="f1-container">
        <div className="content-wrapper">
          <div className="section-header">
            <h2 className="section-title">CHOOSE YOUR ERA (SOLO)</h2>
            <div className="section-line"></div>
          </div>
          
          <div className="era-selection-grid">
            {eras.map(era => (
              <button key={era.value} className="era-card" onClick={() => startGame(era.value)}>
                <div className="era-card-content">
                  <span className="era-years">{era.desc}</span>
                  <h3 className="era-name">{era.label}</h3>
                  <p className="era-subtitle">{era.subtitle}</p>
                </div>
                <div className="era-card-arrow">→</div>
              </button>
            ))}
          </div>

          <div className="how-to-play">
            <div className="info-card">
              <h3>DYNAMIC ENGINE HEAT</h3>
              <p>The smarter you play, the harder it gets. Correct answers increase "Heat", making questions more difficult and time more scarce.</p>
            </div>
            <div className="info-card">
              <h3>MULTIPLAYER RULES</h3>
              <p>In group play, everyone gets the same questions. If scores tie, the driver with the fastest total time takes the podium.</p>
            </div>
          </div>
        </div>
      </div>

      <footer className="f1-footer">
        <p>POWERED BY <a href="https://jolpica.org/" target="_blank" rel="noreferrer">JOLPICA F1 API</a></p>
      </footer>
    </div>
  );
};
