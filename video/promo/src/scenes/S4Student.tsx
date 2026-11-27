import React from 'react';
import { B, C, Chat, I, type ChatScript } from '../ui/Chat';
import { PhoneScene } from '../ui/Stage';
import { FIND_TEXT, findKb, mainMenu } from '../data';

export const S4_DURATION = 190;

const T_FIND = 14;
const T_POISK = 50;
const SEND = 112;

// POISK_INTRO из src/bot/people.ts
const INTRO = (
  <>
    🕵️ <B>Глобальный поиск студента</B>
    {'\n\n'}Пишешь ФИО — бот находит человека в базе ВИШ, определяет его группу и подгруппу и показывает, <B>где он должен быть прямо сейчас</B> по расписанию: пара, аудитория, до скольки. Плюс его расписание на день с обычными кнопками «вчера / завтра / неделя».
    {'\n\n'}Важно: это расписание его группы, а не слежка. Ходит ли человек на пары на самом деле, бот не знает 🙂
    {'\n\n'}Напиши фамилию (можно с именем): <C>Иванов Иван</C>. Отмена: /cancel
  </>
);

const script: ChatScript = {
  msgs: [
    { from: 'user', at: T_FIND + 4, text: '🔍 Найти с ИИ' },
    { from: 'bot', at: T_FIND + 12, text: FIND_TEXT, kb: findKb({ '🕵️ Где студент': T_POISK }) },
    { from: 'bot', at: T_POISK + 10, text: INTRO, kb: [[{ t: '✖️ Отмена' }]] },
    { from: 'user', at: SEND, text: 'Беляев Василий' },
    {
      from: 'bot',
      at: SEND + 14,
      photo: 'student-belyaev',
      text: (
        <>
          🎓 <B>Беляев Василий</B>
          {'\n'}
          <I>Студент ВИШ · ВИШ-14-24 · 1 подгруппа</I>
          {'\n\n'}📍 Сейчас (10:15) по расписанию: <B>Физика</B> (ПР), ауд. 305
          {'\n'}
          {'   '}до 11:10
        </>
      ),
      kb: [[{ t: '◀️ 25.11' }, { t: '27.11 ▶️' }], [{ t: '🗓 Неделя' }, { t: '🔎 Найти другого' }], [{ t: '📅 Вся группа 14-24' }]],
    },
  ],
  replyKb: [{ at: -100, rows: mainMenu({ '🔍 Найти с ИИ': T_FIND }) }],
  input: [[SEND - 30, SEND, 'Беляев Василий']],
  typing: [[SEND + 2, SEND + 14]],
};

export const S4Student: React.FC = () => (
  <PhoneScene
    caps={[
      { from: 0, to: SEND + 8, text: 'Где сейчас одногруппник?' },
      { from: SEND + 8, to: S4_DURATION, text: 'Пара, аудитория, до скольки' },
    ]}
  >
    <Chat script={script} />
  </PhoneScene>
);
