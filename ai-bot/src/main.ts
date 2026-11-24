/**
 * ВИШ AI: тонкий чат-бот поверх Claude. Только личные сообщения, только текст.
 * В логах — только id и цифры, без текста сообщений (репозиторий публичный).
 */
import { Bot, type Context } from "grammy";
import { Claude, costUsd } from "./claude.js";
import { loadConfig, loadDotEnv } from "./config.js";
import { History, Usage } from "./memory.js";
import { splitForTelegram } from "./text.js";


function log(event: string, data: Record<string, number | string | boolean> = {}): void {
  console.log(JSON.stringify({ t: new Date().toISOString(), event, ...data }));
}

async function main(): Promise<void> {
  loadDotEnv();
  const cfg = loadConfig();
  const claude = new Claude(cfg);
  const history = new History(cfg.historyTurns, cfg.historyTtlMin * 60_000);
  const usage = new Usage(cfg.dailyLimit);
  const bot = new Bot(cfg.botToken);
  const busy = new Set<number>();

  const allowed = (ctx: Context): boolean => {
    const id = ctx.from?.id;
    if (id === undefined) return false;
    return cfg.allowedIds.size === 0 || cfg.allowedIds.has(id) || cfg.adminIds.has(id);
  };

  bot.chatType("private").command("start", async (ctx) => {
    if (!allowed(ctx)) return;
    await ctx.reply("Привет! Я ВИШ AI. Напиши вопрос обычным сообщением.\n/new — начать разговор заново.");
  });

  bot.chatType("private").command("new", async (ctx) => {
    if (!allowed(ctx)) return;
    history.reset(ctx.chat.id);
    await ctx.reply("Начали заново: прошлый разговор я забыл.");
  });

  bot.chatType("private").command("usage", async (ctx) => {
    if (!cfg.adminIds.has(ctx.from.id)) return;
    const u = usage.today();
    await ctx.reply(
      `Сегодня (${u.day}): ${u.requests} ответов, ${u.users} чел.\n` +
        `Токены: вход ${u.inputTokens}, выход ${u.outputTokens}\n` +
        `≈ $${costUsd(u.inputTokens, u.outputTokens).toFixed(4)}`,
    );
  });

  bot.chatType("private").on("message:text", async (ctx) => {
    if (!allowed(ctx)) return;
    const text = ctx.message.text.trim();
    if (!text || text.startsWith("/")) return;
    const userId = ctx.from.id;
    const chatId = ctx.chat.id;

    // Одно сообщение за раз: пока бот думает, второе не тратит деньги.
    if (busy.has(chatId)) {
      await ctx.reply("Ещё думаю над прошлым вопросом, подожди пару секунд.");
      return;
    }
    if (usage.left(userId, cfg.adminIds.has(userId)) <= 0) {
      await ctx.reply(`На сегодня лимит (${cfg.dailyLimit} сообщений) исчерпан. Продолжим завтра.`);
      return;
    }

    const question = text.length > cfg.maxInputChars ? `${text.slice(0, cfg.maxInputChars)}…` : text;
    busy.add(chatId);
    const typing = setInterval(() => void ctx.replyWithChatAction("typing").catch(() => {}), 4500);
    void ctx.replyWithChatAction("typing").catch(() => {});
    const started = Date.now();
    try {
      const r = await claude.reply(history.get(chatId), question);
      usage.record(userId, r.inputTokens, r.outputTokens);
      log("reply", { user: userId, in: r.inputTokens, out: r.outputTokens, ms: Date.now() - started, cut: r.cut, refused: r.refused });
      const answer = (r.text || "Не получилось ответить, попробуй переформулировать.") + (r.cut ? "…" : "");
      if (!r.refused && r.text) history.add(chatId, { user: question, assistant: r.text });
      for (const part of splitForTelegram(answer)) await ctx.reply(part);
    } catch (err) {
      const status = (err as { status?: number }).status ?? 0;
      log("error", { user: userId, status, ms: Date.now() - started });
      await ctx.reply("Сейчас не получается ответить. Попробуй чуть позже.").catch(() => {});
    } finally {
      clearInterval(typing);
      busy.delete(chatId);
    }
  });

  bot.catch((err) => log("bot_error", { name: err.error instanceof Error ? err.error.name : "unknown" }));
  setInterval(() => history.sweep(), 10 * 60_000).unref();

  const stop = (): void => void bot.stop();
  process.once("SIGINT", stop);
  process.once("SIGTERM", stop);

  log("start", { model: cfg.model, effort: cfg.effort, thinking: cfg.thinkingOff ? "off" : "adaptive", maxTokens: cfg.maxTokens, history: cfg.historyTurns });
  await bot.start({ allowed_updates: ["message"], drop_pending_updates: true });
}

main().catch((err) => {
  console.error("fatal:", err instanceof Error ? err.message : err);
  process.exit(1);
});
