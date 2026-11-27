import React from 'react';
import { Img, staticFile, useCurrentFrame } from 'remotion';
import { FONT, MONO } from '../fonts';
import { lerp, ramp } from './anim';
import { pressShade, TapMark } from './Tap';

// ---------- разметка текста сообщений (как HTML бота: <b>, <i>, <code>) ----------
export const B: React.FC<{ children: React.ReactNode }> = ({ children }) => <b style={{ fontWeight: 700 }}>{children}</b>;
export const I: React.FC<{ children: React.ReactNode }> = ({ children }) => <i>{children}</i>;
export const C: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span style={{ fontFamily: MONO, fontSize: '0.9em', color: '#2b6cb0' }}>{children}</span>
);
export const S: React.FC<{ children: React.ReactNode }> = ({ children }) => <s>{children}</s>;
/** Ссылка в тексте, на которую нажимают. */
export const Link: React.FC<{ children: React.ReactNode; tap?: number }> = ({ children, tap }) => (
  <span style={{ position: 'relative', display: 'inline-block', color: '#2481cc', fontFamily: MONO, fontSize: '0.9em' }}>
    {children}
    {tap !== undefined ? <TapMark at={tap} radius={10} /> : null}
  </span>
);

// ---------- модель ----------
export type Btn = { t: string; tap?: number; hl?: boolean };
export type Rows = Btn[][];
export type Content = { text?: React.ReactNode; photo?: string; kb?: Rows | null };
export type Msg = Content & {
  from: 'bot' | 'user';
  at: number;
  /** Сообщение меняется на месте: с кадра at — эти поля. */
  edits?: Array<Content & { at: number }>;
  time?: string;
};
export type ChatScript = {
  msgs: Msg[];
  /** Нижнее меню по кадрам (null — без меню). */
  replyKb?: Array<{ at: number; rows: Rows | null }>;
  /** «печатает…» в шапке. */
  typing?: Array<[number, number]>;
  /** Набор текста в поле ввода: [с кадра, до кадра, текст]. */
  input?: Array<[number, number, string]>;
  /** Всплывашки ответа на кнопку. */
  toasts?: Array<{ at: number; text: string; dur?: number }>;
  /** Свечение аватара («думает»). */
  glow?: [number, number];
  /** Кадр, когда отправленный вопрос «улетает» в аватар (прячем пузырь). */
  flyAway?: { msgIndex: number; at: number };
};

export const POSTERS: Record<string, [number, number]> = {
  'changes-today': [1080, 1063],
  'day-today-brutalist': [1080, 1266],
  'day-today-editorial': [1080, 1164],
  'day-today-midnight': [1080, 888],
  'day-today-timeline': [1080, 903],
  'day-tomorrow': [1080, 865],
  stream: [1080, 1053],
  'student-belyaev': [1080, 888],
  'teacher-petrov': [1080, 920],
  week: [1080, 2292],
};

export const W = 1080;
export const H = 1920;
const BUBBLE_MAX = 860;
const PHOTO_W = 800;
const PHOTO_MAX_H = 1100;
const PHOTO_MIN_W = 640;

const pick = (m: Msg, f: number): Content => {
  let c: Content = { text: m.text, photo: m.photo, kb: m.kb };
  for (const e of m.edits ?? []) if (f >= e.at) c = { ...c, ...Object.fromEntries(Object.entries(e).filter(([k]) => k !== 'at')) };
  return c;
};
const lastEditAt = (m: Msg, f: number) => Math.max(m.at, ...(m.edits ?? []).filter((e) => f >= e.at).map((e) => e.at));

// ---------- кнопки ----------
const InlineBtn: React.FC<{ b: Btn }> = ({ b }) => {
  const f = useCurrentFrame();
  const header = b.t.startsWith('— ');
  return (
    <div
      style={{
        position: 'relative',
        flex: 1,
        minHeight: 78,
        borderRadius: 18,
        background: header ? 'rgba(30,70,45,0.28)' : 'rgba(30,70,45,0.46)',
        color: 'white',
        fontWeight: 600,
        fontSize: 33,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '6px 14px',
        lineHeight: 1.15,
        boxShadow: `inset 0 0 0 999px rgba(0,0,0,${pressShade(f, b.tap)})`,
      }}
    >
      {b.t}
      {b.tap !== undefined ? <TapMark at={b.tap} /> : null}
    </div>
  );
};

const InlineKb: React.FC<{ rows: Rows; width: number }> = ({ rows, width }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8, width }}>
    {rows.map((row, i) => (
      <div key={i} style={{ display: 'flex', gap: 8 }}>
        {row.map((b, j) => (
          <InlineBtn key={j} b={b} />
        ))}
      </div>
    ))}
  </div>
);

// ---------- сообщение ----------
const Bubble: React.FC<{ m: Msg }> = ({ m }) => {
  const f = useCurrentFrame();
  const c = pick(m, f);
  const user = m.from === 'user';
  const editFlash = lerp(f, [lastEditAt(m, f), lastEditAt(m, f) + 5], [0.55, 1]);
  const photoSize = c.photo ? POSTERS[c.photo] : null;
  let pw = PHOTO_W;
  let ph = photoSize ? (PHOTO_W * photoSize[1]) / photoSize[0] : 0;
  if (ph > PHOTO_MAX_H) {
    pw = (pw * PHOTO_MAX_H) / ph;
    ph = PHOTO_MAX_H;
  }
  const time = <span style={{ float: 'right', fontSize: 24, color: user ? '#4fae4e' : '#9aa1a9', margin: '18px 0 -8px 18px' }}>{m.time ?? '10:15'}{user ? ' ✓✓' : ''}</span>;
  const width = c.photo ? Math.max(pw, PHOTO_MIN_W) : undefined;
  const kbWidth = c.photo ? Math.max(pw, PHOTO_MIN_W) : c.kb && c.kb.length ? BUBBLE_MAX : 0;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: user ? 'flex-end' : 'flex-start', opacity: editFlash }}>
      <div
        style={{
          maxWidth: BUBBLE_MAX,
          width: c.kb && c.kb.length && !c.photo ? BUBBLE_MAX : width,
          background: user ? '#e2fec8' : 'white',
          borderRadius: 30,
          overflow: 'hidden',
          boxShadow: '0 2px 2px rgba(0,0,0,0.08)',
        }}
      >
        {c.photo ? (
          <div style={{ background: '#0b1020', display: 'flex', justifyContent: 'center' }}>
            <Img src={staticFile(`posters/${c.photo}.png`)} style={{ width: pw, height: ph, display: 'block' }} />
          </div>
        ) : null}
        {c.text ? (
          <div style={{ padding: '18px 26px 20px', fontSize: 35, lineHeight: 1.34, color: '#111', whiteSpace: 'pre-wrap' }}>
            {c.text}
            {time}
          </div>
        ) : null}
      </div>
      {c.kb && c.kb.length ? <InlineKb rows={c.kb} width={kbWidth} /> : null}
    </div>
  );
};

/** Появление: высота растёт от 0 (сообщения выше плавно уезжают), пузырь всплывает. */
const Appear: React.FC<{ m: Msg; children: React.ReactNode; hideAt?: number }> = ({ m, children, hideAt }) => {
  const f = useCurrentFrame();
  const p = ramp(f, m.at, m.at + 9);
  const gone = hideAt !== undefined ? ramp(f, hideAt, hideAt + 5) : 0;
  return (
    <div style={{ display: 'grid', gridTemplateRows: `${p}fr`, marginTop: 14 * p }}>
      <div
        style={{
          minHeight: 0,
          overflow: p < 1 ? 'hidden' : 'visible',
          opacity: (0.2 + 0.8 * p) * (1 - gone),
          translate: `${(1 - p) * (m.from === 'user' ? 40 : -40)}px 0px`,
          scale: String(1 - gone * 0.6),
          transformOrigin: 'left top',
        }}
      >
        {children}
      </div>
    </div>
  );
};

// ---------- шапка, поле ввода, нижнее меню ----------
export const StatusBar: React.FC<{ dark?: boolean; time?: string }> = ({ dark, time = '10:15' }) => (
  <div style={{ height: 70, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 44px', fontSize: 32, fontWeight: 600, color: dark ? 'white' : '#111' }}>
    <span>{time}</span>
    <span style={{ fontSize: 28 }}>▂▄▆ 100%</span>
  </div>
);

const Header: React.FC<{ typing: boolean; glow: number }> = ({ typing, glow }) => (
  <div style={{ background: '#fff', height: 140, display: 'flex', alignItems: 'center', padding: '0 30px', gap: 22, borderBottom: '1px solid #e3e3e3' }}>
    <span style={{ fontSize: 60, color: '#2481cc', marginTop: -8 }}>‹</span>
    <div style={{ position: 'relative', width: 96, height: 96 }}>
      <div
        style={{
          position: 'absolute',
          inset: -16,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(90,200,255,0.9) 0%, rgba(90,200,255,0) 70%)',
          opacity: glow,
          scale: String(1 + glow * 0.25),
        }}
      />
      <Img src={staticFile('avatar.png')} style={{ position: 'relative', width: 96, height: 96, borderRadius: '50%' }} />
    </div>
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <span style={{ fontSize: 40, fontWeight: 700, color: '#111' }}>Бот ВИШ</span>
      <span style={{ fontSize: 30, color: typing ? '#2481cc' : '#8a8f96' }}>{typing ? 'печатает…' : 'бот'}</span>
    </div>
  </div>
);

const ReplyBtn: React.FC<{ b: Btn; enter: number; i: number }> = ({ b, enter, i }) => {
  const f = useCurrentFrame();
  const p = ramp(f, enter + i * 2, enter + i * 2 + 10);
  const hl = b.hl ? lerp(f, [enter + 10, enter + 20], [0, 1]) : 0;
  return (
    <div
      style={{
        position: 'relative',
        flex: 1,
        height: 98,
        borderRadius: 16,
        background: hl ? `rgba(255,243,196,${hl})` : 'white',
        border: hl ? `5px solid rgba(245,183,0,${hl})` : '5px solid transparent',
        boxShadow: `0 2px 0 rgba(0,0,0,0.12), inset 0 0 0 999px rgba(0,0,0,${pressShade(f, b.tap)})`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 34,
        fontWeight: 600,
        color: '#111',
        whiteSpace: 'nowrap',
        scale: String(0.9 + 0.1 * p),
        opacity: p,
      }}
    >
      {b.t}
      {b.tap !== undefined ? <TapMark at={b.tap} /> : null}
    </div>
  );
};

const InputBar: React.FC<{ text: string | null; caret: boolean; hasKb: boolean }> = ({ text, caret, hasKb }) => (
  <div style={{ background: 'white', height: 116, display: 'flex', alignItems: 'center', gap: 22, padding: '0 26px', borderTop: '1px solid #e3e3e3' }}>
    {hasKb ? (
      <span style={{ background: '#2f9be6', color: 'white', borderRadius: 40, padding: '10px 26px', fontSize: 32, fontWeight: 700 }}>Меню</span>
    ) : (
      <span style={{ fontSize: 44, color: '#8a8f96' }}>📎</span>
    )}
    <span style={{ flex: 1, fontSize: 34, color: text ? '#111' : '#9aa1a9', whiteSpace: 'nowrap', overflow: 'hidden' }}>
      {text ?? (hasKb ? '14-24, Иванова, матан, 15.10' : 'Сообщение')}
      {caret ? <span style={{ color: '#2481cc' }}>|</span> : null}
    </span>
    <span style={{ fontSize: 40, color: text ? '#2481cc' : '#8a8f96' }}>{text ? '➤' : '▦'}</span>
  </div>
);

const Wallpaper: React.FC = () => (
  <div
    style={{
      position: 'absolute',
      inset: 0,
      background:
        'radial-gradient(circle at 12px 12px, rgba(255,255,255,0.22) 5px, transparent 6px) 0 0 / 66px 66px, radial-gradient(circle at 45px 45px, rgba(60,110,60,0.13) 9px, transparent 10px) 0 0 / 110px 110px, linear-gradient(170deg, #cfe08f 0%, #a7cc86 45%, #79ab86 100%)',
    }}
  />
);

/** Экран Telegram 1080×1920 по сценарию. */
export const Chat: React.FC<{ script: ChatScript }> = ({ script }) => {
  const f = useCurrentFrame();
  const kbState = [...(script.replyKb ?? [])].filter((k) => f >= k.at).pop();
  const rows = kbState?.rows ?? null;
  const kbEnter = kbState?.at ?? -100;
  const typing = (script.typing ?? []).some(([a, b]) => f >= a && f < b);
  const input = (script.input ?? []).find(([a, b]) => f >= a && f < b);
  const inputText = input ? input[2].slice(0, Math.ceil(input[2].length * lerp(f, [input[0], input[1] - 6], [0, 1]))) : null;
  const toast = (script.toasts ?? []).find((t) => f >= t.at && f < t.at + (t.dur ?? 40));
  const glow = script.glow ? lerp(f, [script.glow[0], script.glow[0] + 8, script.glow[1] - 8, script.glow[1]], [0, 1, 1, 0]) * (0.6 + 0.4 * Math.sin(f / 3)) : 0;
  const visible = script.msgs.filter((m) => f >= m.at);
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', fontFamily: FONT, background: 'white' }}>
      <StatusBar />
      <Header typing={typing} glow={glow} />
      <div style={{ position: 'relative', flex: 1, overflow: 'hidden' }}>
        <Wallpaper />
        <div style={{ position: 'absolute', left: 24, right: 24, bottom: 20, display: 'flex', flexDirection: 'column' }}>
          {visible.map((m, i) => (
            <Appear key={i} m={m} hideAt={script.flyAway && script.msgs.indexOf(m) === script.flyAway.msgIndex ? script.flyAway.at : undefined}>
              <Bubble m={m} />
            </Appear>
          ))}
        </div>
        {toast ? (
          <div
            style={{
              position: 'absolute',
              left: 60,
              right: 60,
              top: 40,
              background: 'rgba(30,30,30,0.86)',
              color: 'white',
              borderRadius: 24,
              padding: '26px 34px',
              fontSize: 33,
              lineHeight: 1.3,
              textAlign: 'center',
              opacity: ramp(f, toast.at, toast.at + 5) * (1 - ramp(f, toast.at + (toast.dur ?? 40) - 6, toast.at + (toast.dur ?? 40))),
              translate: `0px ${(1 - ramp(f, toast.at, toast.at + 8)) * -30}px`,
              zIndex: 60,
            }}
          >
            {toast.text}
          </div>
        ) : null}
      </div>
      <InputBar text={inputText} caret={!!input && Math.floor(f / 8) % 2 === 0} hasKb={!!rows} />
      {rows ? (
        <div style={{ background: '#d9dce1', padding: '14px 14px 30px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {rows.map((row, i) => (
            <div key={`${kbEnter}-${i}`} style={{ display: 'flex', gap: 12 }}>
              {row.map((b, j) => (
                <ReplyBtn key={j} b={b} enter={kbEnter} i={i * 3 + j} />
              ))}
            </div>
          ))}
        </div>
      ) : (
        <div style={{ height: 30, background: 'white' }} />
      )}
    </div>
  );
};
