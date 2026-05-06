# F1 STATS QUIZ

```
   ▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
   █  ███  ███  ███  ███  ███  ███  ███  ███  █
   ▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀

       MASTER THE DATA. CONQUER THE GRID.
```

A fast-paced Formula 1 trivia game built on real historical data from the
**Jolpica F1 API** (Ergast's successor). Pick your era, hold your line, and
race a private lobby of friends to the chequered flag.

> Five red lights. They go out. The questions begin.

---

## Lights Out

```bash
cd f1-quiz-game
npm install
cp .env.example .env   # then fill in your Firebase project values
npm run dev
```

Then open the URL Vite prints (usually `http://localhost:5173`).

> The Firebase config is read from environment variables — see
> [Configuration](#configuration) below for how to wire up your own project.

To ship a production build:

```bash
npm run build      # type-check + bundle
npm run preview    # serve the built dist/
```

---

## On-Track Features

### Five Eras to Race
| Era            | Years        | Vibe                |
| -------------- | ------------ | ------------------- |
| V10            | 1995 – 2005  | The Glory Days      |
| V8             | 2006 – 2013  | High Revs           |
| Hybrid         | 2014 – 2021  | Electrical Power    |
| Ground Effect  | 2022 – 2025  | Close Racing        |
| All-Time       | 1950 – 2025  | Ultimate History    |

### Dynamic Engine Heat
Every correct answer raises your **Engine Heat**. As heat climbs, the
question generator pulls more *confusing* wrong-answer options — teammates,
same-race finishers, drivers from the same era — instead of random history.
Wrong answers and timeouts cool the engine back down.

| Heat | Effect                                                           |
| ---- | ---------------------------------------------------------------- |
| 1.0  | Easy decoys, full 15s per lap                                    |
| 2.0  | Trap options drawn from the same race / teammate pool            |
| 2.0+ | The HUD turns red. You are now in the deep end.                  |

### Three Cars, Fifteen Seconds
You start with **3 cars** (lives) and a **15-second** timer per question.
A wrong answer or timeout retires a car. Lose all three and it's a
DNF — your run ends and the standings post.

### Multiplayer Paddock (up to 15 drivers)
- The host **creates a lobby** and shares an invite link or 6-char room code.
- Everyone in the room gets the **same 20-question pack**, generated server-side
  via Firebase Realtime Database.
- Live leaderboard updates as each driver answers.
- **Tiebreaker:** equal scores are split by lowest total time — fastest lap wins.

---

## Tech Stack

- **React 19** + **TypeScript** + **Vite 8** — the cockpit
- **Firebase Realtime Database** — multiplayer lobbies, live scores, presence
- **Jolpica F1 API** (`api.jolpi.ca/ergast/f1`) — race results, drivers, circuits
- **Axios** — API calls
- **react-router-dom** — routing scaffolding

---

## Project Layout

```
f1-quiz-game/
├── src/
│   ├── api/
│   │   ├── firebase.ts          # Firebase RTDB client
│   │   └── jolpica.ts           # Jolpica/Ergast wrappers
│   ├── components/
│   │   ├── LightsOut.tsx        # 5-red-lights start sequence
│   │   ├── QuizScreen.tsx       # Question UI + heat/timer HUD
│   │   ├── GameOverScreen.tsx   # Solo run summary
│   │   └── MultiplayerLeaderboard.tsx
│   ├── context/
│   │   └── GameContext.tsx      # Global game state + Firebase sync
│   ├── pages/
│   │   ├── Home.tsx             # Era picker + lobby entry
│   │   └── Lobby.tsx            # Pre-race waiting room
│   ├── utils/
│   │   └── quizGenerator.ts     # Heat-aware question + decoy generator
│   ├── styles/theme.css
│   └── App.tsx                  # Phase-based screen switcher
├── public/                      # favicons + iconography
├── firebase.json                # Hosting + RTDB config
└── database.rules.json          # RTDB security rules
```

The game is a finite state machine driven by `phase`:
`menu → lobby → lights → playing → over`.

---

## Configuration

### Firebase
This project uses Firebase Realtime Database for multiplayer. To run your own
instance:

1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com).
2. Enable **Realtime Database** (test mode is fine for local dev).
3. Copy `.env.example` to `.env` and fill in the values from your Firebase
   project's web app config:
   ```bash
   cp .env.example .env
   ```
   All keys are prefixed `VITE_FIREBASE_*` so Vite exposes them to the client.
4. Deploy rules from `database.rules.json`:
   ```bash
   firebase deploy --only database
   ```

`.env` is gitignored — never commit it. The Jolpica API requires no key.

---

## Scripts

| Command          | What it does                                |
| ---------------- | ------------------------------------------- |
| `npm run dev`    | Start the Vite dev server with HMR          |
| `npm run build`  | Type-check (`tsc -b`) and bundle for prod   |
| `npm run preview`| Preview the production build                |
| `npm run lint`   | ESLint over the project                     |

---

## Credits

- Data: [**Jolpica F1 API**](https://jolpica.org/) — keeping the Ergast schema alive.
- Inspiration: every late-night Wikipedia rabbit hole that started with
  "wait, who *did* finish 4th at Imola in 2003?"

---

## Licence

MIT. Race responsibly.
