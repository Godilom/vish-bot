/**
 * ВИШ AI: тонкий чат-бот поверх Claude. Только личные сообщения: текст, фото,
 * PDF и текстовые файлы.
 * В логах — только id и цифры, без текста сообщений (репозиторий публичный).
 */
import { Bot, type Context } from "grammy";
import { Claude, costUsd } from "./claude.js";
import { loadConfig, loadDotEnv } from "./config.js";
import { classify, decodeText, downloadTelegramFile, imageBlock, pdfBlock, pdfPages, pickPhoto, textBlock, type FileBlock } from "./files.js";
import { History, Usage } from "./memory.js";
import { replyText, splitForTelegram } from "./text.js";

function log(event: string, data: Record<string, number | string | boolean> = {}): void {
  console.log(JSON.stringify({ t: new Date().toISOString(), event, ...data }));
}

async function main(): Promise<void> {
  loadDotEnv();
  const cfg = loadConfig();
  const claude = new Claude(cfg);
  const history = new History(cfg.historyTurns, cfg.historyTtlMin * 60_000);
  const usage = new Usage(cfg.dailyLimit, Date.now, cfg.dailyFileLimit);
  const bot = new Bot(cfg.botToken);
  const busy = new Set<number>();

  const allowed = (ctx: Context): boolean => {
    const id = ctx.from?.id;
    if (id === undefined) return false;
    return cfg.allowedIds.size === 0 || cfg.allowedIds.has(id) || cfg.adminIds.has(id);
  };

  bot.chatType("private").command("start", async (ctx) => {
    if (!allowed(ctx)) return;
    await ctx.reply(
      "Привет! Я ВИШ AI. Напиши вопрос обычным сообщением." +
        (cfg.dailyFileLimit > 0 ? `\nМожно прислать фото, PDF (до ${cfg.maxPdfPages} стр.) или текстовый файл, вопрос — в подписи.` : "") +
        "\n/new — начать разговор заново.",
    );
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

  /** Общий путь: проверки, вызов Claude, ответ. load() скачивает файл уже после проверок. */
  async function answer(
    ctx: Context & { from: { id: number }; chat: { id: number } },
    rawQuestion: string,
    file?: { label: string; load: () => Promise<FileBlock | string> },
  ): Promise<void> {
    const userId = ctx.from.id;
    const chatId = ctx.chat.id;
    const admin = cfg.adminIds.has(userId);

    // Одно сообщение за раз: пока бот думает, второе не тратит деньги.
    if (busy.has(chatId)) {
      await ctx.reply("Ещё думаю над прошлым вопросом, подожди пару секунд.");
      return;
    }
    if (usage.left(userId, admin) <= 0) {
      await ctx.reply(`На сегодня лимит (${cfg.dailyLimit} сообщений) исчерпан. Продолжим завтра.`);
      return;
    }
    if (file && usage.filesLeft(userId, admin) <= 0) {
      await ctx.reply(
        cfg.dailyFileLimit === 0 ? "Файлы я пока не читаю, напиши вопрос текстом." : `На сегодня лимит файлов (${cfg.dailyFileLimit}) исчерпан. Текстом спрашивать можно.`,
      );
      return;
    }

    const question = rawQuestion.length > cfg.maxInputChars ? `${rawQuestion.slice(0, cfg.maxInputChars)}…` : rawQuestion;
    busy.add(chatId);
    const typing = setInterval(() => void ctx.replyWithChatAction("typing").catch(() => {}), 4500);
    void ctx.replyWithChatAction("typing").catch(() => {});
    const started = Date.now();
    try {
      const blocks: FileBlock[] = [];
      if (file) {
        const loaded = await file.load();
        if (typeof loaded === "string") {
          await ctx.reply(loaded); // файл не подошёл: объяснение, лимит не тратится
          return;
        }
        blocks.push(loaded);
      }
      const r = await claude.reply(history.get(chatId), question, blocks);
      usage.record(userId, r.inputTokens, r.outputTokens, Boolean(file));
      log("reply", { user: userId, file: file ? file.label.split(":")[0] ?? "file" : "none", in: r.inputTokens, out: r.outputTokens, ms: Date.now() - started, cut: r.cut, refused: r.refused });
      const text = replyText(r);
      // Сам файл в историю не кладём — только пометку: иначе каждый следующий вопрос оплачивал бы его снова.
      if (!r.refused && r.text) history.add(chatId, { user: file ? `[${file.label}] ${question}` : question, assistant: r.text });
      for (const part of splitForTelegram(text)) await ctx.reply(part);
    } catch (err) {
      const status = (err as { status?: number }).status ?? 0;
      log("error", { user: userId, status, ms: Date.now() - started });
      await ctx.reply("Сейчас не получается ответить. Попробуй чуть позже.").catch(() => {});
    } finally {
      clearInterval(typing);
      busy.delete(chatId);
    }
  }

  const maxBytes = cfg.maxFileMb * 1024 * 1024;
  const tooBig = `Файл больше ${cfg.maxFileMb} МБ, такой я не возьму.`;
  const fetchFile = async (fileId: string): Promise<Uint8Array> => {
    const f = await bot.api.getFile(fileId);
    if (!f.file_path) throw new Error("telegram file: no path");
    return downloadTelegramFile(cfg.botToken, f.file_path, maxBytes);
  };
  const DEFAULT_Q = "Что здесь? Кратко.";

  bot.chatType("private").on("message:text", async (ctx) => {
    if (!allowed(ctx)) return;
    const text = ctx.message.text.trim();
    if (!text || text.startsWith("/")) return;
    await answer(ctx, text);
  });

  bot.chatType("private").on("message:photo", async (ctx) => {
    if (!allowed(ctx)) return;
    const photo = pickPhoto(ctx.message.photo, cfg.photoMaxPx);
    if (!photo) return;
    await answer(ctx, ctx.message.caption?.trim() || DEFAULT_Q, {
      label: "фото",
      load: async () => {
        if ((photo.file_size ?? 0) > maxBytes) return tooBig;
        return imageBlock(await fetchFile(photo.file_id), "image/jpeg"); // Telegram пережимает фото в JPEG
      },
    });
  });

  bot.chatType("private").on("message:document", async (ctx) => {
    if (!allowed(ctx)) return;
    const doc = ctx.message.document;
    const name = doc.file_name ?? "файл";
    const kind = classify(name, doc.mime_type);
    if (kind.kind === "unsupported") {
      await ctx.reply("Такой файл я пока не читаю. Пришли PDF, картинку или текстовый файл (.txt, .md, .csv, код).");
      return;
    }
    await answer(ctx, ctx.message.caption?.trim() || DEFAULT_Q, {
      label: `${kind.kind === "image" ? "картинка" : kind.kind === "pdf" ? "PDF" : "файл"}: ${name}`,
      load: async () => {
        if ((doc.file_size ?? 0) > maxBytes) return tooBig;
        const data = await fetchFile(doc.file_id);
        if (kind.kind === "image") return imageBlock(data, kind.mediaType);
        if (kind.kind === "pdf") {
          let pages: number;
          try {
            pages = await pdfPages(data);
          } catch {
            return "Не получилось открыть этот PDF. Может, он повреждён или под паролем?";
          }
          if (pages > cfg.maxPdfPages) return `В PDF ${pages} стр., а я читаю до ${cfg.maxPdfPages}. Пришли нужные страницы отдельным файлом.`;
          return pdfBlock(data);
        }
        const t = decodeText(data, cfg.maxFileChars);
        if (!t) return "Это не похоже на текстовый файл. Пришли PDF, картинку или текст.";
        return textBlock(name, t.text, t.cut);
      },
    });
  });

  bot.catch((err) => log("bot_error", { name: err.error instanceof Error ? err.error.name : "unknown" }));
  setInterval(() => history.sweep(), 10 * 60_000).unref();

  const stop = (): void => void bot.stop();
  process.once("SIGINT", stop);
  process.once("SIGTERM", stop);

  log("start", { model: cfg.model, effort: cfg.effort, thinking: cfg.thinkingOff ? "off" : "adaptive", maxTokens: cfg.maxTokens, history: cfg.historyTurns, files: cfg.dailyFileLimit });
  await bot.start({ allowed_updates: ["message"], drop_pending_updates: true });
}

main().catch((err) => {
  console.error("fatal:", err instanceof Error ? err.message : err);
  process.exit(1);
});
