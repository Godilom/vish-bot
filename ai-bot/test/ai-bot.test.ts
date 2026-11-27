import { describe, expect, it } from "vitest";
import { buildRequest } from "../src/claude.js";
import { loadConfig, parseDotEnv } from "../src/config.js";
import { History, Usage, moscowDay } from "../src/memory.js";
import { replyText, splitForTelegram } from "../src/text.js";

const env = { AI_BOT_TOKEN: "t", ANTHROPIC_API_KEY: "k" };

describe("config", () => {
  it("экономные умолчания: Haiku 5.5, effort low", () => {
    const c = loadConfig(env);
    expect(c.model).toBe("claude-haiku-5-5");
    expect(c.effort).toBe("low");
    expect(c.thinkingOff).toBe(false);
    expect(c.maxTokens).toBe(10240);
    expect(c.historyTurns).toBe(3);
    expect(c.dailyLimit).toBe(30);
  });
  it("без токенов не стартует и называет, чего нет", () => {
    expect(() => loadConfig({})).toThrow(/AI_BOT_TOKEN, ANTHROPIC_API_KEY/);
  });
  it("кривое число — понятная ошибка", () => {
    expect(() => loadConfig({ ...env, AI_MAX_TOKENS: "abc" })).toThrow(/AI_MAX_TOKENS/);
  });
  it("парсит .env с кавычками и комментариями", () => {
    const m = parseDotEnv('# c\nA=1\nB="x y"\n\nC');
    expect([...m]).toEqual([["A", "1"], ["B", "x y"]]);
  });
});

describe("запрос к Claude", () => {
  it("effort в output_config, без thinking по умолчанию", () => {
    const r = buildRequest(loadConfig(env), [{ user: "привет", assistant: "здравствуй" }], "как дела?");
    expect(r.model).toBe("claude-haiku-5-5");
    expect(r.output_config).toEqual({ effort: "low" });
    expect(r.thinking).toBeUndefined();
    expect(r.messages.map((m) => m.role)).toEqual(["user", "assistant", "user"]);
    expect(r.messages.at(-1)?.content).toBe("как дела?");
  });
  it("AI_THINKING=off выключает размышление", () => {
    const r = buildRequest(loadConfig({ ...env, AI_THINKING: "off" }), [], "x");
    expect(r.thinking).toEqual({ type: "disabled" });
  });
});

describe("память", () => {
  it("держит только последние N пар и забывает по тишине", () => {
    let now = 0;
    const h = new History(2, 1000, () => now);
    for (const n of [1, 2, 3]) h.add(1, { user: `q${n}`, assistant: `a${n}` });
    expect(h.get(1).map((t) => t.user)).toEqual(["q2", "q3"]);
    now = 2000;
    expect(h.get(1)).toEqual([]);
  });
  it("historyTurns=0 — без памяти", () => {
    const h = new History(0, 1000);
    h.add(1, { user: "q", assistant: "a" });
    expect(h.get(1)).toEqual([]);
  });
});

describe("лимит", () => {
  it("считает по человеку и обнуляется в полночь по Москве", () => {
    let now = Date.parse("2026-11-24T20:00:00Z"); // 23:00 МСК
    const u = new Usage(2, () => now);
    u.record(7, 10, 5);
    u.record(7, 10, 5);
    expect(u.left(7)).toBe(0);
    expect(u.left(7, true)).toBe(Infinity);
    now = Date.parse("2026-11-24T21:00:01Z"); // 00:00 МСК
    expect(moscowDay(now)).toBe("2026-11-25");
    expect(u.left(7)).toBe(2);
  });
});

describe("splitForTelegram", () => {
  it("режет длинный текст по строкам не длиннее лимита", () => {
    const text = Array.from({ length: 50 }, (_, i) => `строка ${i} `.repeat(5)).join("\n");
    const parts = splitForTelegram(text, 300);
    expect(parts.every((p) => p.length <= 300)).toBe(true);
    expect(parts.join("\n")).toBe(text);
  });
});

describe("replyText", () => {
  it("пустой ответ с обрывом — честно про длину, а не «переформулируй»", () => {
    expect(replyText({ text: "", cut: true })).toMatch(/слишком большая/);
    expect(replyText({ text: "", cut: false })).toMatch(/переформулировать/);
    expect(replyText({ text: "код", cut: true })).toMatch(/^код…\n\n\(ответ упёрся/);
    expect(replyText({ text: "ок", cut: false })).toBe("ок");
  });
});
