# «Собери проект» — техническое задание

Версия 0.2 · 15.09.2026. Решения из концепта раздела 07 («Уже решено») здесь не обсуждаются, только реализуются.

## 1. Состав системы

```
Telegram ─┬─ Бот @<новый_бот> (не studionobot)
          │     • /start, deep link ?startapp=<source>
          │     • утренние/вечерние напоминания
          │     • inline-карточка дня
          │     • админ канала прогрева → проверка подписки
          │
          └─ Mini App (статичный фронт, один домен)
                │ HTTPS, initData в заголовке
                ▼
        API (Node.js, VPS в РФ) ── БД (PostgreSQL или SQLite)
                │
                └─ служебный чат: уведомления о призах студии, ошибки
```

- **Фронт:** статичные файлы (HTML/CSS/JS, сборка Vite по желанию), `telegram-web-app.js`. Ядро поля — `core.js` из прототипа без изменений.
- **API:** Node.js 20+, Fastify или Express. Одно приложение с ботом (grammY) — меньше движущихся частей.
- **БД:** PostgreSQL; при нагрузке «сотни игроков» хватит и SQLite с WAL — выбрать по тому, что уже есть на VPS.
- **Хостинг [Р12]:** VPS в России, HTTPS (Let's Encrypt), один домен для фронта и API. Никаких iframe и чужих доменов — ограничение из концепта (раздел 08).

## 2. Идентификация

- Мини-апп передаёт `Telegram.WebApp.initData` в заголовке `Authorization: tma <initData>`.
- Сервер проверяет подпись HMAC-SHA256 по токену бота и `auth_date` не старше 24 часов.
- Из initData сохраняется **только `user.id`** [Р12]. Имя, username, фото, язык не пишутся в БД и логи.
- `start_param` (источник: `live`, `school`, `studio`, `share`) сохраняется при первом входе — для метрики Р4.

## 3. Данные

```sql
players      (tg_id BIGINT PK, source TEXT, created_at, write_access BOOL, subscribed_at NULL)
projects     (id PK, tg_id FK, object_key TEXT, started_on DATE, delays_left INT DEFAULT 2,
              status TEXT CHECK (status IN ('active','done','broken')), created_at)
stage_runs   (id PK, project_id FK, day INT 1..7, play_date DATE, seed TEXT,
              moves_used INT, extra_used BOOL, remarks BOOL, move_log JSONB, submitted_at)
              UNIQUE (project_id, day)
spins        (id PK, stage_run_id FK UNIQUE, outcome TEXT, sector INT, prize_ref TEXT, created_at)
promo_codes  (code TEXT PK, tg_id BIGINT NULL UNIQUE, assigned_at NULL)      -- пул 150 из GetCourse
studio_prizes(id PK, kind TEXT, tg_id BIGINT NULL UNIQUE, assigned_at NULL, handled_at NULL)
prompts      (id PK, source TEXT, title, body, tip, sort INT)
player_prompts(tg_id, prompt_id, got_at, PK (tg_id, prompt_id))
events       (id, tg_id, name TEXT, props JSONB, at)                         -- аналитика
```

Персональные данные по Р12: `tg_id` + связь с кодом. Всё остальное обезличено.

## 4. API

Все ответы JSON, время — Europe/Moscow.

| Метод | Что делает |
|---|---|
| `POST /api/session` | Создаёт/находит игрока и активный проект. Считает пропуски дней, списывает отсрочки, при необходимости срывает проект. Возвращает состояние недели, ТЗ дня, флаги (стадия сдана, спин использован) |
| `GET /api/stage` | Сегодняшняя стадия: `day, seed, goals, moves, extra`. Сид считает сервер |
| `POST /api/stage/submit` | Тело: `{ day, seed, moves: [[a,b],...], extraUsed, remarks }`. Сервер переигрывает лог (§5) и записывает `stage_runs`. Ответ — номер открытого слоя |
| `POST /api/spin` | Проверяет, что стадия сдана и спина нет. В транзакции выбирает исход (GDD §7), резервирует промпт / код / приз студии. Возвращает `outcome, sector, prize` |
| `POST /api/discount/claim` | Проверяет подписку (`getChatMember`), выдаёт зарезервированный код. Если не подписан — `403 {reason:'not_subscribed', invite}` |
| `GET /api/prizes` | Мои призы: промпты, код, приз студии |
| `POST /api/share` | Готовит inline-сообщение (`savePreparedInlineMessage`), возвращает id для `WebApp.shareMessage` |
| `POST /api/events` | Пачка событий аналитики |

## 5. Проверка сдачи (античит)

1. Клиент играет локально тем же `core.js` и копит лог обменов (≤ 30 пар индексов).
2. `submit` отправляет лог. Сервер: `createGame(seed)` → `trySwap` по логу → суммирует счётчики.
3. Сдача принимается, если: сид совпадает с серверным; все обмены валидны; ходов ≤ 25 (≤ 30 с доработкой); цели выполнены **или** `remarks=true` при исчерпанных ходах.
4. Иначе `422`, в `events` пишется `submit_rejected`. Игроку — «Не удалось сдать лист, сыграйте стадию заново».

Стоимость проверки — миллисекунды: 7×7 и ≤ 30 ходов.

## 6. Рулетка и пулы

- Выбор исхода и резерв — в одной транзакции: `UPDATE promo_codes SET tg_id=$1 WHERE code = (SELECT code FROM promo_codes WHERE tg_id IS NULL LIMIT 1 FOR UPDATE SKIP LOCKED)`. Аналогично для `studio_prizes`.
- Номер сектора — случайный сектор нужного типа, клиент только анимирует.
- Код резервируется при выпадении и выдаётся после подписки. Не подписался за 7 дней — резерв снимается, код возвращается в пул.
- Приз студии: при выпадении бот шлёт в служебный чат «Приз: консультация, игрок tg://user?id=…». Отметка «связались» — `handled_at` (команда в служебном чате).

## 7. Бот

- **Разрешение писать.** При первом входе, после первой сдачи — `WebApp.requestWriteAccess()` с объяснением «Пришлю ТЗ завтра утром». Без разрешения напоминаний нет.
- **Напоминания** — cron по Москве, 10:00 и 19:00, по правилам GDD §11. Отправка с лимитом ~25 сообщений в секунду.
- **Проверка подписки.** Бот — администратор канала прогрева [Р18]. `getChatMember(channel, tg_id)`: статусы `member/administrator/creator` = подписан.
- **Атрибуция [Р4].** Для игры — отдельная пригласительная ссылка канала (`createChatInviteLink name="game"`). Приток считаем по `chat_member`-апдейтам с этой ссылкой. Пост в канале и кнопка в игре ведут на неё.
- **Карточка дня** — `savePreparedInlineMessage` (картинка текущего слоя + текст + кнопка «Играть» с `startapp=share`) → `WebApp.shareMessage`.

## 8. Ассеты [Р7]

| Ассет | Кол-во | Формат |
|---|---|---|
| Значки фишек | 5 | SVG 24×24, одна толщина линии; в прототипе — рабочие заглушки |
| Фон/текстура поля | 1 | SVG или PNG ≤ 200 КБ |
| Финальный рендер объекта | 4 | JPG/WebP 1600×1120 (10:7), ≤ 400 КБ |
| Лайнворк того же ракурса | 4 | PNG с прозрачностью 1600×1120 |
| Аватар ведущего / иконка бота | 1–2 | PNG 512×512 |
| Картинка карточки дня | генерируется сервером из слоя | JPG 1200×840 |

## 9. Аналитика

События: `app_open{source}`, `brief_view`, `stage_start`, `move`, `extra_used`, `stage_submit{day, moves, remarks}`, `layer_view`, `spin{outcome}`, `prompt_copy`, `discount_gate_view`, `subscribe_click`, `discount_claim`, `share_click`, `project_broken`, `project_done`, `reminder_sent/opened`.

Дашборд на первые 2 недели: открытия по источникам → сдали день 1 → дошли до 3-го → до 7-го; спины по исходам; подписки по ссылке игры [Р4]; коды выданы / оплачены (сверка с GetCourse вручную).

## 10. Нагрузка и надёжность

- Пик — финал эфира и первые часы посевов: сотни одновременных игроков. Один VPS 2 vCPU / 2 ГБ с запасом.
- Статика с `Cache-Control`, API без тяжёлых запросов.
- Бэкап БД раз в сутки; пулы кодов и призов — главная ценность, их выгрузка лежит отдельно.
- Фича-флаги в конфиге: вес скидки, вес приза студии, активный объект, тексты ТЗ — меняются без деплоя фронта.

## 11. Что переиспользуем из прототипа

- `prototype/core.js` — ядро как есть: фронт + серверная проверка. Концепт предлагал «взять готовое ядро под свободной лицензией» — своё уже написано, детерминировано и проверено симуляцией. Лицензионный вопрос снимается.
- Логика экранов, анимаций, рулетки и текстов из `prototype/index.html` переносится в боевой фронт; меняются стор (API вместо localStorage) и визуализация (картинки студии вместо процедурного рисунка).
