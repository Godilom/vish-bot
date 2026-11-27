import type { Reply } from "./claude.js";

/**
 * Текст ответа для человека. Пустой ответ с обрывом значит, что модель потратила
 * весь max_tokens на размышление и до текста не дошла: так и говорим, а не
 * «переформулируй».
 */
export function replyText(r: Pick<Reply, "text" | "cut">): string {
  if (r.text) return r.cut ? `${r.text}…\n\n(ответ упёрся в лимит длины)` : r.text;
  if (r.cut) return "Задача слишком большая для одного ответа: я не успел дописать. Разбей её на части, например «сначала только код программы».";
  return "Не получилось ответить, попробуй переформулировать.";
}

/** Telegram принимает не больше 4096 символов в сообщении: режем по строкам. */
const TG_LIMIT = 4096;

export function splitForTelegram(text: string, limit = TG_LIMIT): string[] {
  const parts: string[] = [];
  let rest = text;
  while (rest.length > limit) {
    let cut = rest.lastIndexOf("\n", limit);
    if (cut < limit / 2) cut = limit;
    parts.push(rest.slice(0, cut));
    rest = rest.slice(cut).replace(/^\n/, "");
  }
  if (rest) parts.push(rest);
  return parts;
}
