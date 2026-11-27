import React from 'react';
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from 'remotion';
import { Chat, type ChatScript } from '../ui/Chat';
import { lerp, ramp } from '../ui/anim';
import { PhoneScene } from '../ui/Stage';
import { FONT } from '../fonts';
import { DAY_TEXT, LOOK_TEXT, MORE_TEXT, SETTINGS_TEXT, lookKb, mainMenu, moreKb, settingsKb } from '../data';

export const S8_DURATION = 260;

const T_MORE = 12;
const T_SETTINGS = 44;
const T_LOOK = 82;
const THEMES = [
  { at: 112, label: 'Журнальная', file: 'day-today-editorial' },
  { at: 140, label: 'Плакатная', file: 'day-today-brutalist' },
  { at: 168, label: 'Лента', file: 'day-today-timeline' },
];
const FORMATS = [
  { at: 200, label: 'оба' },
  { at: 226, label: 'текст' },
];

const look = (theme: string, format: string, taps: Record<string, number>) => ({ text: LOOK_TEXT, kb: lookKb(format, theme, taps) });

const script: ChatScript = {
  msgs: [
    { from: 'user', at: T_MORE + 4, text: '🗂 Ещё' },
    { from: 'bot', at: T_MORE + 12, text: MORE_TEXT, kb: moreKb({ '⚙️ Настройки': T_SETTINGS }) },
    {
      from: 'bot',
      at: T_SETTINGS + 10,
      text: SETTINGS_TEXT,
      kb: settingsKb({ look: T_LOOK }),
      edits: [
        { at: T_LOOK + 4, ...look('Тёмная', 'картинка', { theme: THEMES[0].at }) },
        { at: THEMES[0].at + 3, ...look('Журнальная', 'картинка', { theme: THEMES[1].at }) },
        { at: THEMES[1].at + 3, ...look('Плакатная', 'картинка', { theme: THEMES[2].at }) },
        { at: THEMES[2].at + 3, ...look('Лента', 'картинка', { format: FORMATS[0].at }) },
        { at: FORMATS[0].at + 3, ...look('Лента', 'оба', { format: FORMATS[1].at }) },
        { at: FORMATS[1].at + 3, ...look('Лента', 'текст', {}) },
      ],
    },
  ],
  replyKb: [{ at: -100, rows: mainMenu({ '🗂 Ещё': T_MORE }) }],
  toasts: THEMES.map((t) => ({ at: t.at + 1, text: `Оформление: ${t.label}`, dur: 24 })),
};

/** Превью рядом с телефоном: так выглядит расписание в выбранной теме и формате (монтажная вставка). */
const Preview: React.FC = () => {
  const f = useCurrentFrame();
  if (f < T_LOOK + 10) return null;
  const p = ramp(f, T_LOOK + 10, T_LOOK + 24);
  const out = ramp(f, S8_DURATION - 10, S8_DURATION);
  const files = [{ at: 0, file: 'day-today-midnight' }, ...THEMES];
  const textMode = ramp(f, FORMATS[1].at + 3, FORMATS[1].at + 13);
  const both = f >= FORMATS[0].at + 3;
  return (
    <div
      style={{
        position: 'absolute',
        right: 24,
        top: 620,
        width: 500,
        rotate: `${lerp(f, [T_LOOK + 10, T_LOOK + 24], [8, 3])}deg`,
        opacity: p * (1 - out),
        translate: `${(1 - p) * 300}px 0px`,
        filter: 'drop-shadow(0 30px 50px rgba(0,0,0,0.5))',
        fontFamily: FONT,
      }}
    >
      <div style={{ position: 'relative', borderRadius: 26, overflow: 'hidden', background: 'white', opacity: 1 - textMode }}>
        {files.map((t, i) => {
          const o = i === 0 ? 1 : ramp(f, t.at + 3, t.at + 11);
          return <Img key={t.file} src={staticFile(`posters/${t.file}.png`)} style={{ position: i === 0 ? 'relative' : 'absolute', left: 0, top: 0, width: 500, display: 'block', opacity: o }} />;
        })}
        {both ? (
          <div style={{ background: 'white', padding: '14px 20px', fontSize: 20, lineHeight: 1.3, whiteSpace: 'pre-wrap', color: '#111' }}>{DAY_TEXT}</div>
        ) : null}
      </div>
      {textMode > 0 ? (
        <div style={{ position: 'absolute', left: 0, top: 0, width: 500, background: 'white', borderRadius: 26, padding: '22px 26px', fontSize: 24, lineHeight: 1.32, whiteSpace: 'pre-wrap', color: '#111', opacity: textMode }}>
          {DAY_TEXT}
        </div>
      ) : null}
    </div>
  );
};

export const S8Settings: React.FC = () => (
  <PhoneScene
    caps={[
      { from: 0, to: T_LOOK + 6, text: 'Настройки — под себя' },
      { from: T_LOOK + 6, to: FORMATS[0].at - 6, text: '4 темы оформления' },
      { from: FORMATS[0].at - 6, to: S8_DURATION, text: 'Картинкой, текстом или и так, и так' },
    ]}
    overlay={<Preview />}
  >
    <AbsoluteFill>
      <Chat script={script} />
    </AbsoluteFill>
  </PhoneScene>
);
