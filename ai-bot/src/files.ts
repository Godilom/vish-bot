/**
 * Файлы от человека → блоки для Claude. Ради экономии:
 *  • фото берётся из размеров Telegram не больше AI_PHOTO_MAX_PX по длинной стороне
 *    (картинка стоит ⌈ш/28⌉ × ⌈в/28⌉ токенов: 1280×960 ≈ 1600 токенов);
 *  • PDF — не больше AI_MAX_PDF_PAGES страниц (страница ≈ 1500–3000 токенов);
 *  • текстовый файл обрезается до AI_MAX_FILE_CHARS символов;
 *  • сам файл в историю не попадает: в памяти остаётся только «[файл: имя]» и ответ.
 */
import type Anthropic from "@anthropic-ai/sdk";
import { PDFDocument } from "pdf-lib";

export const IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"] as const;
export type ImageType = (typeof IMAGE_TYPES)[number];

const TEXT_EXT = new Set([
  "txt", "md", "csv", "tsv", "json", "xml", "yaml", "yml", "html", "htm", "css", "js", "ts", "py", "java",
  "c", "h", "cpp", "hpp", "cs", "go", "rs", "rb", "php", "sh", "sql", "ini", "toml", "log", "tex", "kt", "swift",
]);
const IMAGE_EXT: Record<string, ImageType> = { jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", gif: "image/gif", webp: "image/webp" };

export type FileKind = { kind: "image"; mediaType: ImageType } | { kind: "pdf" } | { kind: "text" } | { kind: "unsupported" };

function ext(name: string): string {
  const i = name.lastIndexOf(".");
  return i < 0 ? "" : name.slice(i + 1).toLowerCase();
}

/** Что за файл — по типу от Telegram, а если его нет — по расширению. */
export function classify(fileName: string, mime: string | undefined): FileKind {
  const m = (mime ?? "").toLowerCase();
  const e = ext(fileName);
  if ((IMAGE_TYPES as readonly string[]).includes(m)) return { kind: "image", mediaType: m as ImageType };
  if (IMAGE_EXT[e]) return { kind: "image", mediaType: IMAGE_EXT[e] };
  if (m === "application/pdf" || e === "pdf") return { kind: "pdf" };
  if (m.startsWith("text/") || TEXT_EXT.has(e) || m === "application/json" || m === "application/xml") return { kind: "text" };
  return { kind: "unsupported" };
}

export interface PhotoSize {
  file_id: string;
  width: number;
  height: number;
  file_size?: number;
}

/** Самый крупный размер фото, у которого длинная сторона не больше maxPx (или самый маленький). */
export function pickPhoto(sizes: PhotoSize[], maxPx: number): PhotoSize | undefined {
  const sorted = [...sizes].sort((a, b) => a.width * a.height - b.width * b.height);
  const fit = sorted.filter((s) => Math.max(s.width, s.height) <= maxPx);
  return fit.at(-1) ?? sorted[0];
}

export async function pdfPages(data: Uint8Array): Promise<number> {
  const doc = await PDFDocument.load(data, { ignoreEncryption: true, updateMetadata: false });
  return doc.getPageCount();
}

/** Текст файла: UTF-8, без нулевых байтов, не длиннее maxChars. */
export function decodeText(data: Uint8Array, maxChars: number): { text: string; cut: boolean } | undefined {
  const text = new TextDecoder("utf-8", { fatal: false }).decode(data);
  if (text.includes("\u0000")) return undefined; // это не текст
  return text.length > maxChars ? { text: text.slice(0, maxChars), cut: true } : { text, cut: false };
}

export type FileBlock = Anthropic.ImageBlockParam | Anthropic.DocumentBlockParam;

export function imageBlock(data: Uint8Array, mediaType: ImageType): FileBlock {
  return { type: "image", source: { type: "base64", media_type: mediaType, data: Buffer.from(data).toString("base64") } };
}

export function pdfBlock(data: Uint8Array): FileBlock {
  return { type: "document", source: { type: "base64", media_type: "application/pdf", data: Buffer.from(data).toString("base64") } };
}

export function textBlock(fileName: string, text: string, cut: boolean): FileBlock {
  return {
    type: "document",
    title: fileName.slice(0, 200),
    source: { type: "text", media_type: "text/plain", data: cut ? `${text}\n…[файл обрезан]` : text },
  };
}

/** Скачивает файл из Telegram. Токен бота в логи не попадает: ошибка — только код. */
export async function downloadTelegramFile(botToken: string, filePath: string, maxBytes: number): Promise<Uint8Array> {
  const res = await fetch(`https://api.telegram.org/file/bot${botToken}/${filePath}`);
  if (!res.ok) throw new Error(`telegram file: HTTP ${res.status}`);
  const buf = new Uint8Array(await res.arrayBuffer());
  if (buf.byteLength > maxBytes) throw new Error("telegram file: too large");
  return buf;
}
