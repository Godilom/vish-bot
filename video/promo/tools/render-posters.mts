/**
 * Картинки расписания для ролика — тем же кодом, что рисует бот (src/render).
 * Расписание придумано для ролика: группа ВИШ-14-24, четверг 26 ноября 2026,
 * 13-я (нечётная) неделя.
 *
 * Запуск из корня репозитория (нужен `npm ci` в корне):
 *   npx tsx video/promo/tools/render-posters.mts
 * Картинки ложатся в video/promo/public/posters.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { createThemedRenderer, THEMES, groupsAsLabel } from "../../../src/render/themes.js";
import { personGroup, type LogicalGroup } from "../../../src/schedule/groups.js";
import type { Occurrence } from "../../../src/schedule/model.js";
import type { MarkedLesson } from "../../../src/schedule/format.js";
import { addDays, wallClock, type LocalDate } from "../../../src/time.js";

const OUT = "video/promo/public/posters";
mkdirSync(OUT, { recursive: true });

const mkGroup = (n: number): LogicalGroup => ({ key: `ВИШ-${n}-24`, title: `ВИШ-${n}-24`, prefix: "ВИШ", number: n, intake: 24, course: 3, portalIds: [], portalNames: [] });
const group = mkGroup(14);
const STREAM = [11, 12, 13, 14].map(mkGroup);

const TODAY: LocalDate = "2026-11-26";
const MONDAY: LocalDate = "2026-11-23";
// Четверг, 10:15 МСК — идёт 2-я пара
const now = wallClock(new Date("2026-11-26T07:15:00Z"));
const weekInfo = { week: 13, parity: "odd" as const, semester: 1 };

const SLOT: Record<number, [number, number]> = { 1: [500, 580], 2: [590, 670], 3: [700, 780], 4: [810, 890], 5: [900, 980] };
const PETROV = "Петров Кирилл Алексеевич";

function lesson(date: LocalDate, slot: number, subject: string, type: string, room: string | null, teacher: string, extra: Partial<Occurrence> = {}): Occurrence {
  const [start, end] = SLOT[slot]!;
  return { groupKey: group.key, period: 1, date, slot, start, end, subject, type, room, teacher, subgroup: null, isDistance: false, status: "scheduled", sources: [group.title], ...extra };
}

// Неделя группы: пн–сб
const week: Occurrence[] = [
  lesson("2026-11-23", 1, "Математический анализ", "лк", "208", "Иванова Дарья Андреевна"),
  lesson("2026-11-23", 2, "Программирование", "лк", "208", PETROV),
  lesson("2026-11-23", 3, "Английский язык", "пр", "115", "Кузнецова Анна Сергеевна"),
  lesson("2026-11-24", 2, "Физика", "лк", "301", "Смирнов Андрей Павлович"),
  lesson("2026-11-24", 3, "Дискретная математика", "пр", "305", PETROV),
  lesson("2026-11-24", 4, "История России", "лк", "208", "Орлова Мария Ивановна"),
  lesson("2026-11-25", 1, "Математический анализ", "пр", "305", "Иванова Дарья Андреевна"),
  lesson("2026-11-25", 2, "Базы данных", "лк", null, "Волков Сергей Николаевич", { isDistance: true }),
  lesson("2026-11-26", 1, "Математический анализ", "лк", "208", "Иванова Дарья Андреевна"),
  lesson("2026-11-26", 2, "Физика", "пр", "305", "Смирнов Андрей Павлович"),
  lesson("2026-11-26", 3, "Программирование", "лб", "412", PETROV),
  lesson("2026-11-27", 1, "Дискретная математика", "лк", "208", PETROV),
  lesson("2026-11-27", 2, "Английский язык", "пр", "115", "Кузнецова Анна Сергеевна"),
  lesson("2026-11-27", 3, "Физика", "лб", "301", "Смирнов Андрей Павлович"),
  lesson("2026-11-28", 1, "Базы данных", "лб", "412", "Волков Сергей Николаевич"),
  lesson("2026-11-28", 2, "Физическая культура", "пр", "Спортзал", "Лебедев Игорь Олегович"),
];
const on = (d: LocalDate) => week.filter((o) => o.date === d);
const byDate = new Map<LocalDate, Occurrence[]>();
for (let i = 0; i < 6; i++) byDate.set(addDays(MONDAY, i), on(addDays(MONDAY, i)));

// Изменения на сегодня: аудитория 2-й пары, отмена 3-й
const changed: MarkedLesson[] = on(TODAY).map((o) => {
  if (o.slot === 2) return { ...o, room: "412", substituted: { room: "305" }, mark: { kind: "changed", note: "ауд. 305 → 412" } };
  if (o.slot === 3) return { ...o, mark: { kind: "cancelled", note: "" } };
  return o;
});

// Поток 2024 на сегодня
const streamRows = [
  { slot: 1, subject: "Математический анализ", type: "лк", room: "208", teacher: "Иванова Дарья Андреевна", groups: ["ВИШ-11-24", "ВИШ-12-24", "ВИШ-13-24", "ВИШ-14-24"] },
  { slot: 2, subject: "Физика", type: "пр", room: "305", teacher: "Смирнов Андрей Павлович", groups: ["ВИШ-14-24"] },
  { slot: 2, subject: "Программирование", type: "лб", room: "412", teacher: PETROV, groups: ["ВИШ-11-24", "ВИШ-12-24"] },
  { slot: 3, subject: "Программирование", type: "лб", room: "412", teacher: PETROV, groups: ["ВИШ-14-24"] },
  { slot: 3, subject: "Английский язык", type: "пр", room: "115", teacher: "Кузнецова Анна Сергеевна", groups: ["ВИШ-13-24"] },
].map((r) => ({ ...r, start: SLOT[r.slot]![0], end: SLOT[r.slot]![1], isDistance: false, subgroup: null, status: "scheduled" as const, mine: r.groups.includes(group.title) }));

// Преподаватель: его пары сегодня, в строке — группы
const petrovToday: Occurrence[] = [
  { ...lesson(TODAY, 2, "Программирование", "лб", "412", PETROV), groups: ["ВИШ-11-24", "ВИШ-12-24"] },
  { ...lesson(TODAY, 3, "Программирование", "лб", "412", PETROV), groups: ["ВИШ-14-24"] },
  { ...lesson(TODAY, 4, "Дискретная математика", "лк", "208", PETROV), groups: ["ВИШ-11-24", "ВИШ-12-24", "ВИШ-13-24"] },
].map(groupsAsLabel);

const write = (name: string, png: Buffer) => {
  writeFileSync(`${OUT}/${name}.png`, png);
  console.log(`${OUT}/${name}.png`);
};

for (const theme of THEMES) {
  const r = (await createThemedRenderer(theme))!;
  write(`day-today-${theme}`, await r.renderDay({ group, date: TODAY, lessons: on(TODAY), weekInfo, today: TODAY, now }));
}
const r = (await createThemedRenderer("midnight"))!;
write("day-tomorrow", await r.renderDay({ group, date: addDays(TODAY, 1), lessons: on(addDays(TODAY, 1)), weekInfo, today: TODAY, now }));
write("week", await r.renderWeek({ group, monday: MONDAY, byDate, weekInfo, today: TODAY, subgroup: null }));
write("stream", await r.renderStreamDay({ intake: 24, date: TODAY, rows: streamRows, weekInfo, today: TODAY, now }));
write("changes-today", await r.renderDay({ group, date: TODAY, lessons: changed, weekInfo, today: TODAY, now, banner: { text: "ИЗМЕНЕНИЯ НА СЕГОДНЯ", tone: "urgent" } }));
write("student-belyaev", await r.renderDay({ group: personGroup("Беляев В.", "s:belyaev"), date: TODAY, lessons: on(TODAY), weekInfo, today: TODAY, now }));
write("teacher-petrov", await r.renderDay({ group: personGroup("Петров К. А.", "t:petrov"), date: TODAY, lessons: petrovToday, weekInfo, today: TODAY, now, labels: "groups" }));
