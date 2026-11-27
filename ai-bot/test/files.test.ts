import { PDFDocument } from "pdf-lib";
import { describe, expect, it } from "vitest";
import { buildMessages } from "../src/claude.js";
import { loadConfig } from "../src/config.js";
import { classify, decodeText, imageBlock, pdfPages, pickPhoto, textBlock } from "../src/files.js";
import { Usage } from "../src/memory.js";

describe("classify", () => {
  it("по типу от Telegram и по расширению", () => {
    expect(classify("a.bin", "image/png")).toEqual({ kind: "image", mediaType: "image/png" });
    expect(classify("photo.JPG", undefined)).toEqual({ kind: "image", mediaType: "image/jpeg" });
    expect(classify("lab.pdf", "application/octet-stream")).toEqual({ kind: "pdf" });
    expect(classify("main.py", "application/octet-stream")).toEqual({ kind: "text" });
    expect(classify("notes", "text/plain")).toEqual({ kind: "text" });
    expect(classify("report.docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document")).toEqual({ kind: "unsupported" });
    expect(classify("pic.heic", "image/heic")).toEqual({ kind: "unsupported" });
  });
});

describe("pickPhoto", () => {
  const sizes = [
    { file_id: "s", width: 90, height: 67 },
    { file_id: "m", width: 800, height: 600 },
    { file_id: "x", width: 1280, height: 960 },
    { file_id: "xx", width: 2560, height: 1920 },
  ];
  it("самый крупный, что влезает в лимит", () => {
    expect(pickPhoto(sizes, 1280)?.file_id).toBe("x");
    expect(pickPhoto(sizes, 1000)?.file_id).toBe("m");
  });
  it("ничего не влезает — самый маленький", () => {
    expect(pickPhoto(sizes, 50)?.file_id).toBe("s");
  });
});

describe("decodeText", () => {
  it("обрезает длинный текст и отличает двоичный файл", () => {
    expect(decodeText(new TextEncoder().encode("привет мир"), 6)).toEqual({ text: "привет", cut: true });
    expect(decodeText(new TextEncoder().encode("ок"), 100)).toEqual({ text: "ок", cut: false });
    expect(decodeText(new Uint8Array([0x50, 0x4b, 0x00, 0x01]), 100)).toBeUndefined();
  });
});

describe("pdfPages", () => {
  it("считает страницы", async () => {
    const doc = await PDFDocument.create();
    for (let i = 0; i < 3; i++) doc.addPage();
    expect(await pdfPages(await doc.save())).toBe(3);
  });
  it("не PDF — ошибка", async () => {
    await expect(pdfPages(new TextEncoder().encode("not a pdf"))).rejects.toThrow();
  });
});

describe("сообщение с файлом", () => {
  it("файл перед вопросом, история — текстом", () => {
    const msgs = buildMessages([{ user: "[фото] что это?", assistant: "кот" }], "а цвет?", [imageBlock(new Uint8Array([1, 2, 3]), "image/jpeg")]);
    expect(msgs[0]?.content).toBe("[фото] что это?");
    const last = msgs.at(-1)?.content;
    expect(Array.isArray(last) && last.map((b) => b.type)).toEqual(["image", "text"]);
  });
  it("текстовый файл — документ с названием и пометкой об обрезке", () => {
    const b = textBlock("a.txt", "abc", true);
    expect(b).toMatchObject({ type: "document", title: "a.txt", source: { type: "text", data: "abc\n…[файл обрезан]" } });
  });
});

describe("лимит файлов", () => {
  it("свой счётчик, умолчание 10", () => {
    expect(loadConfig({ AI_BOT_TOKEN: "t", ANTHROPIC_API_KEY: "k" }).dailyFileLimit).toBe(10);
    const u = new Usage(30, () => 0, 1);
    expect(u.filesLeft(5)).toBe(1);
    u.record(5, 100, 10, true);
    expect(u.filesLeft(5)).toBe(0);
    expect(u.left(5)).toBe(29);
    expect(u.filesLeft(5, true)).toBe(Infinity);
  });
});
