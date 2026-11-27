import React from 'react';
import { B, C, Chat, I, type ChatScript } from '../ui/Chat';
import { PhoneScene } from '../ui/Stage';
import { FIND_TEXT, findKb, mainMenu } from '../data';

export const S5_DURATION = 220;

const T_FIND = 14;
const T_TEACHER = 50;
const SEND = 96;
const T_PICK = 126;
const T_FOLLOW = 182;

const cardKb = (follow: boolean) => [
  [{ t: '◀️ 25.11' }, { t: '27.11 ▶️' }],
  [{ t: '🗓 Неделя' }, { t: '🔎 Найти другого' }],
  [follow ? { t: '🔕 Не следить за преподом' } : { t: '👁 Следить за преподом', tap: T_FOLLOW }],
];

const script: ChatScript = {
  msgs: [
    { from: 'user', at: T_FIND + 4, text: '🔍 Найти с ИИ' },
    { from: 'bot', at: T_FIND + 12, text: FIND_TEXT, kb: findKb({ '👨‍🏫 Где препод': T_TEACHER }) },
    {
      from: 'bot',
      at: T_TEACHER + 10,
      text: (
        <>
          Напиши фамилию преподавателя, можно с именем или инициалами в любом порядке: <C>Иванова</C>, <C>Дарья Иванова</C>, <C>Иванова Д.А.</C> Отмена: /cancel
        </>
      ),
    },
    { from: 'user', at: SEND, text: 'Петров' },
    {
      from: 'bot',
      at: SEND + 12,
      text: 'Кого показать?',
      kb: [[{ t: '👨‍🏫 Петров Кирилл Алексеевич (ВИШ)', tap: T_PICK }], [{ t: '🔎 Искать другого' }]],
    },
    {
      from: 'bot',
      at: T_PICK + 12,
      photo: 'teacher-petrov',
      text: (
        <>
          👨‍🏫 <B>Петров Кирилл Алексеевич</B> (ВИШ)
          {'\n'}
          <I>Преподаватель ВИШ · Кафедра математического и аппаратного обеспечения информационных систем</I>
          {'\n\n'}📍 Сейчас (10:15) по расписанию: <B>Программирование</B> (ЛБ), ауд. 412 · ВИШ-11-24, ВИШ-12-24
          {'\n'}
          {'   '}до 11:10
        </>
      ),
      kb: cardKb(false),
      edits: [{ at: T_FOLLOW + 4, kb: cardKb(true) }],
    },
  ],
  replyKb: [{ at: -100, rows: mainMenu({ '🔍 Найти с ИИ': T_FIND }) }],
  input: [[SEND - 22, SEND, 'Петров']],
  typing: [[T_PICK + 2, T_PICK + 12]],
  toasts: [{ at: T_FOLLOW + 2, text: 'Слежу: пришлю его расписание вечером и за 2 часа до первой пары', dur: 34 }],
};

export const S5Teacher: React.FC = () => (
  <PhoneScene
    caps={[
      { from: 0, to: T_PICK + 6, text: 'Где преподаватель?' },
      { from: T_PICK + 6, to: T_FOLLOW - 6, text: 'Его пары и где он сейчас' },
      { from: T_FOLLOW - 6, to: S5_DURATION, text: 'Можно следить за его расписанием' },
    ]}
  >
    <Chat script={script} />
  </PhoneScene>
);
