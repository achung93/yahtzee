import { useCallback, useEffect, useRef, useState } from "react";
import { Home } from "./components/Home";
import { Lobby } from "./components/Lobby";
import { Dice } from "./components/Dice";
import { Scorecard } from "./components/Scorecard";
import { gameApi, Seat } from "./client";
import { computeTotals } from "./scoring";
import { Category, RoomState } from "./types";

const SEAT_KEY = "yahtzee.seat";
const TOTAL_ROUNDS = 13;
const EMPTY_KEEP = [false, false, false, false, false];

function loadSeat(): Seat | null {
  try {
    const raw = localStorage.getItem(SEAT_KEY);
    return raw ? (JSON.parse(raw) as Seat) : null;
  } catch {
    return null;
  }
}

export function App() {
  const [seat, setSeat] = useState<Seat | null>(loadSeat);
  const [room, setRoom] = useState<RoomState | null>(null);
  const [keep, setKeep] = useState<boolean[]>(EMPTY_KEEP);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  // Latest seat for use inside async callbacks (avoids stale closures).
  const seatRef = useRef(seat);
  seatRef.current = seat;

  const persistSeat = useCallback((s: Seat | null) => {
    setSeat(s);
    if (s) localStorage.setItem(SEAT_KEY, JSON.stringify(s));
    else localStorage.removeItem(SEAT_KEY);
  }, []);

  const applyRoom = useCallback((r: RoomState | null) => {
    setRoom(r);
    if (r) setKeep(r.held);
  }, []);

  // Load the room and subscribe to live updates whenever the seat changes.
  useEffect(() => {
    if (!seat) {
      setRoom(null);
      return;
    }
    let active = true;

    gameApi
      .get(seat.gameId)
      .then((r) => {
        if (!active) return;
        if (!r) {
          // The room no longer exists (e.g. backend was reset) — drop the seat.
          persistSeat(null);
          setError("That room has ended. Start a new one.");
          return;
        }
        applyRoom(r);
      })
      .catch((e) => active && setError((e as Error).message));

    const unsubscribe = gameApi.subscribe(
      seat.gameId,
      (r) => active && applyRoom(r),
      (e) => active && setError(e.message),
    );

    return () => {
      active = false;
      unsubscribe();
    };
  }, [seat?.gameId, applyRoom, persistSeat]);

  const refresh = useCallback(async () => {
    const s = seatRef.current;
    if (!s) return;
    const r = await gameApi.get(s.gameId);
    if (r) applyRoom(r);
  }, [applyRoom]);

  // Wrap a mutation with shared busy/error handling, then refresh state.
  const run = async (fn: () => Promise<unknown>) => {
    setError(null);
    setBusy(true);
    try {
      await fn();
      await refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const handleCreate = (name: string) =>
    run(async () => persistSeat(await gameApi.createRoom(name)));

  const handleJoin = (code: string, name: string) =>
    run(async () => persistSeat(await gameApi.joinRoom(code, name)));

  const handleStart = () => {
    if (seat) run(() => gameApi.startGame(seat.gameId, seat.seatToken));
  };

  const handleRoll = () => {
    if (seat) run(() => gameApi.rollDice(seat.gameId, seat.seatToken, keep));
  };

  const handleScore = (category: Category) => {
    if (seat) {
      run(() => gameApi.scoreCategory(seat.gameId, seat.seatToken, category));
    }
  };

  const handleLeave = () => {
    persistSeat(null);
    setRoom(null);
    setKeep(EMPTY_KEEP);
    setError(null);
  };

  const toggleKeep = (i: number) => {
    if (!room || !room.hasRolled || room.rollsLeft === 0) return;
    const next = keep.slice();
    next[i] = !next[i];
    setKeep(next);
  };

  // ---- Render ----

  if (!seat || !room) {
    return (
      <Home
        onCreate={handleCreate}
        onJoin={handleJoin}
        busy={busy}
        error={error}
      />
    );
  }

  const mySeat = seat.seatIndex;

  if (room.status === "lobby") {
    return (
      <Lobby
        room={room}
        mySeat={mySeat}
        onStart={handleStart}
        onLeave={handleLeave}
        busy={busy}
        error={error}
      />
    );
  }

  const current = room.players[room.currentPlayer];
  const myTurn = room.currentPlayer === mySeat && !room.finished;

  return (
    <div className="app">
      <header className="topbar">
        <h1>Yahtzee</h1>
        <div className="round">
          Round {Math.min(room.round, TOTAL_ROUNDS)} / {TOTAL_ROUNDS} · Room{" "}
          {room.code}
        </div>
        <button className="link" onClick={handleLeave}>
          Leave
        </button>
      </header>

      {room.finished ? (
        <div className="game-over">
          <h2>
            {room.winners.length === 1
              ? `${room.winners[0]} wins!`
              : `Tie: ${room.winners.join(" & ")}`}
          </h2>
          <ol className="final-rankings">
            {room.players
              .map((p) => ({
                name: p.name,
                total: computeTotals(p).grand,
              }))
              .sort((a, b) => b.total - a.total)
              .map((p) => (
                <li key={p.name}>
                  <span>{p.name}</span>
                  <span>{p.total}</span>
                </li>
              ))}
          </ol>
          <button className="primary" onClick={handleLeave}>
            New Game
          </button>
        </div>
      ) : (
        <>
          <div className="turn-panel">
            <div className="turn-info">
              <div className="who">
                <span className="dot" />
                <strong>
                  {myTurn ? "Your turn" : `${current.name}'s turn`}
                </strong>
              </div>
              <div className="rolls">Rolls left: {room.rollsLeft}</div>
            </div>

            <Dice
              dice={room.dice}
              held={keep}
              hasRolled={room.hasRolled}
              disabled={
                busy || !myTurn || !room.hasRolled || room.rollsLeft === 0
              }
              onToggle={toggleKeep}
            />

            <div className="controls">
              <button
                className="primary"
                onClick={handleRoll}
                disabled={busy || !myTurn || room.rollsLeft === 0}
              >
                {room.hasRolled ? "Roll Selected" : "Roll Dice"}
              </button>
              <div className="hint">
                {!myTurn
                  ? `Waiting for ${current.name}…`
                  : !room.hasRolled
                    ? "Roll to start your turn."
                    : room.rollsLeft === 0
                      ? "No rolls left — pick a category."
                      : "Click dice to hold them, then roll the rest."}
              </div>
            </div>

            {room.lastScored && (
              <div className="last-scored">
                {room.players[room.lastScored.player].name} scored{" "}
                {room.lastScored.points} in {room.lastScored.category}.
              </div>
            )}

            {error && <div className="error">{error}</div>}
          </div>

          <Scorecard room={room} mySeat={mySeat} onSelect={handleScore} />
        </>
      )}
    </div>
  );
}
