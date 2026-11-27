import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { B, C, Chat, type ChatScript } from '../ui/Chat';
import { ramp } from '../ui/anim';
import { IosBanner, IosCalendar, LockScreen, type CalEvent } from '../ui/Ios';
import { PhoneScene } from '../ui/Stage';
import { mainMenu } from '../data';

export const S7_DURATION = 250;

const PUSH = 12;
const T_PUSH = 62;
const CHAT = 74; // открыли Telegram
const CAL = 168; // переход в «Календарь»

// Подпись к картинке изменений: todayCaption + markLine (src/notify/changes.ts)
const CAPTION = (
  <>
    🚨 <B>ИЗМЕНЕНИЯ НА СЕГОДНЯ</B> · ВИШ-14-24
    {'\n\n'}✏️ 2 пара <C>09:50–11:10</C> <B>Физика</B> — ауд. 305 → 412
    {'\n'}❌ 3 пара <C>11:40–13:00</C> <B>Программирование</B> — <B>отменена</B>
  </>
);

const script: ChatScript = {
  msgs: [{ from: 'bot', at: CHAT + 10, time: '7:40', photo: 'changes-today', text: CAPTION }],
  replyKb: [{ at: -100, rows: mainMenu() }],
};

const events: CalEvent[] = [
  { start: 500, end: 580, title: 'Математический анализ (ЛК)', place: 'ауд. 208, ЧувГУ', at: -100 },
  { start: 590, end: 670, title: 'Физика (ПР)', place: 'ауд. 305, ЧувГУ', at: -100, changeAt: CAL + 22, newPlace: 'ауд. 412, ЧувГУ' },
  { start: 700, end: 780, title: 'Программирование (ЛБ)', place: 'ауд. 412, ЧувГУ', at: -100, cancelAt: CAL + 36 },
];

const Screens: React.FC = () => {
  const f = useCurrentFrame();
  const chat = ramp(f, CHAT - 6, CHAT + 4);
  const cal = ramp(f, CAL, CAL + 10);
  return (
    <AbsoluteFill>
      <LockScreen>
        <IosBanner
          at={PUSH}
          dur={CHAT - PUSH}
          top={0}
          icon="bot"
          app="Бот ВИШ"
          title="🚨 ИЗМЕНЕНИЯ НА СЕГОДНЯ · ВИШ-14-24"
          body={'✏️ 2 пара 09:50–11:10 Физика — ауд. 305 → 412\n❌ 3 пара 11:40–13:00 Программирование — отменена'}
          tapAt={T_PUSH}
        />
      </LockScreen>
      {f >= CHAT - 6 ? (
        <AbsoluteFill style={{ opacity: chat, scale: String(0.9 + 0.1 * chat) }}>
          <Chat script={script} />
        </AbsoluteFill>
      ) : null}
      {f >= CAL ? (
        <AbsoluteFill style={{ opacity: cal, translate: `${(1 - cal) * 200}px 0px` }}>
          <IosCalendar events={events} time="7:45" nowMin={480} />
        </AbsoluteFill>
      ) : null}
    </AbsoluteFill>
  );
};

export const S7Changes: React.FC = () => (
  <PhoneScene
    caps={[
      { from: 0, to: CHAT, text: 'Перенесли пару? Бот напишет сам' },
      { from: CHAT, to: CAL, text: 'Что изменилось — сразу видно' },
      { from: CAL, to: S7_DURATION, text: 'А подписка поправит календарь' },
    ]}
  >
    <Screens />
  </PhoneScene>
);
