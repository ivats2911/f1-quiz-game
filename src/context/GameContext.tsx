import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { ref, onValue, set, update, onDisconnect, get } from 'firebase/database';
import { db } from '../api/firebase';
import type { QuizQuestion } from '../utils/quizGenerator';
import { generateRandomQuestion } from '../utils/quizGenerator';
import { getSeasonResults, getDrivers, getCircuits } from '../api/jolpica';

export type Era = 'V10' | 'V8' | 'Hybrid' | 'Modern' | 'All';

interface EraConfig {
  start: number;
  end: number;
}

const ERA_MAP: Record<Era, EraConfig> = {
  'V10': { start: 1995, end: 2005 },
  'V8': { start: 2006, end: 2013 },
  'Hybrid': { start: 2014, end: 2021 },
  'Modern': { start: 2022, end: 2025 },
  'All': { start: 1950, end: 2025 },
};

export interface Player {
  id: string;
  name: string;
  score: number;
  totalTime: number;
  isHost: boolean;
  status: 'waiting' | 'ready' | 'playing' | 'finished';
}

interface GameState {
  score: number;
  totalTime: number;
  currentQuestion: QuizQuestion | null;
  questionNumber: number;
  isGameOver: boolean;
  isLoading: boolean;
  lives: number;
  timeLeft: number;
  phase: 'menu' | 'lobby' | 'lights' | 'playing' | 'over';
  selectedEra: Era;
  heat: number;
  // Multiplayer fields
  isMultiplayer: boolean;
  roomId: string | null;
  players: Player[];
  playerId: string | null;
  playerName: string;
}

interface GameContextType extends GameState {
  answerQuestion: (answer: string) => boolean;
  startGame: (era: Era) => void;
  resetGame: () => void;
  setPhase: (phase: GameState['phase']) => void;
  createLobby: (playerName: string) => Promise<string>;
  joinLobby: (roomId: string, playerName: string) => Promise<void>;
  startMultiplayerGame: () => void;
  updatePlayerName: (name: string) => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [gameState, setGameState] = useState<GameState>({
    score: 0,
    totalTime: 0,
    currentQuestion: null,
    questionNumber: 0,
    isGameOver: false,
    isLoading: false,
    lives: 3,
    timeLeft: 15,
    phase: 'menu',
    selectedEra: 'All',
    heat: 1.0,
    isMultiplayer: false,
    roomId: sessionStorage.getItem('f1_room_id'),
    players: [],
    playerId: sessionStorage.getItem('f1_player_id'),
    playerName: localStorage.getItem('f1_player_name') || '',
  });

  const [pool, setPool] = useState<{ races: any[]; drivers: any[]; circuits: any[] }>({ 
    races: [], drivers: [], circuits: [] 
  });

  const timerRef = useRef<number | null>(null);
  const questionsRef = useRef<QuizQuestion[]>([]);

  // Auto-rejoin on refresh
  useEffect(() => {
    const savedRoomId = sessionStorage.getItem('f1_room_id');
    const savedPlayerId = sessionStorage.getItem('f1_player_id');
    const urlParams = new URLSearchParams(window.location.search);
    const roomFromUrl = urlParams.get('room');

    if (roomFromUrl && savedRoomId === roomFromUrl && savedPlayerId) {
      setGameState(s => ({
        ...s,
        isMultiplayer: true,
        roomId: savedRoomId,
        playerId: savedPlayerId,
        phase: 'lobby'
      }));
    }
  }, []);

  // Timer effect
  useEffect(() => {
    if (gameState.phase === 'playing' && gameState.timeLeft > 0 && !gameState.isLoading) {
      timerRef.current = window.setInterval(() => {
        setGameState(prev => ({ 
          ...prev, 
          timeLeft: prev.timeLeft - 1,
          totalTime: prev.totalTime + 1 
        }));
      }, 1000);
    } else if (gameState.timeLeft === 0 && gameState.phase === 'playing') {
      handleTimeout();
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameState.phase, gameState.timeLeft, gameState.isLoading]);

  // Firebase Lobby Sync
  useEffect(() => {
    if (gameState.isMultiplayer && gameState.roomId) {
      const roomRef = ref(db, `rooms/${gameState.roomId}`);
      const unsubscribe = onValue(roomRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const playersList: Player[] = Object.entries(data.players || {}).map(([id, p]: [string, any]) => ({
            id,
            ...p
          }));
          
          setGameState(prev => {
            const newState = { ...prev, players: playersList, selectedEra: data.era };
            
            // Sync phase if status changes
            if (data.status === 'racing' && prev.phase === 'lobby') {
              return { ...newState, phase: 'lights' };
            }
            return newState;
          });

          if (data.questions) {
            questionsRef.current = data.questions;
          }
        }
      });

      return () => unsubscribe();
    }
  }, [gameState.isMultiplayer, gameState.roomId]);

  const updatePlayerName = (name: string) => {
    localStorage.setItem('f1_player_name', name);
    setGameState(s => ({ ...s, playerName: name }));
  };

  const createLobby = async (playerName: string) => {
    const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    const playerId = Math.random().toString(36).substring(2, 9);
    
    try {
      const roomRef = ref(db, `rooms/${roomId}`);
      console.log("Setting room data in Firebase for room:", roomId);

      // Create a promise that rejects after 5 seconds
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Firebase connection timed out. Check your internet or Firebase console.")), 5000)
      );

      // Race the set operation against the timeout
      await Promise.race([
        set(roomRef, {
          status: 'waiting',
          era: 'All',
          createdAt: Date.now(),
          host: playerId,
          players: {
            [playerId]: {
              name: playerName,
              score: 0,
              totalTime: 0,
              isHost: true,
              status: 'ready'
            }
          }
        }),
        timeoutPromise
      ]);

      console.log("Firebase set successful for room:", roomId);
      onDisconnect(ref(db, `rooms/${roomId}/players/${playerId}`)).remove();

      sessionStorage.setItem('f1_room_id', roomId);
      sessionStorage.setItem('f1_player_id', playerId);

      setGameState(s => ({
        ...s,
        isMultiplayer: true,
        roomId,
        playerId,
        playerName,
        phase: 'lobby'
      }));

      return roomId;
    } catch (err: any) {
      console.error("Firebase error in createLobby:", err);
      throw err;
    }
  };

  const joinLobby = async (roomId: string, playerName: string) => {
    const roomRef = ref(db, `rooms/${roomId}`);
    const snapshot = await get(roomRef);
    
    if (!snapshot.exists()) throw new Error('Room not found');
    const data = snapshot.val();
    
    if (Object.keys(data.players || {}).length >= 15) throw new Error('Room is full');
    if (data.status !== 'waiting') throw new Error('Game already started');

    const playerId = Math.random().toString(36).substring(2, 9);
    await update(ref(db, `rooms/${roomId}/players/${playerId}`), {
      name: playerName,
      score: 0,
      totalTime: 0,
      isHost: false,
      status: 'ready'
    });

    onDisconnect(ref(db, `rooms/${roomId}/players/${playerId}`)).remove();

    sessionStorage.setItem('f1_room_id', roomId);
    sessionStorage.setItem('f1_player_id', playerId);

    setGameState(s => ({
      ...s,
      isMultiplayer: true,
      roomId,
      playerId,
      playerName,
      phase: 'lobby'
    }));
  };

  const startMultiplayerGame = async () => {
    if (!gameState.roomId || !gameState.playerId) return;
    
    try {
      const roomRef = ref(db, `rooms/${gameState.roomId}`);
      const snapshot = await get(roomRef);
      const data = snapshot.val();
      
      if (data.host !== gameState.playerId) return;

      // Update status to 'loading' first to show everyone something is happening
      await update(roomRef, { status: 'loading' });

      // Load data and generate questions
      const config = ERA_MAP[gameState.selectedEra];
      const year = Math.floor(Math.random() * (config.end - config.start + 1)) + config.start;
      
      const [races, drivers, circuits] = await Promise.all([
        getSeasonResults(year),
        getDrivers(),
        getCircuits()
      ]);
      
      // Generate 20 questions for everyone to share
      const sharedQuestions = Array.from({ length: 20 }).map((_, i) => 
        generateRandomQuestion(races, drivers, circuits, 1.0 + (i * 0.1))
      );

      await update(roomRef, {
        status: 'racing',
        questions: sharedQuestions,
        poolData: { year }
      });
    } catch (err) {
      console.error("Failed to start multiplayer game", err);
      if (gameState.roomId) {
        await update(ref(db, `rooms/${gameState.roomId}`), { status: 'waiting' });
      }
    }
  };

  const handleTimeout = () => {
    setGameState(prev => {
      const nextLives = prev.lives - 1;
      const nextHeat = Math.max(1.0, prev.heat - 0.3);
      
      let nextQuestion;
      if (prev.isMultiplayer) {
        nextQuestion = questionsRef.current[prev.questionNumber] || null;
      } else {
        nextQuestion = generateRandomQuestion(pool.races, pool.drivers, pool.circuits, nextHeat);
      }

      const newState = {
        ...prev,
        lives: nextLives,
        timeLeft: 15,
        heat: nextHeat,
        currentQuestion: nextQuestion,
        questionNumber: prev.questionNumber + 1,
        isGameOver: nextLives <= 0,
        phase: (nextLives <= 0) ? 'over' : 'playing'
      };

      if (prev.isMultiplayer && prev.roomId && prev.playerId) {
        update(ref(db, `rooms/${prev.roomId}/players/${prev.playerId}`), {
          score: prev.score,
          totalTime: prev.totalTime,
          status: nextLives <= 0 ? 'finished' : 'playing'
        });
      }

      return newState as GameState;
    });
  };

  const loadData = async (era: Era) => {
    try {
      setGameState(s => ({ ...s, isLoading: true, selectedEra: era }));
      
      let firstQ;
      if (gameState.isMultiplayer) {
        // Wait up to 5 seconds for questions to sync if they are missing
        let retries = 0;
        while (!questionsRef.current[0] && retries < 10) {
          await new Promise(resolve => setTimeout(resolve, 500));
          retries++;
        }
        firstQ = questionsRef.current[0];
        if (!firstQ) throw new Error("Sync failed: Questions not found");
      } else {
        const config = ERA_MAP[era];
        const year = Math.floor(Math.random() * (config.end - config.start + 1)) + config.start;
        const [races, drivers, circuits] = await Promise.all([
          getSeasonResults(year),
          getDrivers(),
          getCircuits()
        ]);
        setPool({ races, drivers, circuits });
        firstQ = generateRandomQuestion(races, drivers, circuits, 1.0);
      }
      
      setGameState(s => ({
        ...s,
        currentQuestion: firstQ,
        questionNumber: 1,
        isLoading: false,
        score: 0,
        totalTime: 0,
        lives: 3,
        timeLeft: 15,
        heat: 1.0,
        isGameOver: false,
        phase: 'playing'
      }));
    } catch (error) {
      console.error("Failed to load F1 data", error);
      setGameState(s => ({ ...s, isLoading: false, phase: 'menu' }));
    }
  };

  const startGame = (era: Era) => {
    if (gameState.isMultiplayer && gameState.roomId) {
      update(ref(db, `rooms/${gameState.roomId}`), { era });
    } else {
      setGameState(s => ({ ...s, phase: 'lights', selectedEra: era, isMultiplayer: false }));
    }
  };

  const setPhase = (phase: GameState['phase']) => {
    if (phase === 'playing' && gameState.phase === 'lights') {
      loadData(gameState.selectedEra);
    } else {
      setGameState(s => ({ ...s, phase }));
    }
  };

  const resetGame = () => {
    sessionStorage.removeItem('f1_room_id');
    sessionStorage.removeItem('f1_player_id');
    
    setGameState(s => ({ 
      ...s, 
      phase: 'menu', 
      isGameOver: false, 
      isMultiplayer: false, 
      roomId: null,
      playerId: null,
      score: 0,
      totalTime: 0
    }));
  };

  const answerQuestion = (answer: string) => {
    if (!gameState.currentQuestion) return false;

    const isCorrect = answer === gameState.currentQuestion.correctAnswer;
    const timeTaken = 15 - gameState.timeLeft;
    
    setGameState(prev => {
      const nextHeat = isCorrect ? prev.heat + 0.2 : Math.max(1.0, prev.heat - 0.4);
      const newScore = isCorrect ? prev.score + Math.floor((100 + prev.timeLeft * 10) * prev.heat) : prev.score;
      const newLives = isCorrect ? prev.lives : prev.lives - 1;
      const nextQuestionNumber = prev.questionNumber + 1;
      
      let nextQuestion;
      if (prev.isMultiplayer) {
        nextQuestion = questionsRef.current[nextQuestionNumber - 1] || null;
      } else {
        nextQuestion = generateRandomQuestion(pool.races, pool.drivers, pool.circuits, nextHeat);
      }

      const finished = newLives <= 0 || (prev.isMultiplayer && nextQuestionNumber > questionsRef.current.length);

      if (prev.isMultiplayer && prev.roomId && prev.playerId) {
        update(ref(db, `rooms/${prev.roomId}/players/${prev.playerId}`), {
          score: newScore,
          totalTime: prev.totalTime + timeTaken,
          status: finished ? 'finished' : 'playing'
        });
      }

      return {
        ...prev,
        score: newScore,
        lives: newLives,
        heat: nextHeat,
        currentQuestion: nextQuestion,
        questionNumber: nextQuestionNumber,
        timeLeft: 15,
        isGameOver: finished,
        phase: finished ? 'over' : 'playing'
      };
    });

    return isCorrect;
  };

  return (
    <GameContext.Provider value={{ 
      ...gameState, 
      answerQuestion, 
      startGame, 
      resetGame, 
      setPhase, 
      createLobby, 
      joinLobby, 
      startMultiplayerGame,
      updatePlayerName
    }}>
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) throw new Error('useGame must be used within a GameProvider');
  return context;
};
