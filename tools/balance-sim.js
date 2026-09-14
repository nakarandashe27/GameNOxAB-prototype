/*
 * Симуляция баланса «Собери проект».
 * Запуск: node tools/balance-sim.js [партий=1500]
 * Два игрока: random — любой валидный ход (нижняя граница), greedy — ход, дающий больше целевых фишек сразу.
 * Для пары целевых типов считает, какая доля партий собирает (A, B) за 25 ходов и за сколько ходов в среднем.
 */
const core = require('../prototype/core.js');

const RUNS = Number(process.argv[2]) || 1500;
const MOVES = core.MOVES_PER_STAGE;
const EXTRA = core.EXTRA_MOVES;
const TA = 0, TB = 1; // типы симметричны, берём линию и объём

function simulate(policy, seedBase) {
  const traj = []; // traj[k] = [a, b] после k+1 ходов
  const g = core.createGame(seedBase);
  const col = [0, 0];
  for (let k = 0; k < MOVES + EXTRA; k++) {
    const moves = g.moves();
    let pick;
    if (policy === 'random') {
      pick = moves[Math.floor(Math.random() * moves.length)];
    } else {
      // greedy: оцениваем немедленный выигрыш по первому шагу на копии не делаем — используем сид-независимую эвристику:
      // пробуем каждый ход на клоне игры через тот же сид невозможно, поэтому считаем фишки целевых типов в линии совпадения
      const snap = g.snapshot();
      let best = -1;
      for (const [a, b] of moves) {
        const s = snap.slice();
        const x = s[a]; s[a] = s[b]; s[b] = x;
        const hit = core.findMatches(s);
        let score = 0;
        hit.forEach((i) => { if (s[i].t === TA || s[i].t === TB) score += 1; });
        score += Math.random() * 0.5;
        if (score > best) { best = score; pick = [a, b]; }
      }
    }
    const res = g.trySwap(pick[0], pick[1]);
    for (const st of res.steps) { col[0] += st.counts[TA]; col[1] += st.counts[TB]; }
    traj.push([col[0], col[1]]);
  }
  return traj;
}

function evaluate(trajs, A, B) {
  let pass = 0, passExtra = 0, movesSum = 0;
  for (const tr of trajs) {
    let done = -1;
    for (let k = 0; k < tr.length; k++) if (tr[k][0] >= A && tr[k][1] >= B) { done = k + 1; break; }
    if (done !== -1 && done <= MOVES) { pass++; movesSum += done; }
    if (done !== -1) passExtra++;
  }
  return { pass: pass / trajs.length, passExtra: passExtra / trajs.length, avgMoves: pass ? movesSum / pass : NaN };
}

const pct = (x) => (x * 100).toFixed(0).padStart(3) + '%';

for (const policy of ['random', 'greedy']) {
  const trajs = [];
  for (let i = 0; i < RUNS; i++) trajs.push(simulate(policy, 'sim|' + policy + '|' + i));
  const last = trajs.map((t) => t[MOVES - 1]);
  const mean = (arr) => arr.reduce((s, x) => s + x, 0) / arr.length;
  console.log(`\n=== ${policy}: ${RUNS} партий, за ${MOVES} ходов собрано в среднем A=${mean(last.map((x) => x[0])).toFixed(1)} B=${mean(last.map((x) => x[1])).toFixed(1)}`);
  const BS = [8, 12, 14, 16, 18, 20, 22, 24];
  console.log('A\\B   ' + BS.map((b) => String(b).padStart(13)).join(''));
  for (const A of [12, 16, 18, 20, 22, 24, 26, 28, 30]) {
    let row = String(A).padStart(3) + '   ';
    for (const B of BS) {
      const e = evaluate(trajs, A, B);
      row += `${pct(e.pass)}/${pct(e.passExtra)}/${String(e.avgMoves.toFixed(0)).padStart(2)}`.padStart(13);
    }
    console.log(row);
  }
}
console.log('\nФормат ячейки: проходимость за 25 ходов / с доработкой +5 / средний ход сдачи');
