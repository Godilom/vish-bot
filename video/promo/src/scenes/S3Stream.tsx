import React from 'react';
import { B, Chat, type ChatScript } from '../ui/Chat';
import { PhoneScene } from '../ui/Stage';
import { FIND_TEXT, findKb, mainMenu } from '../data';

export const S3_DURATION = 190;

const T_FIND = 16;
const T_STREAM = 56;
const T_BACK = 158;

// streamKeyboard: поток, «Где студент» (POISK), настройки и «В меню»
const streamMenu = [
  [{ t: 'Поток: вчера' }, { t: 'Поток: сегодня' }, { t: 'Поток: завтра' }],
  [{ t: 'Поток: неделя' }, { t: '🤝 Общие пары' }],
  [{ t: '🕵️ Где студент' }],
  [{ t: '⚙️ Настройки' }, { t: '◀️ В меню', tap: T_BACK }],
];

const script: ChatScript = {
  msgs: [
    { from: 'bot', at: -1, photo: 'week', kb: [[{ t: '◀️ пред.' }, { t: 'текущая' }, { t: 'след. ▶️' }], [{ t: '📅 День' }, { t: '📆 В календарь' }]] },
    { from: 'user', at: T_FIND + 4, text: '🔍 Найти с ИИ' },
    { from: 'bot', at: T_FIND + 12, text: FIND_TEXT, kb: findKb({ '🎓 Поток': T_STREAM }) },
    {
      from: 'bot',
      at: T_STREAM + 10,
      text: (
        <>
          🎓 <B>Режим потока</B>
          {'\n'}Поток 2024: 11-24, 12-24, 13-24, 14-24.
          {'\n\n'}Кнопки внизу показывают весь поток сразу. «Общие пары» — лекции, где твоя группа сидит вместе с другими. Сменить поток можно здесь:
        </>
      ),
      kb: [[{ t: '2022' }, { t: '2023' }, { t: '✅ 2024' }, { t: '2025' }, { t: '2026' }]],
    },
    { from: 'bot', at: T_STREAM + 20, text: 'Поток открыт. Вернуться: «◀️ В меню».' },
    {
      from: 'bot',
      at: T_STREAM + 30,
      photo: 'stream',
      kb: [[{ t: '◀️ 25.11' }, { t: '27.11 ▶️' }], [{ t: '11' }, { t: '12' }, { t: '13' }, { t: '14' }]],
    },
    { from: 'user', at: T_BACK + 4, text: '◀️ В меню' },
    { from: 'bot', at: T_BACK + 12, text: 'Главное меню.' },
  ],
  replyKb: [
    { at: -100, rows: mainMenu({ '🔍 Найти с ИИ': T_FIND }) },
    { at: T_STREAM + 20, rows: streamMenu },
    { at: T_BACK + 12, rows: mainMenu() },
  ],
};

export const S3Stream: React.FC = () => (
  <PhoneScene
    caps={[
      { from: 0, to: T_STREAM + 26, text: 'Весь поток сразу' },
      { from: T_STREAM + 26, to: S3_DURATION, text: 'Все группы курса — на одной картинке' },
    ]}
  >
    <Chat script={script} />
  </PhoneScene>
);
