import React from 'react';
import { B, Chat, type Btn, type ChatScript } from '../ui/Chat';
import { PhoneScene } from '../ui/Stage';
import { dayNav, mainMenu } from '../data';

export const S1_DURATION = 230;

const TAP_GROUP = 64;
const TAP_RECOMMENDED = 122;
const TAP_IMAGE = 168;

// groupPicker: курсы, номера без «ВИШ-», по 3 в ряд
const g = (t: string, tap?: number): Btn => ({ t, tap });
const picker = [
  [g('— 1 курс —')],
  [g('11-26'), g('12-26'), g('13-26')],
  [g('— 2 курс —')],
  [g('11-25'), g('12-25'), g('13-25')],
  [g('— 3 курс —')],
  [g('11-24'), g('12-24'), g('13-24')],
  [g('14-24', TAP_GROUP)],
  [g('💬 Спросить?')],
];

const script: ChatScript = {
  input: [[4, 22, '/start']],
  msgs: [
    { from: 'user', at: 22, text: '/start', time: '10:14' },
    {
      from: 'bot',
      at: 32,
      time: '10:14',
      text: (
        <>
          Привет! Я бот расписания Высшей инженерной школы ЧувГУ.
          {'\n\n'}Покажу пары на любой день, пришлю изменения в расписании и напомню о парах. Сначала выбери свою группу:
        </>
      ),
      kb: picker,
      edits: [{ at: TAP_GROUP + 4, kb: null }],
    },
    {
      from: 'bot',
      at: TAP_GROUP + 8,
      time: '10:14',
      text: (
        <>
          ✅ Группа: <B>ВИШ-14-24</B>. Меню — внизу 👇
        </>
      ),
    },
    {
      from: 'bot',
      at: TAP_GROUP + 22,
      time: '10:14',
      text:
        'Включить уведомления с рекомендуемыми настройками?\n\n• изменения в расписании твоей группы\n• напоминание за 2 часа до первой пары\n• за 5 минут до дистанционной пары — ссылка на вебинар\n\nВсё это потом можно поменять в ⚙️ Настройках.',
      kb: [[{ t: '✅ Включить рекомендуемые', tap: TAP_RECOMMENDED }], [{ t: '⚙️ Настроить самому' }, { t: 'Позже' }]],
      edits: [
        {
          at: TAP_RECOMMENDED + 4,
          text: '✅ Уведомления включены: изменения в расписании, напоминание за 2 часа до первой пары, ссылка на вебинар за 5 минут до дистанта.',
          kb: null,
        },
      ],
    },
    {
      from: 'bot',
      at: TAP_RECOMMENDED + 10,
      time: '10:15',
      text: 'Как показывать расписание?\n\nПотом это можно поменять в ⚙️ Настройках, там же выбирается оформление картинок.',
      kb: [[{ t: '📝 Текстом' }, { t: '🖼 Картинкой', tap: TAP_IMAGE }], [{ t: '📝🖼 И так, и так' }]],
    },
    { from: 'bot', at: TAP_IMAGE + 12, photo: 'day-today-midnight', kb: dayNav('25.11', '27.11') },
  ],
  replyKb: [{ at: TAP_GROUP + 8, rows: mainMenu() }],
  typing: [[24, 32]],
  toasts: [
    { at: TAP_GROUP + 1, text: 'Группа: ВИШ-14-24', dur: 30 },
    { at: TAP_RECOMMENDED + 1, text: 'Готово', dur: 26 },
  ],
};

export const S1Start: React.FC = () => (
  <PhoneScene
    caps={[
      { from: 0, to: TAP_GROUP + 20, text: 'Первый вход — выбери группу' },
      { from: TAP_GROUP + 20, to: S1_DURATION, text: 'Пара нажатий — и бот настроен' },
    ]}
  >
    <Chat script={script} />
  </PhoneScene>
);
