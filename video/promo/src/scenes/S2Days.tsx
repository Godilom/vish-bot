import React from 'react';
import { Chat, type ChatScript } from '../ui/Chat';
import { PhoneScene } from '../ui/Stage';
import { dayNav, mainMenu } from '../data';

export const S2_DURATION = 240;

const T_TODAY = 22;
const T_TOMORROW = 88;
const T_WEEK = 154;

const script: ChatScript = {
  msgs: [
    { from: 'bot', at: -1, photo: 'day-today-midnight', kb: dayNav('25.11', '27.11') },
    { from: 'user', at: T_TODAY + 4, text: '📅 Сегодня' },
    { from: 'bot', at: T_TODAY + 12, photo: 'day-today-midnight', kb: dayNav('25.11', '27.11') },
    { from: 'user', at: T_TOMORROW + 4, text: '📅 Завтра' },
    { from: 'bot', at: T_TOMORROW + 12, photo: 'day-tomorrow', kb: dayNav('26.11', '28.11') },
    { from: 'user', at: T_WEEK + 4, text: '🗓 Неделя' },
    {
      from: 'bot',
      at: T_WEEK + 12,
      photo: 'week',
      kb: [
        [{ t: '◀️ пред.' }, { t: 'текущая' }, { t: 'след. ▶️' }],
        [{ t: '📅 День' }, { t: '📆 В календарь' }],
      ],
    },
  ],
  replyKb: [{ at: -100, rows: mainMenu({ '📅 Сегодня': T_TODAY, '📅 Завтра': T_TOMORROW, '🗓 Неделя': T_WEEK }) }],
};

export const S2Days: React.FC = () => (
  <PhoneScene
    caps={[
      { from: 0, to: T_TOMORROW - 4, text: 'Пары на сегодня — одно касание' },
      { from: T_TOMORROW - 4, to: T_WEEK - 4, text: 'Завтра — ещё одно' },
      { from: T_WEEK - 4, to: S2_DURATION, text: 'Вся неделя — на одной картинке' },
    ]}
  >
    <Chat script={script} />
  </PhoneScene>
);
