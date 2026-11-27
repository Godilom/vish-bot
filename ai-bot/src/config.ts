/**
 * Настройки ВИШ AI из окружения (.env на сервере панели).
 * Всё, что влияет на расход денег, вынесено сюда и имеет экономные умолчания.
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

export type Effort = "low" | "medium" | "high";

export interface Config {
  /** Токен бота от @BotFather. */
  botToken: string;
  /** Ключ Anthropic API. */
  anthropicKey: string;
  /** Модель. По ТЗ — Haiku 5.5. */
  model: string;
  /** Глубина размышления: low — дешевле всего. */
  effort: Effort;
  /** true — размышление выключено совсем (ещё дешевле, ответы проще). */
  thinkingOff: boolean;
  /** Потолок токенов на один ответ (размышление считается сюда же). */
  maxTokens: number;
  /** Сколько прошлых пар «вопрос — ответ» бот помнит в разговоре. 0 — без памяти. */
  historyTurns: number;
  /** Память разговора забывается после стольких минут тишины. */
  historyTtlMin: number;
  /** Самое длинное сообщение, которое уходит в модель; длиннее — обрезается. */
  maxInputChars: number;
  /** Сколько сообщений в сутки (по Москве) можно одному человеку. 0 — без лимита. */
  dailyLimit: number;
  /** Сколько файлов в сутки можно одному человеку (входят и в общий лимит сообщений). 0 — файлы выключены. */
  dailyFileLimit: number;
  /** Самый большой файл, который бот скачает, в мегабайтах (Telegram отдаёт ботам до 20). */
  maxFileMb: number;
  /** Сколько страниц PDF можно прислать за раз. */
  maxPdfPages: number;
  /** Сколько символов текстового файла уходит в модель. */
  maxFileChars: number;
  /** Фото берётся в размере не больше стольких пикселей по длинной стороне. */
  photoMaxPx: number;
  /** Если задано — бот отвечает только этим id Telegram. */
  allowedIds: Set<number>;
  /** Админам лимит не мешает, им доступна /usage. */
  adminIds: Set<number>;
}

/** Разбор .env: KEY=value, # комментарии, кавычки вокруг значения. */
export function parseDotEnv(text: string): Map<string, string> {
  const out = new Map<string, string>();
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq < 0) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    out.set(key, value);
  }
  return out;
}

export function loadDotEnv(file = path.resolve(process.cwd(), ".env")): void {
  if (!existsSync(file)) return;
  for (const [key, value] of parseDotEnv(readFileSync(file, "utf8"))) {
    if (process.env[key] === undefined || process.env[key] === "") process.env[key] = value;
  }
}

function int(env: NodeJS.ProcessEnv, key: string, def: number, min: number, max: number): number {
  const raw = env[key]?.trim();
  if (!raw) return def;
  const n = Number(raw);
  if (!Number.isInteger(n) || n < min || n > max) throw new Error(`${key}: нужно целое число от ${min} до ${max}, сейчас «${raw}»`);
  return n;
}

function ids(raw: string | undefined): Set<number> {
  return new Set(
    (raw ?? "")
      .split(/[\s,;]+/)
      .filter(Boolean)
      .map(Number)
      .filter((n) => Number.isSafeInteger(n)),
  );
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const botToken = env.AI_BOT_TOKEN?.trim() ?? "";
  const anthropicKey = env.ANTHROPIC_API_KEY?.trim() ?? "";
  const missing = [!botToken && "AI_BOT_TOKEN", !anthropicKey && "ANTHROPIC_API_KEY"].filter(Boolean);
  if (missing.length) throw new Error(`В .env не заданы: ${missing.join(", ")}`);

  const effort = (env.AI_EFFORT?.trim() || "low") as Effort;
  if (!["low", "medium", "high"].includes(effort)) throw new Error(`AI_EFFORT: low, medium или high, сейчас «${effort}»`);

  return {
    botToken,
    anthropicKey,
    model: env.AI_MODEL?.trim() || "claude-haiku-5-5",
    effort,
    thinkingOff: ["off", "0", "false", "no"].includes((env.AI_THINKING ?? "").trim().toLowerCase()),
    maxTokens: int(env, "AI_MAX_TOKENS", 1024, 128, 16000),
    historyTurns: int(env, "AI_HISTORY_TURNS", 3, 0, 20),
    historyTtlMin: int(env, "AI_HISTORY_TTL_MIN", 30, 1, 24 * 60),
    maxInputChars: int(env, "AI_MAX_INPUT_CHARS", 2000, 100, 20000),
    dailyLimit: int(env, "AI_DAILY_LIMIT", 30, 0, 10000),
    dailyFileLimit: int(env, "AI_DAILY_FILE_LIMIT", 10, 0, 1000),
    maxFileMb: int(env, "AI_MAX_FILE_MB", 10, 1, 20),
    maxPdfPages: int(env, "AI_MAX_PDF_PAGES", 10, 1, 100),
    maxFileChars: int(env, "AI_MAX_FILE_CHARS", 20000, 1000, 200000),
    photoMaxPx: int(env, "AI_PHOTO_MAX_PX", 1280, 200, 2576),
    allowedIds: ids(env.AI_ALLOWED_IDS),
    adminIds: ids(env.AI_ADMIN_IDS),
  };
}
