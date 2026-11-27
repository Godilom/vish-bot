import React from 'react';
import { AbsoluteFill, Sequence, useCurrentFrame } from 'remotion';
import { B, C, Chat, Link, type ChatScript } from '../ui/Chat';
import { ramp } from '../ui/anim';
import { IosAlert, IosBanner, IosCalendar, type CalEvent } from '../ui/Ios';
import { PhoneScene } from '../ui/Stage';
import { MORE_TEXT, mainMenu, moreKb } from '../data';

export const S6_DURATION = 310;

const T_MORE = 14;
const T_CAL = 48;
const T_SUB = 92;
const T_ALARM = 126;
const T_LINK = 172;
const SWITCH = 186; // из Telegram — в системный диалог и «Календарь»
const T_SUBSCRIBE = 214;

const URL = 'webcal://…/cal/••••••.ics';

const script: ChatScript = {
  msgs: [
    { from: 'user', at: T_MORE + 4, text: '🗂 Ещё' },
    { from: 'bot', at: T_MORE + 12, text: MORE_TEXT, kb: moreKb({ '📆 Календарь телефона': T_CAL }) },
    {
      from: 'bot',
      at: T_CAL + 10,
      text: (
        <>
          <B>📆 Пары в календарь телефона</B>
          {'\n\n'}
          <B>Подписка</B> — лучший вариант: телефон сам подтягивает расписание, переносы и отмены появляются в календаре без твоего участия, ничего не дублируется.
          {'\n\n'}
          <B>Файл .ics</B> — все пары до конца семестра одним файлом. Открой его на телефоне и добавь события; можно с напоминанием-будильником.
        </>
      ),
      kb: [[{ t: '🔗 Подписка: обновляется сама', tap: T_SUB }], [{ t: '📎 Файл без напоминаний' }], [{ t: '📎 ⏰ за 15 мин' }, { t: '📎 ⏰ за 30 мин' }, { t: '📎 ✏️ Своё' }]],
    },
    {
      from: 'bot',
      at: T_SUB + 10,
      text: 'Напоминание перед каждой парой в самом календаре?',
      kb: [[{ t: 'Без напоминаний' }], [{ t: '⏰ за 15 мин', tap: T_ALARM }, { t: '⏰ за 30 мин' }, { t: '✏️ Своё' }]],
    },
    {
      from: 'bot',
      at: T_ALARM + 12,
      text: (
        <>
          <B>🔗 Подписка на расписание ВИШ-14-24</B>, напоминание за 15 мин
          {'\n\n'}
          <C>https://…/cal/••••••.ics</C>
          {'\n\n'}
          <B>iPhone:</B> Настройки → Приложения → Календарь → Учётные записи → Добавить → Другое → «Подписной календарь» → вставь ссылку. Или просто открой:
          {'\n'}
          <Link tap={T_LINK}>{URL}</Link>
          {'\n\n'}
          <B>Android / Google Календарь:</B> на сайте calendar.google.com слева «Другие календари» → «+» → «По URL» → вставь ссылку…
        </>
      ),
    },
  ],
  replyKb: [{ at: -100, rows: mainMenu({ '🗂 Ещё': T_MORE }) }],
};

const C_AT = T_SUBSCRIBE + 14;
const events: CalEvent[] = [
  { start: 500, end: 580, title: 'Математический анализ (ЛК)', place: 'ауд. 208, ЧувГУ', at: C_AT },
  { start: 590, end: 670, title: 'Физика (ПР)', place: 'ауд. 305, ЧувГУ', at: C_AT + 8 },
  { start: 700, end: 780, title: 'Программирование (ЛБ)', place: 'ауд. 412, ЧувГУ', at: C_AT + 16 },
];

const Screens: React.FC = () => {
  const f = useCurrentFrame();
  const cal = ramp(f, T_SUBSCRIBE + 8, T_SUBSCRIBE + 18);
  return (
    <AbsoluteFill>
      <Chat script={script} />
      <Sequence from={0} layout="none">
        <IosAlert at={SWITCH} tapAt={T_SUBSCRIBE} url={URL} />
      </Sequence>
      {f >= T_SUBSCRIBE + 8 ? (
        <AbsoluteFill style={{ opacity: cal, translate: `${(1 - cal) * 200}px 0px` }}>
          <IosCalendar events={events} time="9:35" nowMin={575} />
          <IosBanner at={C_AT + 40} dur={50} icon="calendar" app="КАЛЕНДАРЬ" title="Физика (ПР)" body={'через 15 минут\nауд. 305, ЧувГУ'} />
        </AbsoluteFill>
      ) : null}
    </AbsoluteFill>
  );
};

export const S6Calendar: React.FC = () => (
  <PhoneScene
    caps={[
      { from: 0, to: SWITCH, text: 'Пары — в календарь телефона' },
      { from: SWITCH, to: S6_DURATION, text: 'Ссылка одна — пары сами появятся в «Календаре»' },
    ]}
  >
    <Screens />
  </PhoneScene>
);
