import { useEffect, useRef, useState } from "react";
import "./ProgressBar.css";

/* ---------- Puzzle pictures (SVG, code mein hi bane hain - koi image file nahi chahiye) ----------
   Apni photo lagani ho toh image: "/puzzles/pic1.jpg" likho (file public/puzzles/ mein rakho). */
const svgUri = (inner) =>
  "data:image/svg+xml;utf8," +
  encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 300 300'>${inner}</svg>`);

const windows = (x, y, cols, rows) =>
  Array.from({ length: cols * rows }, (_, i) =>
    `<rect x='${x + (i % cols) * 22}' y='${y + Math.floor(i / cols) * 30}' width='14' height='16' fill='#fff'/>`
  ).join("");

const PUZZLES = [
  {
    name: "Sunrise Hills",
    image: svgUri(`
      <rect width='300' height='300' fill='#ffd23f'/><rect width='300' height='110' fill='#ff9ec0'/>
      <g stroke='#1d1a3a' stroke-width='6' stroke-linejoin='round'>
        <circle cx='210' cy='115' r='50' fill='#ff9f43'/>
        <ellipse cx='70' cy='60' rx='36' ry='15' fill='#fff'/><ellipse cx='125' cy='42' rx='28' ry='12' fill='#fff'/>
        <path d='M-5 215 Q70 135 150 205 T305 185 V305 H-5Z' fill='#3ddc97'/>
        <path d='M-5 262 Q90 205 180 255 T305 240 V305 H-5Z' fill='#1fa774'/>
      </g>`),
  },
  {
    name: "Rocket Launch",
    image: svgUri(`
      <rect width='300' height='300' fill='#2b2a6b'/>
      <g fill='#fff'><circle cx='40' cy='40' r='4'/><circle cx='110' cy='25' r='3'/><circle cx='190' cy='30' r='3'/><circle cx='20' cy='150' r='3'/><circle cx='260' cy='160' r='4'/><circle cx='270' cy='265' r='3'/></g>
      <g stroke='#1d1a3a' stroke-width='6' stroke-linejoin='round'>
        <circle cx='238' cy='72' r='34' fill='#b185ff'/><ellipse cx='238' cy='72' rx='54' ry='12' fill='none' stroke='#ffd23f'/>
        <circle cx='48' cy='250' r='40' fill='#ffe9a8'/><circle cx='36' cy='240' r='8' fill='#e5c76b' stroke-width='3'/>
        <path d='M125 185 L88 232 L128 218Z' fill='#ff5d5d'/><path d='M175 185 L212 232 L172 218Z' fill='#ff5d5d'/>
        <path d='M138 218 Q150 282 162 218Z' fill='#ffd23f'/>
        <path d='M150 40 C195 85 195 170 178 218 H122 C105 170 105 85 150 40Z' fill='#fff'/>
        <circle cx='150' cy='112' r='20' fill='#4d8bff'/>
      </g>`),
  },
  {
    name: "Sailboat Day",
    image: svgUri(`
      <rect width='300' height='300' fill='#bfe6ff'/><rect y='175' width='300' height='125' fill='#4d8bff'/>
      <g stroke='#1d1a3a' stroke-width='6' stroke-linejoin='round' stroke-linecap='round'>
        <circle cx='235' cy='60' r='30' fill='#ffd23f'/>
        <ellipse cx='60' cy='70' rx='34' ry='14' fill='#fff'/><ellipse cx='112' cy='98' rx='26' ry='11' fill='#fff'/>
        <path d='M-5 175 H305' fill='none'/>
        <path d='M150 75 L150 195 L95 195Z' fill='#fff'/><path d='M158 100 L158 195 L205 195Z' fill='#ffd23f'/>
        <path d='M150 205 V70' fill='none'/>
        <path d='M80 200 H220 L195 245 H105Z' fill='#ff5d5d'/>
      </g>
      <g fill='none' stroke='#fff' stroke-width='5' stroke-linecap='round'>
        <path d='M20 272 q15 -14 30 0 t30 0 t30 0'/><path d='M170 285 q15 -14 30 0 t30 0 t30 0'/>
      </g>`),
  },
  {
    name: "City Skyline",
    image: svgUri(`
      <rect width='300' height='300' fill='#d6cffa'/>
      <g stroke='#1d1a3a' stroke-width='6' stroke-linejoin='round'>
        <circle cx='235' cy='55' r='28' fill='#fff'/>
        <rect x='20' y='130' width='60' height='150' fill='#4d8bff'/><rect x='85' y='80' width='70' height='200' fill='#ff9ec0'/>
        <rect x='160' y='150' width='55' height='130' fill='#3ddc97'/><rect x='220' y='110' width='65' height='170' fill='#ff9f43'/>
        <rect x='-5' y='270' width='310' height='35' fill='#1d1a3a'/>
      </g>
      ${windows(30, 150, 2, 3)}${windows(95, 100, 3, 4)}${windows(170, 170, 2, 3)}${windows(232, 130, 2, 4)}`),
  },
];

/* ---------- Puzzle logic ---------- */
const SIZE = 3; // 3 x 3 tiles
const TILES = SIZE * SIZE;

// Shuffle aisa ki koi bhi tile pehle se sahi jagah par na ho -> har puzzle ka progress 0% se shuru hota hai
const shuffled = () => {
  const ids = Array.from({ length: TILES }, (_, i) => i);
  do {
    for (let i = ids.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [ids[i], ids[j]] = [ids[j], ids[i]];
    }
  } while (ids.some((piece, i) => piece === i));
  return ids;
};

const newGame = () => ({ tiles: shuffled(), picked: null, moves: 0 });
const correctCount = (tiles) => tiles.filter((piece, i) => piece === i).length;
const isSolved = (tiles) => correctCount(tiles) === TILES;
// Ek puzzle ka progress: kitni tiles sahi jagah par hain (0% ... 100%)
const percentOf = (tiles) => Math.round((correctCount(tiles) / TILES) * 100);

/* ---------- Snake progress bar ----------
   Snake ek ghumavdaar (S shape) raste par chalta hai. Sahi tiles badhne par snake lamba hota hai
   aur seb (apple) ki taraf badhta hai. 100% par snake seb kha leta hai. */
const SNAKE_PATH = "M 60 30 H 540 A 40 40 0 0 1 540 110 H 60 A 40 40 0 0 0 60 190 H 540";
const R = 40;
const LINE = 480;
const ARC = Math.PI * R;
const TOTAL = LINE * 3 + ARC * 2; // raste ki poori lambai

// Raste par `d` doori chalne ke baad snake ke sir ki jagah (x, y) aur disha (a, radians)
function pointAt(d) {
  d = Math.min(Math.max(d, 0), TOTAL);
  if (d <= LINE) return { x: 60 + d, y: 30, a: 0 };
  d -= LINE;
  if (d <= ARC) {
    const th = -Math.PI / 2 + d / R;
    return { x: 540 + R * Math.cos(th), y: 70 + R * Math.sin(th), a: th + Math.PI / 2 };
  }
  d -= ARC;
  if (d <= LINE) return { x: 540 - d, y: 110, a: Math.PI };
  d -= LINE;
  if (d <= ARC) {
    const th = -Math.PI / 2 - d / R;
    return { x: 60 + R * Math.cos(th), y: 150 + R * Math.sin(th), a: th - Math.PI / 2 };
  }
  d -= ARC;
  return { x: 60 + d, y: 190, a: 0 };
}

// Value ko naram tareeke se (ease-out) naye target tak le jaata hai, taaki snake slide karta dikhe
function useTween(target, ms = 650) {
  const [value, setValue] = useState(target);
  const latest = useRef(target);

  useEffect(() => {
    const from = latest.current;
    if (from === target) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      latest.current = target;
      setValue(target);
      return;
    }
    let raf;
    const t0 = performance.now();
    const step = (t) => {
      const k = Math.min(1, (t - t0) / ms);
      const eased = 1 - Math.pow(1 - k, 3);
      latest.current = from + (target - from) * eased;
      setValue(latest.current);
      if (k < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, ms]);

  return value;
}

function SnakeBar({ percent, label, mini = false }) {
  const shown = useTween(percent);
  const filled = (TOTAL * shown) / 100;
  const head = pointAt(filled);
  const deg = (head.a * 180) / Math.PI;

  // Body par chhote daag (dots) - sirf snake ki lambai tak
  const dots = filled >= 12 ? Math.floor((filled - 12) / 24) + 1 : 0;
  const dotDash = (dots ? "0 24 ".repeat(dots) : "") + "0 99999";

  const a11y = mini
    ? { "aria-hidden": true }
    : { role: "progressbar", "aria-valuemin": 0, "aria-valuemax": 100, "aria-valuenow": percent, "aria-label": label };

  return (
    <div className={"sn" + (mini ? " sn--mini" : "")} {...a11y}>
      <svg viewBox="0 0 600 220" aria-hidden="true" focusable="false">
        <path className="sn-edge" d={SNAKE_PATH} />
        <path className="sn-track" d={SNAKE_PATH} />

        {shown < 99.5 && (
          <g transform="translate(540 190)">
            <circle className="sn-apple" r="14" />
            <path className="sn-leaf" d="M0 -14 q2 -10 11 -12" />
          </g>
        )}

        {filled > 1 && (
          <>
            <path className="sn-body" d={SNAKE_PATH} strokeDasharray={`${filled} ${TOTAL + 50}`} />
            <path className="sn-spots" d={SNAKE_PATH} strokeDasharray={dotDash} strokeDashoffset={-12} />
          </>
        )}

        <g transform={`translate(${head.x} ${head.y}) rotate(${deg})`}>
          <path className="sn-tongue" d="M22 0 H35 M35 0 L42 -5 M35 0 L42 5" />
          <ellipse className="sn-head" rx="25" ry="20" />
          <circle className="sn-eye" cx="6" cy="-9" r="6.5" />
          <circle className="sn-eye" cx="6" cy="9" r="6.5" />
          <circle className="sn-pupil" cx="8.5" cy="-9" r="3" />
          <circle className="sn-pupil" cx="8.5" cy="9" r="3" />
        </g>
      </svg>
    </div>
  );
}

/* ---------- Ek puzzle ka board (state parent se aata hai, isliye puzzle badalne par bhi progress bachta hai) ---------- */
function PuzzleBoard({ puzzle, game, onPick, onReshuffle }) {
  const { tiles, picked, moves } = game;
  const solved = isSolved(tiles);

  return (
    <div className="pz-play">
      <div className={"pz-board" + (solved ? " is-solved" : "")} role="group" aria-label={`${puzzle.name} puzzle`}>
        {tiles.map((piece, i) => (
          <button
            key={i}
            type="button"
            className={"pz-tile" + (picked === i ? " is-picked" : "")}
            style={{
              backgroundImage: `url("${puzzle.image}")`,
              backgroundPosition: `${(piece % SIZE) * 50}% ${Math.floor(piece / SIZE) * 50}%`,
            }}
            aria-label={`Tile ${i + 1}${picked === i ? ", selected" : ""}`}
            aria-pressed={picked === i}
            onClick={() => onPick(i)}
          />
        ))}
      </div>

      <div className="pz-side">
        <div>
          <div className="pz-thumb" style={{ backgroundImage: `url("${puzzle.image}")` }} role="img" aria-label="Target picture" />
          <p className="pz-caption">Target picture</p>
        </div>
        <p className="pz-moves">Moves: <strong>{moves}</strong></p>
        {solved && <p className="pz-win" role="status">Puzzle solved in {moves} moves!</p>}
        <button type="button" className="btn pz-small" onClick={onReshuffle}>
          {solved ? "Play again" : "Shuffle again"}
        </button>
      </div>
    </div>
  );
}

/* ---------- Task 6: Progress bar (har puzzle ka apna snake progress bar, koi bhi puzzle chun sakte ho) ---------- */
export default function ProgressBar() {
  const [games, setGames] = useState(() => PUZZLES.map(newGame));
  const [current, setCurrent] = useState(0);

  const percents = games.map((g) => percentOf(g.tiles));
  const solvedCount = percents.filter((p) => p === 100).length;
  const overall = Math.round((solvedCount / PUZZLES.length) * 100);
  const allDone = solvedCount === PUZZLES.length;

  const game = games[current];
  const puzzle = PUZZLES[current];
  const percent = percents[current];
  const correct = correctCount(game.tiles);
  const solved = percent === 100;

  const patchCurrent = (fn) => setGames((gs) => gs.map((g, k) => (k === current ? fn(g) : g)));

  // Do tiles click karo -> swap. Sab tiles sahi jagah = puzzle solved (snake seb tak pahunch jaata hai).
  const pick = (i) =>
    patchCurrent((g) => {
      if (isSolved(g.tiles)) return g;
      if (g.picked === null) return { ...g, picked: i };
      if (g.picked === i) return { ...g, picked: null };
      const tiles = [...g.tiles];
      [tiles[g.picked], tiles[i]] = [tiles[i], tiles[g.picked]];
      return { tiles, picked: null, moves: g.moves + 1 };
    });

  const reshuffle = () => patchCurrent(newGame);
  const restartAll = () => {
    setGames(PUZZLES.map(newGame));
    setCurrent(0);
  };

  let status = `${correct} of ${TILES} tiles are in the right place. Swap two tiles to move the snake forward.`;
  if (solved) status = "Puzzle solved! The snake reached the apple.";

  return (
    <section className="panel progress-panel" style={{ "--panel": "var(--mint-soft)" }}>
      <p className="task-name">Task: Solve {PUZZLES.length} image puzzles</p>

      <div className="pz-summary">
        <span className="pz-chip">
          Overall <strong>{overall}%</strong> · {solvedCount} of {PUZZLES.length} puzzles solved
        </span>
        <p className={"status-line pz-summary-line" + (allDone ? " status-done" : "")} role="status">
          {allDone ? "Task completed successfully ✓ All puzzles solved." : "Pick any puzzle and solve it in any order."}
        </p>
      </div>

      <ul className="pz-cards" aria-label="Choose a puzzle">
        {PUZZLES.map((p, i) => (
          <li key={p.name}>
            <button
              type="button"
              className={"pz-card" + (i === current ? " is-current" : "") + (percents[i] === 100 ? " is-done" : "")}
              aria-pressed={i === current}
              aria-label={`${p.name}, ${percents[i]}% complete`}
              onClick={() => setCurrent(i)}
            >
              <span className="pz-card-row">
                <span className="pz-card-thumb" style={{ backgroundImage: `url("${p.image}")` }} aria-hidden="true" />
                <span className="pz-card-name">{p.name}</span>
                <span className="pz-card-pct">{percents[i] === 100 ? "✓" : `${percents[i]}%`}</span>
              </span>
              <SnakeBar percent={percents[i]} mini />
            </button>
          </li>
        ))}
      </ul>

      <section className="pz-stage" aria-label={`${puzzle.name} puzzle`}>
        <div className="pz-stage-head">
          <h2 className="pz-stage-title">
            Puzzle {current + 1} <span>· {puzzle.name}</span>
          </h2>
          <div className="percent" aria-hidden="true">{percent}%</div>
        </div>

        <div className="sn-wrap">
          <SnakeBar key={current} percent={percent} label={`${puzzle.name} progress`} />
        </div>

        <p className={"status-line" + (solved ? " status-done" : "")} aria-live="polite">{status}</p>

        <PuzzleBoard key={current} puzzle={puzzle} game={game} onPick={pick} onReshuffle={reshuffle} />
      </section>

      <div className="btn-row">
        <button type="button" className="btn btn--rose" onClick={restartAll} disabled={games.every((g) => g.moves === 0)}>
          Restart all
        </button>
      </div>
    </section>
  );
}