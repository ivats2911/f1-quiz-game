import { GameProvider, useGame } from './context/GameContext';
import { Home } from './pages/Home';
import { Lobby } from './pages/Lobby';
import { LightsOut } from './components/LightsOut';
import { QuizScreen } from './components/QuizScreen';
import { MultiplayerLeaderboard } from './components/MultiplayerLeaderboard';
import './styles/theme.css';

const GameContainer = () => {
  const { phase, setPhase } = useGame();

  switch (phase) {
    case 'menu':
      return <Home />;
    case 'lobby':
      return <Lobby />;
    case 'lights':
      return <LightsOut onFinish={() => setPhase('playing')} />;
    case 'playing':
      return <QuizScreen />;
    case 'over':
      return <MultiplayerLeaderboard />;
    default:
      return <Home />;
  }
};

function App() {
  return (
    <GameProvider>
      <GameContainer />
    </GameProvider>
  );
}

export default App;
