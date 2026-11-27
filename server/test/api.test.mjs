import { test } from "node:test";
import assert from "node:assert/strict";
import worker, { buildPuzzle, dayOf, MAX_MISTAKES, PENALTY_MS } from "../worker.js";
import { createLocalDb } from "../d1-local.mjs";
import { POOLS } from "../puzzles.js";

const T0 = Date.UTC(2026, 10, 27, 3, 0, 0); // 10:00 giờ VN

function setup() {
  const clock = { ms: T0 };
  const env = { DB: createLocalDb(":memory:"), PUZZLE_SEED: "seed", RATE_SALT: "salt", NOW: () => clock.ms };
  const call = async (method, path, { body, token, ip = "1.1.1.1", type = "application/json", raw } = {}) => {
    const headers = { "cf-connecting-ip": ip };
    if (token) headers.authorization = `Bearer ${token}`;
    if (body !== undefined || raw !== undefined) headers["content-type"] = type;
    const res = await worker.fetch(
      new Request(`http://x${path}`, { method, headers, body: raw ?? (body && JSON.stringify(body)) }),
      env
    );
    return { status: res.status, body: await res.json() };
  };
  const signUp = async (nickname) => (await call("POST", "/api/register", { body: { nickname } })).body;
  const start = async (token, lang = "vi") => (await call("POST", "/api/run/start", { token, body: { lang } })).body;
  return { env, clock, call, signUp, start };
}

// Test được biết seed nên tự dựng lại đáp án
async function solution(env, run) {
  const { pairs, decoys } = await buildPuzzle(env.PUZZLE_SEED, run.day, run.lang);
  const id = (text) => run.tiles.find((t) => t.text === text).id;
  return { moves: pairs.map(([l, r]) => [id(l), id(r)]), wrong: [id(decoys[0]), id(decoys[1])] };
}

const guess = (call, token, run, [a, b]) =>
  call("POST", "/api/run/guess", { token, body: { lang: run.lang, day: run.day, a, b } });

test("kho đề: mảnh không trùng trong cùng ngôn ngữ", () => {
  for (const pool of Object.values(POOLS)) {
    const tiles = [...pool.pairs.flat(), ...pool.decoys].map((t) => t.toLowerCase());
    assert.equal(new Set(tiles).size, tiles.length);
  }
});

test("đăng ký, trùng tên, tên sai, khôi phục", async () => {
  const { call, signUp } = setup();
  const user = await signUp("Đại Ca");
  assert.match(user.recoveryCode, /^[0-9A-Z]{4}(-[0-9A-Z]{4}){3}$/);
  assert.equal((await call("POST", "/api/register", { body: { nickname: "  đại   ca " } })).status, 409);
  assert.equal((await call("POST", "/api/register", { body: { nickname: "<script>" } })).status, 400);
  const ok = await call("POST", "/api/recover", { body: { nickname: "ĐẠI CA", code: user.recoveryCode.toLowerCase() } });
  assert.equal(ok.status, 200);
  const bad = await call("POST", "/api/recover", { body: { nickname: "Đại Ca", code: "0000-0000-0000-0000" } });
  assert.equal(bad.status, 401);
});

test("không lưu mã khôi phục hay token dạng thô", async () => {
  const { env, signUp } = setup();
  const user = await signUp("hash check");
  const u = await env.DB.prepare("SELECT * FROM users").first();
  const s = await env.DB.prepare("SELECT * FROM sessions").first();
  assert.ok(!JSON.stringify(u).includes(user.recoveryCode.replaceAll("-", "")));
  assert.notEqual(s.token_hash, user.token);
});

test("rate limit đăng ký theo IP", async () => {
  const { call } = setup();
  for (let i = 0; i < 10; i++) {
    assert.equal((await call("POST", "/api/register", { body: { nickname: `user ${i}` } })).status, 201);
  }
  assert.equal((await call("POST", "/api/register", { body: { nickname: "user 11" } })).status, 429);
  assert.equal((await call("POST", "/api/register", { body: { nickname: "other ip" }, ip: "2.2.2.2" })).status, 201);
});

test("chặn request không hợp lệ", async () => {
  const { call } = setup();
  assert.equal((await call("POST", "/api/run/start", { body: { lang: "vi" } })).status, 401);
  assert.equal((await call("POST", "/api/run/start", { token: "f".repeat(64), body: { lang: "vi" } })).status, 401);
  assert.equal((await call("POST", "/api/register", { raw: "{", })).status, 400);
  assert.equal((await call("POST", "/api/register", { raw: "{}", type: "text/plain" })).status, 415);
  assert.equal((await call("POST", "/api/register", { raw: "x".repeat(3000) })).status, 413);
  assert.equal((await call("GET", "/api/leaderboard?lang=xx")).status, 400);
});

test("không lộ đáp án; mở lại không đặt lại đồng hồ", async () => {
  const { clock, signUp, start } = setup();
  const { token } = await signUp("resume");
  const first = await start(token);
  assert.equal(first.tiles.length, 19);
  assert.equal(first.answers, undefined);
  assert.deepEqual(first.solved, []);
  clock.ms += 7000;
  const again = await start(token);
  assert.deepEqual(again.tiles, first.tiles);
  assert.equal(again.elapsedMs, 7000);
});

test("giải xong: điểm = thời gian máy chủ + phạt; không chơi lại được", async () => {
  const { env, clock, call, signUp, start } = setup();
  const { token } = await signUp("solver");
  const run = await start(token);
  const { moves, wrong } = await solution(env, run);
  const miss = await guess(call, token, run, wrong);
  assert.equal(miss.body.correct, false);
  let last;
  for (const move of moves) {
    clock.ms += 1000;
    last = await guess(call, token, run, [move[1], move[0]]);
    assert.equal(last.body.correct, true);
  }
  assert.equal(last.body.finished, true);
  assert.equal(last.body.scoreMs, 8000 + PENALTY_MS);
  assert.equal((await guess(call, token, run, wrong)).status, 409);
  assert.equal((await start(token)).scoreMs, 8000 + PENALTY_MS);
});

test("mảnh đã dùng, trùng id, ngoài khoảng bị từ chối", async () => {
  const { env, call, signUp, start } = setup();
  const { token } = await signUp("tiles");
  const run = await start(token);
  const { moves } = await solution(env, run);
  await guess(call, token, run, moves[0]);
  for (const move of [moves[0], [moves[1][0], moves[1][0]], [-1, 2], [0, 999], ["0", 1]]) {
    assert.equal((await guess(call, token, run, move)).status, 400);
  }
});

test("đọc lại lượt không tạo lượt mới; biệt danh vô hình bị từ chối", async () => {
  const { env, clock, call, signUp, start } = setup();
  const { token } = await signUp("reader");
  const run = await start(token);
  assert.equal((await call("GET", `/api/run?lang=vi&day=${run.day}`, { token })).status, 200);
  clock.ms += 86400000;
  assert.equal((await call("GET", `/api/run?lang=vi&day=${dayOf(clock.ms)}`, { token })).status, 404);
  assert.equal((await env.DB.prepare("SELECT COUNT(*) AS n FROM attempts").first()).n, 1);
  assert.equal((await call("GET", `/api/run?lang=vi&day=${run.day}`)).status, 401);
  assert.equal((await call("POST", "/api/register", { body: { nickname: "\u3164\u3164\u3164" } })).status, 400);
  assert.equal((await call("POST", "/api/register", { body: { nickname: "\uff52\uff45\uff41\uff44\uff45\uff52" } })).status, 409);
});

test("quá số lần sai thì bị loại khỏi BXH", async () => {
  const { env, call, signUp, start } = setup();
  const { token } = await signUp("loser");
  const run = await start(token);
  const { wrong } = await solution(env, run);
  let last;
  for (let i = 0; i < MAX_MISTAKES; i++) last = await guess(call, token, run, wrong);
  assert.equal(last.body.finished, true);
  assert.equal(last.body.scoreMs, null);
  assert.equal((await call("GET", "/api/leaderboard?lang=vi")).body.entries.length, 0);
});

test("2 lệnh đồng thời không ghi đè nhau", async () => {
  const { env, call, signUp, start } = setup();
  const { token } = await signUp("racer");
  const run = await start(token);
  const { wrong } = await solution(env, run);
  const results = await Promise.all(Array.from({ length: 5 }, () => guess(call, token, run, wrong)));
  const accepted = results.filter((r) => r.status === 200).length;
  assert.ok(results.every((r) => r.status === 200 || r.status === 409));
  assert.equal((await start(token)).mistakes, accepted);
});

test("BXH xếp theo thời gian, tách ngôn ngữ, có hạng của mình", async () => {
  const { env, clock, call, signUp, start } = setup();
  const play = async (name, gap) => {
    const { token } = await signUp(name);
    const run = await start(token);
    for (const move of (await solution(env, run)).moves) {
      clock.ms += gap;
      await guess(call, token, run, move);
    }
    return token;
  };
  const slow = await play("slow one", 3000);
  await play("fast one", 1000);
  const board = (await call("GET", "/api/leaderboard?lang=vi", { token: slow })).body;
  assert.deepEqual(board.entries.map((e) => e.nickname), ["fast one", "slow one"]);
  assert.equal(board.me.rank, 2);
  assert.equal((await call("GET", "/api/leaderboard?lang=en")).body.entries.length, 0);
});

test("ngày theo giờ VN; lượt qua nửa đêm chơi nốt được, để quá lâu thì hết hạn", async () => {
  const { env, clock, call, signUp, start } = setup();
  assert.equal(dayOf(Date.UTC(2026, 10, 27, 17, 0, 0)), "2026-11-28");
  clock.ms = Date.UTC(2026, 10, 27, 16, 59, 0);
  const { token } = await signUp("night owl");
  const run = await start(token);
  const { moves } = await solution(env, run);
  clock.ms += 120000;
  assert.equal((await guess(call, token, run, moves[0])).status, 200);
  assert.notEqual((await start(token)).day, run.day);
  clock.ms += 2 * 86400000;
  assert.equal((await guess(call, token, run, moves[1])).body.error.code, "RUN_EXPIRED");
});

test("đăng xuất và xóa tài khoản xóa sạch dữ liệu", async () => {
  const { env, call, signUp, start } = setup();
  const a = await signUp("leaver");
  await call("POST", "/api/logout", { token: a.token });
  assert.equal((await call("POST", "/api/run/start", { token: a.token, body: { lang: "vi" } })).status, 401);
  const b = await signUp("deleter");
  await start(b.token);
  assert.equal((await call("DELETE", "/api/me", { token: b.token })).status, 200);
  assert.equal((await env.DB.prepare("SELECT COUNT(*) AS n FROM attempts").first()).n, 0);
  assert.equal((await env.DB.prepare("SELECT COUNT(*) AS n FROM sessions").first()).n, 0);
  assert.equal((await call("POST", "/api/register", { body: { nickname: "deleter" } })).status, 201);
});

test("thiếu secret thì dừng, không lộ chi tiết lỗi", async () => {
  const res = await worker.fetch(new Request("http://x/healthz"), { DB: createLocalDb(":memory:") });
  assert.equal(res.status, 500);
  assert.ok(!(await res.text()).includes("PUZZLE_SEED"));
});
