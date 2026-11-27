/**
 * Короткая память разговора и суточный лимит — в оперативной памяти процесса.
 * После перезапуска сервера всё обнуляется: это сознательно, хранить переписку
 * на диске не нужно. Когда бот подключится к общей базе с ВИШботом, лимиты
 * переедут туда.
 */

export interface Turn {
  user: string;
  assistant: string;
}

interface Dialog {
  turns: Turn[];
  lastAt: number;
}

export class History {
  private readonly dialogs = new Map<number, Dialog>();

  constructor(
    private readonly maxTurns: number,
    private readonly ttlMs: number,
    private readonly now: () => number = Date.now,
  ) {}

  /** Последние пары «вопрос — ответ» этого чата; устаревший разговор забывается. */
  get(chatId: number): Turn[] {
    const d = this.dialogs.get(chatId);
    if (!d) return [];
    if (this.now() - d.lastAt > this.ttlMs) {
      this.dialogs.delete(chatId);
      return [];
    }
    return d.turns;
  }

  add(chatId: number, turn: Turn): void {
    if (this.maxTurns === 0) return;
    const turns = [...this.get(chatId), turn].slice(-this.maxTurns);
    this.dialogs.set(chatId, { turns, lastAt: this.now() });
  }

  reset(chatId: number): void {
    this.dialogs.delete(chatId);
  }

  /** Убирает старые разговоры, чтобы память процесса не росла. */
  sweep(): void {
    const t = this.now();
    for (const [id, d] of this.dialogs) if (t - d.lastAt > this.ttlMs) this.dialogs.delete(id);
  }
}

/** Дата по Москве: лимит обновляется в полночь по Москве. */
export function moscowDay(ms: number): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Moscow" }).format(new Date(ms));
}

export interface DayUsage {
  requests: number;
  inputTokens: number;
  outputTokens: number;
}

export class Usage {
  private day = "";
  private readonly perUser = new Map<number, number>();
  private readonly perUserFiles = new Map<number, number>();
  private total: DayUsage = { requests: 0, inputTokens: 0, outputTokens: 0 };

  constructor(
    private readonly dailyLimit: number,
    private readonly now: () => number = Date.now,
    private readonly dailyFileLimit = 0,
  ) {}

  private roll(): void {
    const d = moscowDay(this.now());
    if (d !== this.day) {
      this.day = d;
      this.perUser.clear();
      this.perUserFiles.clear();
      this.total = { requests: 0, inputTokens: 0, outputTokens: 0 };
    }
  }

  /** Сколько сообщений человеку осталось сегодня (Infinity — без лимита). */
  left(userId: number, unlimited = false): number {
    this.roll();
    if (unlimited || this.dailyLimit === 0) return Infinity;
    return Math.max(0, this.dailyLimit - (this.perUser.get(userId) ?? 0));
  }

  /** Сколько файлов человеку осталось сегодня (Infinity — без лимита). */
  filesLeft(userId: number, unlimited = false): number {
    this.roll();
    if (unlimited) return Infinity;
    return Math.max(0, this.dailyFileLimit - (this.perUserFiles.get(userId) ?? 0));
  }

  record(userId: number, inputTokens: number, outputTokens: number, file = false): void {
    this.roll();
    this.perUser.set(userId, (this.perUser.get(userId) ?? 0) + 1);
    if (file) this.perUserFiles.set(userId, (this.perUserFiles.get(userId) ?? 0) + 1);
    this.total.requests += 1;
    this.total.inputTokens += inputTokens;
    this.total.outputTokens += outputTokens;
  }

  today(): DayUsage & { day: string; users: number } {
    this.roll();
    return { ...this.total, day: this.day, users: this.perUser.size };
  }
}
