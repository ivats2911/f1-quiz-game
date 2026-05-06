import { useState, useEffect } from 'react';

interface LightsOutProps {
  onFinish: () => void;
}

export const LightsOut = ({ onFinish }: LightsOutProps) => {
  const [lightsOn, setLightsOn] = useState(0);

  useEffect(() => {
    if (lightsOn < 5) {
      const timer = setTimeout(() => setLightsOn(l => l + 1), 800);
      return () => clearTimeout(timer);
    } else {
      const timer = setTimeout(() => onFinish(), 1500);
      return () => clearTimeout(timer);
    }
  }, [lightsOn, onFinish]);

  return (
    <div className="f1-container" style={{ textAlign: 'center' }}>
      <h2 style={{ marginBottom: '2rem', letterSpacing: '4px' }}>WAIT FOR IT...</h2>
      <div className="lights-row">
        {[0, 1, 2, 3, 4].map(i => (
          <div key={i} className="light-pod">
            <div className={`light-bulb ${lightsOn > i && lightsOn < 5 ? 'on' : ''}`} />
          </div>
        ))}
      </div>
      <p style={{ marginTop: '2rem', color: 'var(--f1-red)', fontWeight: 'bold' }}>
        {lightsOn === 5 ? 'AND IT\'S LIGHTS OUT AND AWAY WE GO!' : ''}
      </p>
    </div>
  );
};
