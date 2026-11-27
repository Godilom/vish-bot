import React from 'react';
import { B, Chat, type Btn, type ChatScript, type Rows } from '../ui/Chat';
import { PhoneScene } from '../ui/Stage';
import { LOOK_TEXT, SETTINGS_TEXT, lookKb, mainMenu, ownMenu, settingsKb } from '../data';

export const S9_DURATION = 170;

const T_BACK = 12;
const T_MENU = 34;
const T_BUTTONS = 56;
const ADD = { groups: 78, teachers: 96, stream: 114 };
const T_DONE = 136;

const MENU_TEXT = (
  <>
    <B>⌨️ Нижнее меню</B>
    {'\n\n'}✅ <B>сворачивается</B> — кнопки внизу, а значком ▦ в поле ввода их можно свернуть и развернуть
    {'\n'}▫️ <B>сворачивать после нажатия</B> — нажал кнопку — меню само свернулось; вернуть его — тем же значком ▦
    {'\n'}▫️ <B>скрыто</B> — кнопок внизу нет; всё есть в кнопке «Меню» слева от поля ввода (/today, /week, /settings…), вернуть кнопки — /menu
    {'\n\n'}🧩 Кнопки внизу — собрать своё меню из любых разделов.
  </>
);

const buttonsText = (n: number) => (
  <>
    <B>🧩 Кнопки внизу</B>
    {'\n\n'}Нажми, чтобы добавить (➕) или убрать (✅). Кнопки встают по порядку этого списка, по 3 в ряд.
    {'\n'}Выбрано: <B>{n}</B>
    {n === 6 ? ' — как у всех' : ''}. «🗂 Ещё» или «⚙️ Настройки» остаётся хотя бы одна: через них меню возвращают.
  </>
);

// MENU_CHOICES по 2 в ряд (поиск студента и ИИ включены)
const CHOICES = ['📅 Сегодня', '📅 Завтра', '🗓 Неделя', '🔍 Найти с ИИ', '🔔 Изменения', '📋 Пересдачи', '📆 Календарь', '👥 Др. группы', '👨‍🏫 Где препод', '🕵️ Где студент', '🎓 Поток', '💬 Спросить ИИ', '⚙️ Настройки', '❓ Как пользоваться', '🗂 Ещё', '🙋 Поддержка'];
const DEFAULT = new Set(['📅 Сегодня', '📅 Завтра', '🗓 Неделя', '🔍 Найти с ИИ', '🗂 Ещё', '🙋 Поддержка']);

function buttonsKb(picked: Set<string>, taps: Record<string, number>): Rows {
  const rows: Rows = [];
  CHOICES.forEach((c, i) => {
    const b: Btn = { t: `${picked.has(c) ? '✅' : '➕'} ${c}`, tap: taps[c] };
    if (i % 2 === 0) rows.push([b]);
    else rows[rows.length - 1].push(b);
  });
  rows.push([{ t: '👌 Готово — обновить меню', tap: taps.done }]);
  rows.push([{ t: '↩️ Как было' }, { t: '◀️ Назад' }]);
  return rows;
}

const step = (extra: string[], taps: Record<string, number>) => ({ text: buttonsText(6 + extra.length), kb: buttonsKb(new Set([...DEFAULT, ...extra]), taps) });

const script: ChatScript = {
  msgs: [
    {
      from: 'bot',
      at: -1,
      text: LOOK_TEXT,
      kb: lookKb('текст', 'Лента', { back: T_BACK }),
      edits: [
        { at: T_BACK + 4, text: SETTINGS_TEXT, kb: settingsKb({ menu: T_MENU }, 'лента', 'текст') },
        { at: T_MENU + 4, text: MENU_TEXT, kb: [[{ t: '✅ Сворачивается' }], [{ t: 'Сворачивать после нажатия' }], [{ t: 'Скрыто' }], [{ t: '🧩 Кнопки внизу: как у всех', tap: T_BUTTONS }], [{ t: '◀️ Назад' }]] },
        { at: T_BUTTONS + 4, ...step([], { '👥 Др. группы': ADD.groups }) },
        { at: ADD.groups + 3, ...step(['👥 Др. группы'], { '👨‍🏫 Где препод': ADD.teachers }) },
        { at: ADD.teachers + 3, ...step(['👥 Др. группы', '👨‍🏫 Где препод'], { '🎓 Поток': ADD.stream }) },
        { at: ADD.stream + 3, ...step(['👥 Др. группы', '👨‍🏫 Где препод', '🎓 Поток'], { done: T_DONE }) },
      ],
    },
    { from: 'bot', at: T_DONE + 8, text: 'Готово: меню внизу 👇 Вернуть как было — ⚙️ Настройки → ⌨️ Нижнее меню → 🧩 Кнопки внизу → ↩️ Как было.' },
  ],
  replyKb: [
    { at: -100, rows: mainMenu() },
    { at: T_DONE + 8, rows: ownMenu(true) },
  ],
  toasts: [
    { at: ADD.groups + 1, text: 'Добавил: 👥 Др. группы. Нажми «Готово», чтобы обновить меню.', dur: 17 },
    { at: ADD.teachers + 1, text: 'Добавил: 👨‍🏫 Где препод. Нажми «Готово», чтобы обновить меню.', dur: 17 },
    { at: ADD.stream + 1, text: 'Добавил: 🎓 Поток. Нажми «Готово», чтобы обновить меню.', dur: 20 },
  ],
};

export const S9Buttons: React.FC = () => (
  <PhoneScene
    caps={[
      { from: 0, to: T_DONE + 4, text: 'Нужные кнопки — вниз' },
      { from: T_DONE + 4, to: S9_DURATION, text: 'Своё меню 3 × 3' },
    ]}
  >
    <Chat script={script} />
  </PhoneScene>
);
