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
