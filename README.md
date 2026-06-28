# Yahtzee

Online multiplayer Yahtzee for 2–5 players. Create a room, share the 4-character
code, and play together from anywhere — game state syncs live to every player.

React + TypeScript (Vite) frontend, **AWS Amplify Gen 2** backend (AppSync +
DynamoDB + a Lambda game engine). No login: players are anonymous (name + room
code), and each seat is held by a secret token stored in the browser.

## Structure

```
yahtzee/
├── amplify.yml          AWS Amplify Hosting build spec (backend + frontend)
└── frontend/
    ├── src/             React UI (Home, Lobby, Dice, Scorecard)
    └── amplify/         Amplify Gen 2 backend
        ├── data/        AppSync schema: Game model + custom mutations
        └── functions/   gameEngine Lambda (rules engine + scoring)
```

The Lambda is the source of truth for all rules (turn order, the Yahtzee Joker
rule, +35 upper bonus, +100 bonus Yahtzees). Clients can only **read and
subscribe** to game state via API key; every change goes through a custom
mutation that the Lambda validates, then writes back so the update fans out to
all subscribers.

## Run it locally

You need an AWS account with credentials configured (`aws configure` or an AWS
profile). The Amplify **sandbox** spins up a personal cloud backend:

```bash
cd frontend
npm install

# Terminal 1 — deploy a personal cloud sandbox; writes amplify_outputs.json
npm run sandbox

# Terminal 2 — frontend dev server (http://localhost:5173)
npm run dev
```

Open two browser windows (or send the room code to a friend): create a room in
one, join with the code in the other.

> `amplify_outputs.json` (the generated backend config) is gitignored. A
> placeholder ships in the repo so the app builds before the first sandbox/
> deploy; `npm run sandbox` overwrites it with real values.

## Deploy to AWS Amplify Hosting

1. Push this repo to GitHub/GitLab/Bitbucket.
2. In the [Amplify console](https://console.aws.amazon.com/amplify) → **Create
   new app** → connect the repository and branch.
3. Amplify auto-detects [amplify.yml](amplify.yml). It deploys the backend
   (`ampx pipeline-deploy`, which generates `amplify_outputs.json`) and then
   builds the frontend (`vite build`, output in `frontend/dist`).
4. Every push to the connected branch redeploys both.

That's it — the app is served on a global CDN with the AppSync/DynamoDB backend
in your AWS account.

## How to play

1. **Create a room** (enter your name) or **Join** with a friend's 4-char code.
2. In the lobby, the host starts once 2–5 players have joined.
3. On your turn: roll up to 3 times, clicking dice to **hold** them between
   rolls; everyone watches live.
4. Pick a category in your column to score. Live previews show what each
   category would score. After 13 rounds, the highest grand total wins.
