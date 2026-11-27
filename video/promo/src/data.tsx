import { B, C, I, type Btn, type Rows } from './ui/Chat';

// Подписи и тексты — из src/bot/keyboards.ts, src/bot/handlers/*.ts (ветка main).

/** Нижнее меню 2 × 3 (DEFAULT_MENU); taps — кадр нажатия по подписи. */
export function mainMenu(taps: Record<string, number> = {}): Rows {
  const b = (t: string): Btn => ({ t, tap: taps[t] });
  return [
    [b('📅 Сегодня'), b('📅 Завтра'), b('🗓 Неделя')],
    [b('🔍 Найти с ИИ'), b('🗂 Ещё'), b('🙋 Поддержка')],
  ];
}

/** Своё меню 3 × 3 после «🧩 Кнопки внизу» (порядок MENU_CHOICES). */
export function ownMenu(hl = false, taps: Record<string, number> = {}): Rows {
  const b = (t: string, h = false): Btn => ({ t, hl: h, tap: taps[t] });
  return [
    [b('📅 Сегодня'), b('📅 Завтра'), b('🗓 Неделя')],
    [b('🔍 Найти с ИИ'), b('👥 Др. группы', hl), b('👨‍🏫 Где препод', hl)],
    [b('🎓 Поток', hl), b('🗂 Ещё'), b('🙋 Поддержка')],
  ];
}

export const FIND_TEXT = (
  <>
    🔍 <B>Найти с ИИ</B>
    {'\n\n'}Просто напиши, что ищешь: группу (<C>14-24</C>), преподавателя (<C>Иванова</C>), предмет (<C>матан</C>) или дату (<C>15.10</C>).
    {'\n'}Или выбери:
  </>
);

export function findKb(taps: Record<string, number> = {}): Rows {
  const b = (t: string): Btn => ({ t, tap: taps[t] });
  return [[b('👥 Др. группы'), b('🎓 Поток')], [b('👨‍🏫 Где препод'), b('🕵️ Где студент')], [b('💬 Спросить ИИ')]];
}

export const MORE_TEXT = (
  <>
    🗂 <B>Ещё</B>
  </>
);

export function moreKb(taps: Record<string, number> = {}): Rows {
  const b = (t: string): Btn => ({ t, tap: taps[t] });
  return [[b('🔔 Изменения и объявления')], [b('📆 Календарь телефона')], [b('⚙️ Настройки'), b('❓ Как пользоваться')]];
}

export function dayNav(prev: string, next: string, taps: Record<string, number> = {}): Rows {
  const b = (t: string): Btn => ({ t, tap: taps[t] });
  return [[b(`◀️ ${prev}`), b(`${next} ▶️`)], [b('🗓 Неделя')]];
}

export const SETTINGS_TEXT = (
  <>
    <B>⚙️ Настройки</B>
    {'\n\n'}В подписи раздела видно, что сейчас включено. Нажми, чтобы поменять.
  </>
);

export function settingsKb(taps: Record<string, number> = {}, theme = 'тёмная', format = 'картинка'): Rows {
  const b = (t: string, key?: string): Btn => ({ t, tap: taps[key ?? t] });
  return [
    [b('👥 Группа: ВИШ-14-24')],
    [b('🔔 Что присылать: изменения')],
    [b('⏰ Напоминания: 2 из 4')],
    [b(`🖼 Вид расписания: ${format}, ${theme}`, 'look')],
    [b('⌨️ Нижнее меню: сворачивается', 'menu')],
    [b('✖️ Закрыть')],
  ];
}

export const LOOK_TEXT = (
  <>
    <B>🖼 Вид расписания</B>
    {'\n\n'}🖼 Формат — текстом, картинкой или и так, и так.
    {'\n'}🎨 Оформление — как выглядят картинки: тёмная, журнальная, плакатная или лента.
    {'\n'}👨‍🏫 Преподаватели — кто ведёт пару: «с выделением» — фамилия жирным, «без выделения» — обычным шрифтом, «не показывать» — строка короче.
  </>
);

export function lookKb(format: string, theme: string, taps: Record<string, number> = {}): Rows {
  const b = (t: string, key: string): Btn => ({ t, tap: taps[key] });
  return [[b(`🖼 Формат: ${format}`, 'format')], [b(`🎨 Оформление картинок: ${theme}`, 'theme')], [b('👨‍🏫 Преподаватели: с выделением', 'teacher')], [b('◀️ Назад', 'back')]];
}

/** Текст дня, как его пишет formatDay (формат «текст»). */
export const DAY_TEXT = (
  <>
    <B>Сегодня · Четверг, 26 ноября</B>
    {'\n'}🔶 <B>НЕЧЁТНАЯ</B> · 13-я неделя
    {'\n\n'}1️⃣ <C>08:20–09:40</C> <B>Математический анализ</B>
    {'\n'}
    {'     '}ЛК · ауд. 208 · <B>Иванова Д. А.</B>
    {'\n\n'}2️⃣ <C>09:50–11:10</C> <B>Физика</B> ▶️
    {'\n'}
    {'     '}ПР · ауд. 305 · <B>Смирнов А. П.</B>
    {'\n\n'}3️⃣ <C>11:40–13:00</C> <B>Программирование</B>
    {'\n'}
    {'     '}ЛБ · ауд. 412 · <B>Петров К. А.</B>
    {'\n\n'}3 пары · 08:20–13:00
  </>
);

export const ital = (s: string) => <I>{s}</I>;
