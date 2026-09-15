/*
 * «Собери проект» — ядро матч-3 без DOM.
 * Одно и то же ядро используется прототипом (браузер) и симуляцией баланса (node).
 * Поле детерминировано: сид = объект + стадия + дата, поэтому стартовое поле у всех одинаковое,
 * а сервер может переиграть присланный лог ходов и проверить сдачу.
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.SobCore = api;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const SIZE = 7;

  // Пять элементов работы архитектора. Индекс = тип фишки.
  const TYPES = [
    { key: 'line', name: 'Линия', hint: 'оси, размеры, разбивка' },
    { key: 'volume', name: 'Объём', hint: 'масса, этажи, пятно застройки' },
    { key: 'material', name: 'Материал', hint: 'бетон, дерево, стекло' },
    { key: 'green', name: 'Зелень', hint: 'деревья, газон, вода' },
    { key: 'light', name: 'Свет', hint: 'солнце, тени, время суток' },
  ];
  const T = { line: 0, volume: 1, material: 2, green: 3, light: 4 };

  // Неделя проекта. goals: [[тип, количество], ...]. Цифры откалиброваны симуляцией (docs/02-GDD.md, §6).
  const STAGES = [
    { day: 1, code: 'ГП', name: 'Генплан', desc: 'Посадка объекта на участок', goals: [[T.green, 20], [T.line, 14]] },
    { day: 2, code: 'ПЛ', name: 'Планы', desc: 'Организация пространства внутри', goals: [[T.line, 22], [T.volume, 16]] },
    { day: 3, code: 'РЗ', name: 'Разрезы', desc: 'Что происходит по высоте', goals: [[T.volume, 24], [T.line, 18]] },
    { day: 4, code: 'ФС', name: 'Фасады', desc: 'Как объект выглядит снаружи', goals: [[T.volume, 24], [T.material, 20]] },
    { day: 5, code: 'МТ', name: 'Материалы', desc: 'Из чего это сделано', goals: [[T.material, 26], [T.green, 20]] },
    { day: 6, code: 'СВ', name: 'Свет и окружение', desc: 'Время суток, среда, атмосфера', goals: [[T.light, 26], [T.green, 22]] },
    { day: 7, code: 'ВЗ', name: 'Визуализация', desc: 'Проект сдан — рендер открывается целиком', goals: [[T.light, 28], [T.material, 22]] },
  ];

  const MOVES_PER_STAGE = 30;
  const EXTRA_MOVES = 5; // «Доработка»: один раз за стадию, если ходы кончились

  // Объекты недель. Сюжет: бюро получает заказ, игрок ведёт его от генплана до подачи.
  const OBJECTS = [
    {
      key: 'pavilion', no: '01', name: 'Павильон у воды', area: '60 м²',
      client: 'Частный заказчик, участок на берегу озера',
      brief: 'Летний павильон: гостиная со вторым светом, терраса над водой. Сосны на участке рубить нельзя — заказчик проверит.',
      quote: '«Хочу видеть закат из гостиной и чтобы соседи не видели меня».',
    },
    { key: 'slope', no: '02', name: 'Дом на склоне', area: '180 м²', client: 'Семья из двух поколений', brief: 'Дом на перепаде в 6 метров: три уровня, въезд сверху, спальни внизу.', quote: '«Чтобы бабушке не пришлось подниматься по лестнице».' },
    { key: 'park', no: '03', name: 'Парковый фрагмент', area: '0,8 га', client: 'Городская администрация', brief: 'Фрагмент набережной: маршруты, свет, места для сидения, сохранение существующих деревьев.', quote: '«Нужно к открытию сезона, бюджет не резиновый».' },
    { key: 'studio', no: '04', name: 'Интерьер мастерской', area: '95 м²', client: 'Керамист, первая своя мастерская', brief: 'Мастерская с печью, зоной для занятий и витриной на улицу. Много дневного света.', quote: '«Глина везде, поэтому всё должно мыться».' },
  ];

  function hashStr(s) {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  function makeRng(seedStr) {
    let a = hashStr(String(seedStr));
    return function () {
      a |= 0;
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function adjacent(a, b) {
    const ra = (a / SIZE) | 0, ca = a % SIZE, rb = (b / SIZE) | 0, cb = b % SIZE;
    return Math.abs(ra - rb) + Math.abs(ca - cb) === 1;
  }

  function findMatches(g) {
    const hit = new Set();
    for (let r = 0; r < SIZE; r++) {
      let run = 1;
      for (let c = 1; c <= SIZE; c++) {
        if (c < SIZE && g[r * SIZE + c].t === g[r * SIZE + c - 1].t) run++;
        else {
          if (run >= 3) for (let k = c - run; k < c; k++) hit.add(r * SIZE + k);
          run = 1;
        }
      }
    }
    for (let c = 0; c < SIZE; c++) {
      let run = 1;
      for (let r = 1; r <= SIZE; r++) {
        if (r < SIZE && g[r * SIZE + c].t === g[(r - 1) * SIZE + c].t) run++;
        else {
          if (run >= 3) for (let k = r - run; k < r; k++) hit.add(k * SIZE + c);
          run = 1;
        }
      }
    }
    return hit;
  }

  function swapCells(g, a, b) {
    const x = g[a];
    g[a] = g[b];
    g[b] = x;
  }

  function findMoves(g) {
    const moves = [];
    for (let i = 0; i < SIZE * SIZE; i++) {
      const c = i % SIZE;
      const nbrs = [];
      if (c < SIZE - 1) nbrs.push(i + 1);
      if (i + SIZE < SIZE * SIZE) nbrs.push(i + SIZE);
      for (const j of nbrs) {
        swapCells(g, i, j);
        if (findMatches(g).size) moves.push([i, j]);
        swapCells(g, i, j);
      }
    }
    return moves;
  }

  function createGame(seedStr) {
    const rng = makeRng(seedStr);
    const rand = () => Math.floor(rng() * TYPES.length);
    const grid = new Array(SIZE * SIZE);
    let nextId = 1;

    function fill() {
      nextId = 1;
      for (let i = 0; i < SIZE * SIZE; i++) {
        const r = (i / SIZE) | 0, c = i % SIZE;
        let t, guard = 0;
        do {
          t = rand();
          guard++;
        } while (
          guard < 60 &&
          ((c >= 2 && grid[i - 1].t === t && grid[i - 2].t === t) ||
            (r >= 2 && grid[i - SIZE].t === t && grid[i - 2 * SIZE].t === t))
        );
        grid[i] = { id: nextId++, t };
      }
    }

    function reshuffle() {
      const cells = grid.slice();
      let tries = 0;
      do {
        for (let i = cells.length - 1; i > 0; i--) {
          const j = Math.floor(rng() * (i + 1));
          const x = cells[i];
          cells[i] = cells[j];
          cells[j] = x;
        }
        for (let i = 0; i < cells.length; i++) grid[i] = cells[i];
        tries++;
      } while ((findMatches(grid).size || !findMoves(grid).length) && tries < 200);
    }

    fill();
    let tries = 0;
    while (!findMoves(grid).length && tries++ < 50) fill();

    const snapshot = () => grid.map((x) => ({ id: x.id, t: x.t }));

    /**
     * Пытается поменять фишки a и b местами.
     * Невалидный свап (без совпадения) ход не тратит.
     * steps — каскады по порядку: что сгорело, сколько каждого типа, какие фишки упали сверху.
     */
    function trySwap(a, b) {
      if (!adjacent(a, b)) return { valid: false };
      swapCells(grid, a, b);
      let m = findMatches(grid);
      if (!m.size) {
        swapCells(grid, a, b);
        return { valid: false };
      }
      const steps = [];
      while (m.size) {
        const counts = new Array(TYPES.length).fill(0);
        const cleared = [];
        m.forEach((i) => {
          counts[grid[i].t]++;
          cleared.push(grid[i].id);
          grid[i] = null;
        });
        const spawned = [];
        for (let c = 0; c < SIZE; c++) {
          let write = SIZE - 1;
          for (let r = SIZE - 1; r >= 0; r--) {
            const cell = grid[r * SIZE + c];
            if (cell) {
              if (write !== r) {
                grid[write * SIZE + c] = cell;
                grid[r * SIZE + c] = null;
              }
              write--;
            }
          }
          const missing = write + 1;
          for (let r = write; r >= 0; r--) {
            const cell = { id: nextId++, t: rand() };
            grid[r * SIZE + c] = cell;
            spawned.push({ id: cell.id, startRow: r - missing });
          }
        }
        steps.push({ cleared, counts, spawned, snapshot: snapshot() });
        m = findMatches(grid);
      }
      let reshuffled = false;
      if (!findMoves(grid).length) {
        reshuffle();
        reshuffled = true;
      }
      return { valid: true, steps, reshuffled, snapshot: snapshot() };
    }

    return {
      snapshot,
      trySwap,
      moves: () => findMoves(grid),
      hint: () => findMoves(grid)[0] || null,
    };
  }

  function seedFor(objectKey, stageDay, dateStr) {
    return objectKey + '|' + stageDay + '|' + dateStr;
  }

  function goalsMet(goals, collected) {
    return goals.every(([t, n]) => collected[t] >= n);
  }

  return { SIZE, TYPES, T, STAGES, OBJECTS, MOVES_PER_STAGE, EXTRA_MOVES, hashStr, makeRng, adjacent, findMatches, createGame, seedFor, goalsMet };
});
