// API bảng xếp hạng thời gian ghép từ. Chạy được trên Cloudflare Workers (D1) và local (d1-local.mjs).
// env: DB (D1), PUZZLE_SEED, RATE_SALT, NOW? (hàm trả epoch ms, chỉ dùng cho test)
import { POOLS, PAIRS_PER_PUZZLE, DECOYS_PER_PUZZLE } from "./puzzles.js";

export const PENALTY_MS = 5000;
export const MAX_MISTAKES = 10;
const BOARD_LIMIT = 50;
const BODY_LIMIT = 2048;
const SESSION_MS = 180 * 86400000;
const DAY_OFFSET_MS = 7 * 3600000; // ngày thi tính theo giờ Việt Nam
const CODE_ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
const LIMITS = {
  register: { max: 10, windowMs: 3600000 },
  recover: { max: 10, windowMs: 900000 }
};

class HttpError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

const json = (status, body) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" }
  });

const now = (env) => (env.NOW ? env.NOW() : Date.now());
export const dayOf = (ms) => new Date(ms + DAY_OFFSET_MS).toISOString().slice(0, 10);

async function sha256(text) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, "0")).join("");
}

function randomBytes(n) {
  return crypto.getRandomValues(new Uint8Array(n));
}

const randomToken = () => Array.from(randomBytes(32), (b) => b.toString(16).padStart(2, "0")).join("");

// 16 ký tự x 5 bit = 80 bit ngẫu nhiên (256 chia hết cho 32 nên không lệch)
function randomRecoveryCode() {
  const chars = Array.from(randomBytes(16), (b) => CODE_ALPHABET[b % 32]).join("");
  return chars.match(/.{4}/g).join("-");
}

const normalizeCode = (code) => String(code).toUpperCase().replace(/[^0-9A-Z]/g, "");

function shuffle(list, random) {
  const copy = list.slice();
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

const secureRandom = () => crypto.getRandomValues(new Uint32Array(1))[0] / 4294967296;

function seededRandom(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Cùng seed + ngày + ngôn ngữ => cùng một đề cho mọi người
export async function buildPuzzle(seed, day, lang) {
  const pool = POOLS[lang];
  const digest = await sha256(`${seed}|${day}|${lang}`);
  const random = seededRandom(parseInt(digest.slice(0, 8), 16));
  const pairs = shuffle(pool.pairs, random).slice(0, PAIRS_PER_PUZZLE);
  const decoys = shuffle(pool.decoys, random).slice(0, DECOYS_PER_PUZZLE);
  return { topic: pool.topic, pairs, decoys };
}

async function readBody(request) {
  if (!(request.headers.get("content-type") || "").startsWith("application/json")) {
    throw new HttpError(415, "BAD_CONTENT_TYPE", "Yêu cầu phải là JSON");
  }
  const text = await request.text();
  if (text.length > BODY_LIMIT) throw new HttpError(413, "BODY_TOO_LARGE", "Dữ liệu quá lớn");
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    throw new HttpError(400, "BAD_JSON", "JSON không hợp lệ");
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new HttpError(400, "BAD_JSON", "JSON không hợp lệ");
  }
  return body;
}

function parseNickname(value) {
  // NFKC gộp ký tự fullwidth/biến thể; bên dưới chặn ký tự "chữ" nhưng vô hình (Hangul filler)
  const nickname = typeof value === "string" ? value.normalize("NFKC").trim().replace(/\s+/g, " ") : "";
  if (!/^[\p{L}\p{N}_ -]{3,20}$/u.test(nickname) || /[\u115f\u1160\u3164\uffa0]/.test(nickname)) {
    throw new HttpError(400, "INVALID_NICKNAME", "Biệt danh 3-20 ký tự: chữ, số, khoảng trắng, _ hoặc -");
  }
  return { nickname, key: nickname.toLowerCase() };
}

function parseLang(value) {
  if (value !== "vi" && value !== "en") throw new HttpError(400, "BAD_LANG", "Ngôn ngữ không hợp lệ");
  return value;
}

async function rateLimit(env, request, action) {
  const { max, windowMs } = LIMITS[action];
  const ip = request.headers.get("cf-connecting-ip") || "unknown";
  const bucket = await sha256(`${env.RATE_SALT}|${action}|${ip}`); // không lưu IP thô
  const windowStart = Math.floor(now(env) / windowMs) * windowMs;
  const row = await env.DB.prepare(
    `INSERT INTO rate_limits (bucket, window_start, hits) VALUES (?1, ?2, 1)
     ON CONFLICT (bucket, window_start) DO UPDATE SET hits = hits + 1
     RETURNING hits`
  ).bind(bucket, windowStart).first();
  if (row.hits > max) throw new HttpError(429, "RATE_LIMITED", "Thử quá nhiều lần, vui lòng chờ");
}

async function createSession(env, userId) {
  const token = randomToken();
  await env.DB.prepare("INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?1, ?2, ?3)")
    .bind(await sha256(token), userId, now(env) + SESSION_MS)
    .run();
  return token;
}

async function findSession(env, request) {
  const match = /^Bearer ([0-9a-f]{64})$/.exec(request.headers.get("authorization") || "");
  if (!match) return null;
  const tokenHash = await sha256(match[1]);
  const row = await env.DB.prepare(
    `SELECT u.id AS userId, u.nickname AS nickname FROM sessions s JOIN users u ON u.id = s.user_id
     WHERE s.token_hash = ?1 AND s.expires_at > ?2`
  ).bind(tokenHash, now(env)).first();
  return row ? { ...row, tokenHash } : null;
}

async function requireSession(env, request) {
  const session = await findSession(env, request);
  if (!session) throw new HttpError(401, "UNAUTHORIZED", "Phiên đăng nhập không hợp lệ");
  return session;
}

async function register(env, request) {
  const { nickname, key } = parseNickname((await readBody(request)).nickname);
  await rateLimit(env, request, "register");
  const id = crypto.randomUUID();
  const recoveryCode = randomRecoveryCode();
  const result = await env.DB.prepare(
    `INSERT INTO users (id, nickname, nickname_key, recovery_hash, created_at)
     VALUES (?1, ?2, ?3, ?4, ?5) ON CONFLICT (nickname_key) DO NOTHING`
  ).bind(id, nickname, key, await sha256(normalizeCode(recoveryCode)), now(env)).run();
  if (!result.meta.changes) throw new HttpError(409, "NICKNAME_TAKEN", "Biệt danh đã có người dùng");
  return json(201, { token: await createSession(env, id), recoveryCode, nickname });
}

async function recover(env, request) {
  const body = await readBody(request);
  const { key } = parseNickname(body.nickname);
  if (typeof body.code !== "string") throw new HttpError(400, "BAD_CODE", "Thiếu mã khôi phục");
  await rateLimit(env, request, "recover");
  const user = await env.DB.prepare(
    "SELECT id, nickname FROM users WHERE nickname_key = ?1 AND recovery_hash = ?2"
  ).bind(key, await sha256(normalizeCode(body.code))).first();
  if (!user) throw new HttpError(401, "BAD_CREDENTIALS", "Sai biệt danh hoặc mã khôi phục");
  return json(200, { token: await createSession(env, user.id), nickname: user.nickname });
}

const loadAttempt = (env, userId, day, lang) =>
  env.DB.prepare("SELECT * FROM attempts WHERE user_id = ?1 AND day = ?2 AND lang = ?3")
    .bind(userId, day, lang)
    .first();

// Chỉ trả về mảnh ghép và những gì đã giải; cột answers không bao giờ rời máy chủ
function toRunView(env, row) {
  const solved = JSON.parse(row.solved);
  const used = new Set(solved.flatMap((s) => [s.a, s.b]));
  const finished = row.finished_at !== null;
  return {
    day: row.day,
    lang: row.lang,
    topic: row.topic,
    pairCount: JSON.parse(row.answers).length,
    tiles: JSON.parse(row.tiles).map((text, id) => ({ id, text, used: used.has(id) })),
    solved: solved.map((s) => s.word),
    mistakes: row.mistakes,
    maxMistakes: MAX_MISTAKES,
    penaltyMs: PENALTY_MS,
    elapsedMs: (finished ? row.finished_at : now(env)) - row.started_at,
    finished,
    scoreMs: row.score_ms
  };
}

async function startRun(env, request) {
  const session = await requireSession(env, request);
  const lang = parseLang((await readBody(request)).lang);
  const day = dayOf(now(env));
  let row = await loadAttempt(env, session.userId, day, lang);
  if (!row) {
    const puzzle = await buildPuzzle(env.PUZZLE_SEED, day, lang);
    const tiles = shuffle([...puzzle.pairs.flat(), ...puzzle.decoys], secureRandom);
    // Bấm 2 lần / 2 tab: chỉ lượt đầu được ghi, đồng hồ không bị đặt lại
    await env.DB.prepare(
      `INSERT INTO attempts (user_id, day, lang, topic, tiles, answers, started_at)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7) ON CONFLICT (user_id, day, lang) DO NOTHING`
    ).bind(session.userId, day, lang, puzzle.topic, JSON.stringify(tiles), JSON.stringify(puzzle.pairs), now(env)).run();
    row = await loadAttempt(env, session.userId, day, lang);
  }
  return json(200, toRunView(env, row));
}

// Chỉ ĐỌC lượt đã có để đồng bộ lại; không bao giờ tạo lượt mới
async function readRun(env, request, url) {
  const session = await requireSession(env, request);
  const lang = parseLang(url.searchParams.get("lang"));
  const row = await loadAttempt(env, session.userId, url.searchParams.get("day") || "", lang);
  if (!row) throw new HttpError(404, "NO_RUN", "Chưa bắt đầu lượt thi");
  return json(200, toRunView(env, row));
}

async function guess(env, request) {
  const session = await requireSession(env, request);
  const body = await readBody(request);
  const lang = parseLang(body.lang);
  if (typeof body.day !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(body.day)) {
    throw new HttpError(400, "BAD_DAY", "Ngày không hợp lệ");
  }
  const row = await loadAttempt(env, session.userId, body.day, lang);
  if (!row) throw new HttpError(404, "NO_RUN", "Chưa bắt đầu lượt thi");
  if (row.finished_at !== null) throw new HttpError(409, "RUN_FINISHED", "Lượt thi đã kết thúc");
  // Lượt qua nửa đêm được chơi nốt, nhưng không để treo sang ngày khác nữa
  if (body.day < dayOf(now(env) - 86400000)) throw new HttpError(409, "RUN_EXPIRED", "Lượt thi đã hết hạn");

  const tiles = JSON.parse(row.tiles);
  const solved = JSON.parse(row.solved);
  const used = new Set(solved.flatMap((s) => [s.a, s.b]));
  const { a, b } = body;
  const valid = (i) => Number.isInteger(i) && i >= 0 && i < tiles.length && !used.has(i);
  if (!valid(a) || !valid(b) || a === b) throw new HttpError(400, "BAD_TILE", "Mảnh ghép không hợp lệ");

  const answers = JSON.parse(row.answers);
  const pair = answers.find(
    ([l, r]) => (tiles[a] === l && tiles[b] === r) || (tiles[a] === r && tiles[b] === l)
  );
  let mistakes = row.mistakes;
  let word = null;
  if (pair) {
    word = pair.join(POOLS[lang].join);
    solved.push({ a, b, word });
  } else {
    mistakes += 1;
  }

  const completed = solved.length === answers.length;
  const failed = mistakes >= MAX_MISTAKES;
  const finishedAt = completed || failed ? now(env) : null;
  const scoreMs = completed ? finishedAt - row.started_at + mistakes * PENALTY_MS : null;

  const result = await env.DB.prepare(
    `UPDATE attempts SET solved = ?1, mistakes = ?2, finished_at = ?3, score_ms = ?4, version = version + 1
     WHERE user_id = ?5 AND day = ?6 AND lang = ?7 AND version = ?8 AND finished_at IS NULL`
  ).bind(JSON.stringify(solved), mistakes, finishedAt, scoreMs, session.userId, body.day, lang, row.version).run();
  if (!result.meta.changes) throw new HttpError(409, "RUN_CONFLICT", "Lượt thi vừa thay đổi, hãy tải lại");

  const view = toRunView(env, { ...row, solved: JSON.stringify(solved), mistakes, finished_at: finishedAt, score_ms: scoreMs });
  return json(200, { ...view, correct: Boolean(pair), merged: word });
}

async function leaderboard(env, request, url) {
  const lang = parseLang(url.searchParams.get("lang"));
  const day = dayOf(now(env));
  const session = await findSession(env, request);
  const { results } = await env.DB.prepare(
    `SELECT u.nickname AS nickname, a.score_ms AS scoreMs, a.mistakes AS mistakes
     FROM attempts a JOIN users u ON u.id = a.user_id
     WHERE a.day = ?1 AND a.lang = ?2 AND a.score_ms IS NOT NULL
     ORDER BY a.score_ms, a.finished_at, a.user_id LIMIT ?3`
  ).bind(day, lang, BOARD_LIMIT).all();
  const entries = results.map((r, i) => ({ rank: i + 1, ...r }));

  let me = null;
  if (session) {
    const mine = await loadAttempt(env, session.userId, day, lang);
    if (mine && mine.score_ms !== null) {
      const ahead = await env.DB.prepare(
        `SELECT COUNT(*) AS n FROM attempts
         WHERE day = ?1 AND lang = ?2 AND score_ms IS NOT NULL
           AND (score_ms, finished_at, user_id) < (?3, ?4, ?5)`
      ).bind(day, lang, mine.score_ms, mine.finished_at, session.userId).first();
      me = { rank: ahead.n + 1, nickname: session.nickname, scoreMs: mine.score_ms, mistakes: mine.mistakes };
    }
  }
  return json(200, { day, entries, me });
}

async function route(env, request) {
  const url = new URL(request.url);
  switch (`${request.method} ${url.pathname}`) {
    case "GET /healthz":
      return json(200, { ok: true });
    case "GET /readyz":
      await env.DB.prepare("SELECT 1 FROM users LIMIT 1").first();
      return json(200, { ok: true });
    case "POST /api/register":
      return register(env, request);
    case "POST /api/recover":
      return recover(env, request);
    case "POST /api/logout": {
      const session = await requireSession(env, request);
      await env.DB.prepare("DELETE FROM sessions WHERE token_hash = ?1").bind(session.tokenHash).run();
      return json(200, { ok: true });
    }
    case "DELETE /api/me": {
      const session = await requireSession(env, request);
      // sessions và attempts xóa theo ON DELETE CASCADE
      await env.DB.prepare("DELETE FROM users WHERE id = ?1").bind(session.userId).run();
      return json(200, { ok: true });
    }
    case "GET /api/run":
      return readRun(env, request, url);
    case "POST /api/run/start":
      return startRun(env, request);
    case "POST /api/run/guess":
      return guess(env, request);
    case "GET /api/leaderboard":
      return leaderboard(env, request, url);
    default:
      throw new HttpError(404, "NOT_FOUND", "Không tìm thấy");
  }
}

export default {
  async fetch(request, env) {
    try {
      if (!env.PUZZLE_SEED || !env.RATE_SALT) throw new Error("Thiếu PUZZLE_SEED hoặc RATE_SALT");
      return await route(env, request);
    } catch (error) {
      if (error instanceof HttpError) {
        return json(error.status, { error: { code: error.code, message: error.message } });
      }
      const requestId = crypto.randomUUID();
      console.error(JSON.stringify({ requestId, error: String(error && error.message) }));
      return json(500, { error: { code: "INTERNAL", message: `Lỗi máy chủ (${requestId})` } });
    }
  }
};
