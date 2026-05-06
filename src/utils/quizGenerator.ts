export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

type GeneratorFunc = (races: any[], drivers: any[], circuits: any[], heat: number) => QuizQuestion;

/**
 * Picks 3 wrong options. 
 * If heat is high, it prioritizes "confusing" choices from a primary pool.
 */
const getSmartOptions = (
  correct: string, 
  confusingPool: any[], 
  fallbackPool: any[], 
  heat: number, 
  exclude: string[] = []
): string[] => {
  const result: string[] = [correct];
  const allExclude = [...exclude, correct];

  // Higher heat means we take MORE from the confusing pool (teammates, same-race finishers)
  // than from the generic fallback pool (random drivers from history).
  const smartPool = confusingPool.filter(item => !allExclude.includes(item));
  const fallback = fallbackPool
    .map(d => typeof d === 'string' ? d : `${d.givenName} ${d.familyName}`)
    .filter(item => !allExclude.includes(item));

  while (result.length < 4) {
    let pick;
    if (smartPool.length > 0 && Math.random() < (0.4 * heat)) {
      const idx = Math.floor(Math.random() * smartPool.length);
      pick = smartPool.splice(idx, 1)[0];
    } else if (fallback.length > 0) {
      const idx = Math.floor(Math.random() * fallback.length);
      pick = fallback.splice(idx, 1)[0];
    } else if (smartPool.length > 0) {
      const idx = Math.floor(Math.random() * smartPool.length);
      pick = smartPool.splice(idx, 1)[0];
    } else {
      pick = "Unknown Driver"; // Last resort
    }

    if (pick && !result.includes(pick)) {
      result.push(pick);
    }
  }

  return result.sort(() => Math.random() - 0.5);
};

const typeGenerators: GeneratorFunc[] = [
  // Type 0: GP Winner
  (races, drivers, _circuits, heat) => {
    const randomRace = races[Math.floor(Math.random() * races.length)];
    const winner = randomRace.Results[0].Driver;
    const winnerName = `${winner.givenName} ${winner.familyName}`;
    
    // Smart options: Top finishers in the SAME race (very confusing!)
    const raceFinishers = randomRace.Results.slice(1, 10).map((r: any) => `${r.Driver.givenName} ${r.Driver.familyName}`);
    const options = getSmartOptions(winnerName, raceFinishers, drivers, heat);

    return {
      id: Math.random().toString(36).substring(2, 11),
      question: `Who won the ${randomRace.season} ${randomRace.raceName}?`,
      options,
      correctAnswer: winnerName,
      category: 'Race Results',
      difficulty: 'medium',
    };
  },

  // Type 1: Driver Team
  (races, _drivers, _circuits, heat) => {
    const randomRace = races[Math.floor(Math.random() * races.length)];
    const randomResult = randomRace.Results[Math.floor(Math.random() * randomRace.Results.length)];
    const driver = randomResult.Driver;
    const team = randomResult.Constructor.name;
    
    const teamPool = ['Ferrari', 'McLaren', 'Mercedes', 'Red Bull', 'Williams', 'Renault', 'Alpine', 'Aston Martin', 'Lotus', 'Sauber', 'Jordan', 'Benetton', 'Minardi', 'Brawn GP'];
    const options = getSmartOptions(team, teamPool, [], heat);

    return {
      id: Math.random().toString(36).substring(2, 11),
      question: `In ${randomRace.season}, which team did ${driver.givenName} ${driver.familyName} drive for?`,
      options,
      correctAnswer: team,
      category: 'Driver-Team History',
      difficulty: 'easy',
    };
  },

  // Type 2: Teammate Challenge
  (races, drivers, _circuits, heat) => {
    const randomRace = races[Math.floor(Math.random() * races.length)];
    const team = randomRace.Results[0].Constructor.name;
    const teammates = randomRace.Results
      .filter((r: any) => r.Constructor.name === team)
      .map((r: any) => `${r.Driver.givenName} ${r.Driver.familyName}`);
    
    if (teammates.length < 2) return typeGenerators[0](races, drivers, [], heat);

    const driverA = teammates[0];
    const driverB = teammates[1];

    // Smart options: Other drivers from the SAME race
    const racePool = randomRace.Results.map((r: any) => `${r.Driver.givenName} ${r.Driver.familyName}`);
    const options = getSmartOptions(driverB, racePool, drivers, heat, [driverA]);

    return {
      id: Math.random().toString(36).substring(2, 11),
      question: `In ${randomRace.season}, who was ${driverA}'s teammate at ${team}?`,
      options,
      correctAnswer: driverB,
      category: 'Teammates',
      difficulty: 'medium',
    };
  },

  // Type 3: Circuit Location
  (_races, _drivers, circuits, heat) => {
    const randomCircuit = circuits[Math.floor(Math.random() * circuits.length)];
    const country = randomCircuit.Location.country;
    const countryPool = ['United Kingdom', 'Italy', 'Japan', 'Brazil', 'USA', 'Germany', 'France', 'Australia', 'Spain', 'Monaco', 'Austria', 'Belgium', 'Canada', 'Mexico', 'Singapore', 'UAE'];
    const options = getSmartOptions(country, countryPool, [], heat);

    return {
      id: Math.random().toString(36).substring(2, 11),
      question: `In which country is the "${randomCircuit.circuitName}" located?`,
      options,
      correctAnswer: country,
      category: 'Circuit Knowledge',
      difficulty: 'easy',
    };
  },

  // Type 4: Specific Race Finishers (Higher Heat)
  (races, drivers, _circuits, heat) => {
    const randomRace = races[Math.floor(Math.random() * races.length)];
    const pos = Math.floor(Math.random() * 3) + 3; // P3, P4, or P5
    const result = randomRace.Results[pos - 1];
    if (!result) return typeGenerators[0](races, drivers, [], heat);
    
    const driverName = `${result.Driver.givenName} ${result.Driver.familyName}`;
    const racePool = randomRace.Results.map((r: any) => `${r.Driver.givenName} ${r.Driver.familyName}`);
    const options = getSmartOptions(driverName, racePool, drivers, heat);

    return {
      id: Math.random().toString(36).substring(2, 11),
      question: `Who finished P${pos} in the ${randomRace.season} ${randomRace.raceName}?`,
      options,
      correctAnswer: driverName,
      category: 'Race Standings',
      difficulty: 'hard',
    };
  }
];

/**
 * Generates a random question based on historical data.
 * @param heat - Current difficulty level (1.0 to 3.0+)
 */
export const generateRandomQuestion = (
  races: any[], 
  drivers: any[], 
  circuits: any[], 
  heat: number = 1.0
): QuizQuestion => {
  // Determine question type based on heat
  // 0-2: Easy (Winner, Team), 3-4: Medium (Teammate, Circuit), 5-6: Hard (P4/P5 finishers)
  let maxType = 3;
  if (heat > 1.5) maxType = 5;
  if (heat > 2.5) maxType = 7;

  const type = Math.floor(Math.random() * Math.min(typeGenerators.length, maxType));
  return typeGenerators[type](races, drivers, circuits, heat);
};
