/**
 * Один вызов Claude на одно сообщение. Ради экономии:
 *  • Haiku 5.5 и effort low — самая дешёвая связка (effort задаётся явно:
 *    у Haiku 5.5 умолчание medium);
 *  • короткий системный промпт и несколько последних пар вместо всей переписки;
 *  • потолок max_tokens 10240: размышление считается туда же, и на большой задаче (лаба из PDF) 1024 целиком уходили на размышление — ответ был пустым;
 *  • кеш промптов не включён: у Haiku 5.5 кешируется префикс от 512 токенов, а
 *    наш промпт с короткой историей короче, и окно истории сдвигается, так что
 *    запись в кеш (×1,25) почти никогда не окупится чтением.
 */
import Anthropic from "@anthropic-ai/sdk";
import type { Config } from "./config.js";
import type { FileBlock } from "./files.js";
import type { Turn } from "./memory.js";

export const SYSTEM = [
  "Ты ВИШ AI, помощник студентов Высшей инженерной школы ЧувГУ в Telegram.",
  "Отвечай по-русски, коротко и по делу: обычно 1–5 предложений, без вступлений и повторов вопроса.",
  "Длиннее — только если просят подробно или нужен код.",
  "Форматирование простое: без таблиц и заголовков, списки — короткие.",
  "Расписание, новости и данные ВИШ ты не видишь; за ними — в основной бот ВИШбот.",
  "Если не знаешь — так и скажи, не выдумывай.",
].join("\n");

export const REFUSAL_TEXT = "С этим я помочь не могу. Попробуй спросить иначе.";

export interface Reply {
  text: string;
  inputTokens: number;
  outputTokens: number;
  /** Ответ упёрся в max_tokens и обрезан. */
  cut: boolean;
  refused: boolean;
}

export function buildMessages(history: Turn[], question: string, files: FileBlock[] = []): Anthropic.MessageParam[] {
  const out: Anthropic.MessageParam[] = [];
  for (const t of history) {
    out.push({ role: "user", content: t.user }, { role: "assistant", content: t.assistant });
  }
  // Файл — перед вопросом, как советует документация.
  out.push({ role: "user", content: files.length ? [...files, { type: "text", text: question }] : question });
  return out;
}

export function buildRequest(cfg: Config, history: Turn[], question: string, files: FileBlock[] = []): Anthropic.MessageCreateParamsNonStreaming {
  return {
    model: cfg.model,
    max_tokens: cfg.maxTokens,
    system: SYSTEM,
    ...(cfg.thinkingOff ? { thinking: { type: "disabled" as const } } : {}),
    output_config: { effort: cfg.effort },
    messages: buildMessages(history, question, files),
  };
}

export class Claude {
  private readonly client: Anthropic;

  constructor(private readonly cfg: Config) {
    // Повторы SDK (429/5xx) оставлены по умолчанию — 2 попытки. Таймаут 3 минуты:
    // ответ до 10240 токенов Haiku пишет дольше минуты.
    this.client = new Anthropic({ apiKey: cfg.anthropicKey, timeout: 180_000 });
  }

  async reply(history: Turn[], question: string, files: FileBlock[] = []): Promise<Reply> {
    const msg = await this.client.messages.create(buildRequest(this.cfg, history, question, files));
    const inputTokens = msg.usage.input_tokens + (msg.usage.cache_read_input_tokens ?? 0) + (msg.usage.cache_creation_input_tokens ?? 0);
    const outputTokens = msg.usage.output_tokens;
    if (msg.stop_reason === "refusal") return { text: REFUSAL_TEXT, inputTokens, outputTokens, cut: false, refused: true };
    // Ответ может начинаться с блоков thinking — берём только текст.
    const text = msg.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("\n")
      .trim();
    return { text, inputTokens, outputTokens, cut: msg.stop_reason === "max_tokens", refused: false };
  }
}

/** Цена в долларах по тарифу Haiku 5.5 для промптов до 100K токенов: $0.10 / $0.50 за 1M. */
export function costUsd(inputTokens: number, outputTokens: number): number {
  return (inputTokens * 0.1 + outputTokens * 0.5) / 1_000_000;
}
