import React from 'react';
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from 'remotion';
import { B, C, Chat, type ChatScript } from '../ui/Chat';
import { bezier, EASE_IN_OUT, lerp, ramp } from '../ui/anim';
import { Backdrop, Caption, Phone } from '../ui/Stage';
import { FONT, MONO } from '../fonts';
import { FIND_TEXT, findKb, ownMenu } from '../data';

export const S10_DURATION = 450;

// ---- фаза A: вопрос в чате ----
const T_FIND = 14;
const T_ASK = 50;
const SEND = 116;
const FLY = 126; // пузырь вопроса превращается в импульс и летит в аватар

// ---- фаза B: схема (как устроен /ask: src/bot/handlers/ask.ts, src/ai/ask.ts) ----
const SHRINK = 150;
const Q_TO_BOT = [170, 190] as const;
const BOT_TO_AI = [192, 214] as const;
const THINK = [214, 230] as const;
const TOOLS_TO_BOT = [230, 252] as const;
const BOT_TO_DB = [254, 272] as const;
const DB_GLOW = [272, 284] as const;
const DB_TO_BOT = [284, 300] as const;
const BOT_TO_AI2 = [302, 320] as const;
const AI_FLASH = [320, 330] as const;
const AI_TO_BOT = [330, 346] as const;
const BOT_TO_PHONE = [348, 364] as const;
const GROW = [362, 382] as const;
const ANSWER = 380;

const script: ChatScript = {
  msgs: [
    { from: 'user', at: T_FIND + 4, text: '🔍 Найти с ИИ' },
    { from: 'bot', at: T_FIND + 12, text: FIND_TEXT, kb: findKb({ '💬 Спросить ИИ': T_ASK }) },
    {
      from: 'bot',
      at: T_ASK + 10,
      text: (
        <>
          Спрашивай что угодно про расписание, преподавателей и сам бот. Например:
          {'\n'}• <C>когда матан на этой неделе</C>
          {'\n'}• <C>что у 14-24 в пятницу</C>
          {'\n'}• <C>кто ведёт БЖД</C>
          {'\n'}• <C>как включить напоминания</C>
          {'\n\n'}Отмена: /cancel
        </>
      ),
    },
    { from: 'user', at: SEND, text: 'когда у нас следующая физика?' },
    {
      from: 'bot',
      at: ANSWER,
      text: (
        <>
          Следующая <B>физика</B> — завтра, в пятницу 27 ноября: 3-я пара <B>11:40–13:00</B>, лабораторная, ауд. 301, Смирнов А. П.
        </>
      ),
      kb: [[{ t: '👎 Ответ неверный' }]],
    },
  ],
  replyKb: [{ at: -100, rows: ownMenu(false, { '🔍 Найти с ИИ': T_FIND }) }],
  input: [[SEND - 34, SEND, 'когда у нас следующая физика?']],
  typing: [[FLY + 4, ANSWER]],
  glow: [FLY + 14, ANSWER],
  flyAway: { msgIndex: 3, at: FLY },
};

// Узлы схемы (координаты кадра 1080×1920)
const X = 545;
const AI: [number, number] = [X, 600];
const BOT: [number, number] = [X, 1030];
const DB: [number, number] = [X, 1460];
const PORTAL: [number, number] = [X, 1790];
const PHONE_PORT: [number, number] = [350, 1030];

const MINI = 0.36;
const MINI_X = 30;
const MINI_Y = 754;

const Glow: React.FC<{ x: number; y: number; size: number; color: string; o: number }> = ({ x, y, size, color, o }) => (
  <div style={{ position: 'absolute', left: x - size / 2, top: y - size / 2, width: size, height: size, borderRadius: '50%', background: `radial-gradient(circle, ${color} 0%, rgba(0,0,0,0) 68%)`, opacity: o }} />
);

/** Светящийся импульс с хвостом по кривой a→b. */
const Pulse: React.FC<{ from: [number, number]; to: [number, number]; win: readonly [number, number]; color?: string; bend?: number; label?: string }> = ({ from, to, win, color = '#7fd8ff', bend = 0, label }) => {
  const f = useCurrentFrame();
  if (f < win[0] || f > win[1] + 4) return null;
  const ctrl: [number, number] = [(from[0] + to[0]) / 2 + bend, (from[1] + to[1]) / 2];
  const t = lerp(f, [win[0], win[1]], [0, 1], EASE_IN_OUT);
  const fade = 1 - ramp(f, win[1], win[1] + 4);
  return (
    <>
      {[0.12, 0.08, 0.04, 0].map((d, i) => {
        const [x, y] = bezier(Math.max(0, t - d), from, ctrl, to);
        const s = 54 - i * 0 - (3 - i) * 10;
        return <div key={i} style={{ position: 'absolute', left: x - s / 2, top: y - s / 2, width: s, height: s, borderRadius: '50%', background: color, boxShadow: `0 0 30px 12px ${color}`, opacity: fade * (0.25 + i * 0.25) }} />;
      })}
      {label ? (
        <div
          style={{
            position: 'absolute',
            left: bezier(t, from, ctrl, to)[0] + 46,
            top: bezier(t, from, ctrl, to)[1] - 26,
            fontFamily: FONT,
            fontSize: 30,
            fontWeight: 700,
            color: 'white',
            background: 'rgba(10,30,22,0.75)',
            padding: '6px 16px',
            borderRadius: 14,
            whiteSpace: 'nowrap',
            opacity: fade,
          }}
        >
          {label}
        </div>
      ) : null}
    </>
  );
};

/** Вызов инструмента: «чип» с именем функции едет по проводу. */
const Chip: React.FC<{ name: string; from: [number, number]; to: [number, number]; win: readonly [number, number]; dx: number }> = ({ name, from, to, win, dx }) => {
  const f = useCurrentFrame();
  if (f < win[0] || f > win[1] + 6) return null;
  const t = lerp(f, [win[0], win[1]], [0, 1], EASE_IN_OUT);
  const x = from[0] + (to[0] - from[0]) * t + dx;
  const y = from[1] + (to[1] - from[1]) * t;
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y - 30,
        translate: '-50% 0',
        fontFamily: MONO,
        fontSize: 30,
        color: '#0b2a1d',
        background: '#ffd54a',
        padding: '8px 18px',
        borderRadius: 14,
        boxShadow: '0 0 24px rgba(255,213,74,0.8)',
        whiteSpace: 'nowrap',
        opacity: 1 - ramp(f, win[1], win[1] + 6),
      }}
    >
      {name}()
    </div>
  );
};

const Wire: React.FC<{ a: [number, number]; b: [number, number]; o: number; dashed?: boolean; bend?: number }> = ({ a, b, o, dashed, bend = 0 }) => {
  const c = [(a[0] + b[0]) / 2 + bend, (a[1] + b[1]) / 2];
  return (
    <path
      d={`M ${a[0]} ${a[1]} Q ${c[0]} ${c[1]} ${b[0]} ${b[1]}`}
      stroke="rgba(150,230,255,0.55)"
      strokeWidth={8}
      fill="none"
      strokeDasharray={dashed ? '14 16' : undefined}
      strokeLinecap="round"
      opacity={o}
    />
  );
};

const NodeLabel: React.FC<{ x: number; y: number; title: string; sub: string; o: number }> = ({ x, y, title, sub, o }) => (
  <div style={{ position: 'absolute', left: x + 140, top: y - 56, fontFamily: FONT, color: 'white', opacity: o, width: 370 }}>
    <div style={{ fontSize: 40, fontWeight: 800, lineHeight: 1.1 }}>{title}</div>
    <div style={{ fontSize: 28, color: 'rgba(220,255,235,0.8)', marginTop: 6, lineHeight: 1.2 }}>{sub}</div>
  </div>
);

const Schematic: React.FC = () => {
  const f = useCurrentFrame();
  if (f < SHRINK + 6 || f > GROW[1]) return null;
  const pop = (d: number) => ramp(f, SHRINK + 6 + d, SHRINK + 20 + d);
  const out = 1 - ramp(f, GROW[0], GROW[1]);
  const think = f >= THINK[0] && f < THINK[1] ? 0.6 + 0.4 * Math.sin(f / 2) : 0;
  const aiFlash = lerp(f, [AI_FLASH[0], AI_FLASH[0] + 4, AI_FLASH[1]], [0, 1, 0.2]);
  const aiIn = Math.max(think, aiFlash, ramp(f, BOT_TO_AI[1] - 2, BOT_TO_AI[1] + 4) * (1 - ramp(f, THINK[1], THINK[1] + 6)), ramp(f, BOT_TO_AI2[1] - 2, BOT_TO_AI2[1] + 2) * (1 - ramp(f, AI_FLASH[1], AI_FLASH[1] + 6)));
  const dbGlow = lerp(f, [DB_GLOW[0] - 2, DB_GLOW[0] + 3, DB_GLOW[1] + 4], [0, 1, 0]);
  const botBusy = f >= Q_TO_BOT[1] - 2 && f < BOT_TO_PHONE[0] ? 0.5 + 0.5 * Math.sin(f / 2.5) : 0;
  return (
    <AbsoluteFill style={{ opacity: out }}>
      <svg width={1080} height={1920} style={{ position: 'absolute', inset: 0 }}>
        <Wire a={PHONE_PORT} b={BOT} o={pop(0)} />
        <Wire a={BOT} b={AI} o={pop(4)} />
        <Wire a={BOT} b={DB} o={pop(8)} />
        <Wire a={DB} b={PORTAL} o={pop(12)} dashed />
      </svg>
      {/* портал: фоновое обновление раз в 6 минут */}
      {[0, 1, 2].map((i) => {
        const t = ((f + i * 20) % 60) / 60;
        return <div key={i} style={{ position: 'absolute', left: PORTAL[0] - 8, top: PORTAL[1] - (PORTAL[1] - DB[1]) * t - 8, width: 16, height: 16, borderRadius: '50%', background: 'rgba(150,230,255,0.6)', opacity: pop(12) * 0.8 }} />;
      })}

      {/* ИИ */}
      <Glow x={AI[0]} y={AI[1]} size={520} color="rgba(190,150,255,0.85)" o={aiIn} />
      <div style={{ position: 'absolute', left: AI[0] - 130, top: AI[1] - 95, width: 260, height: 190, scale: String(pop(4) * (1 + 0.06 * aiIn)), opacity: pop(4) }}>
        <svg width={260} height={190} viewBox="0 0 260 190">
          <path d="M60 160 Q10 160 14 118 Q18 80 62 82 Q66 30 120 28 Q170 26 182 70 Q240 62 246 112 Q250 160 196 160 Z" fill="#efe9ff" stroke="#b79cff" strokeWidth={6} />
        </svg>
        <div style={{ position: 'absolute', inset: 0, top: 50, textAlign: 'center', fontFamily: FONT, fontSize: 56, fontWeight: 800, color: '#4b2a9a' }}>ИИ</div>
        {think ? (
          <div style={{ position: 'absolute', left: 0, right: 0, top: 128, textAlign: 'center', fontSize: 40, color: '#6b4ad0', letterSpacing: 6 }}>
            {'•••'.slice(0, 1 + (Math.floor(f / 4) % 3))}
          </div>
        ) : null}
      </div>
      <NodeLabel x={AI[0]} y={AI[1]} title="ИИ · Claude" sub="понимает вопрос, решает, какие данные нужны" o={pop(4)} />

      {/* Бот */}
      <Glow x={BOT[0]} y={BOT[1]} size={400} color="rgba(90,200,255,0.9)" o={botBusy * 0.8} />
      <Img src={staticFile('avatar.png')} style={{ position: 'absolute', left: BOT[0] - 110, top: BOT[1] - 110, width: 220, height: 220, borderRadius: '50%', border: '8px solid #bfeaff', scale: String(pop(0)) }} />
      <NodeLabel x={BOT[0]} y={BOT[1]} title="Бот ВИШ" sub="сервер бота: лимиты, инструменты, ответ в чат" o={pop(0)} />

      {/* База */}
      <Glow x={DB[0]} y={DB[1]} size={420} color="rgba(255,213,74,0.85)" o={dbGlow} />
      <div style={{ position: 'absolute', left: DB[0] - 100, top: DB[1] - 110, scale: String(pop(8)) }}>
        <svg width={200} height={220} viewBox="0 0 200 220">
          <path d="M10 40 L10 180 Q100 220 190 180 L190 40" fill="#dff7e8" stroke="#7fe0a8" strokeWidth={6} />
          <ellipse cx={100} cy={40} rx={90} ry={28} fill="#f3fff7" stroke="#7fe0a8" strokeWidth={6} />
          {[0, 1, 2].map((i) => (
            <path key={i} d={`M10 ${85 + i * 40} Q100 ${120 + i * 40} 190 ${85 + i * 40}`} fill="none" stroke={`rgba(255,190,0,${dbGlow})`} strokeWidth={10} />
          ))}
        </svg>
      </div>
      <NodeLabel x={DB[0]} y={DB[1]} title="База расписания" sub="SQLite на сервере бота" o={pop(8)} />

      {/* Портал */}
      <div style={{ position: 'absolute', left: PORTAL[0] - 120, top: PORTAL[1] - 36, width: 240, height: 72, borderRadius: 36, background: '#eaf4ff', border: '5px solid #9cc8ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT, fontWeight: 700, fontSize: 30, color: '#1f4f8a', opacity: pop(12) }}>
        tt.chuvsu.ru
      </div>
      <div style={{ position: 'absolute', left: PORTAL[0] + 140, top: PORTAL[1] - 22, fontFamily: FONT, fontSize: 28, color: 'rgba(220,255,235,0.8)', opacity: pop(12), width: 200, lineHeight: 1.2 }}>портал, раз в 6 минут</div>

      {/* Движение данных */}
      <Pulse from={PHONE_PORT} to={BOT} win={Q_TO_BOT} label="вопрос" />
      <Pulse from={BOT} to={AI} win={BOT_TO_AI} label="вопрос + пары" />
      <Chip name="find_subject" from={AI} to={BOT} win={TOOLS_TO_BOT} dx={-120} />
      <Chip name="get_schedule" from={AI} to={BOT} win={[TOOLS_TO_BOT[0] + 4, TOOLS_TO_BOT[1] + 4]} dx={140} />
      <Pulse from={BOT} to={DB} win={BOT_TO_DB} color="#ffd54a" label="запрос" />
      <Pulse from={DB} to={BOT} win={DB_TO_BOT} color="#ffd54a" label="пары по физике" />
      <Pulse from={BOT} to={AI} win={BOT_TO_AI2} color="#ffd54a" />
      <Pulse from={AI} to={BOT} win={AI_TO_BOT} color="#c9a8ff" label="ответ" />
      <Pulse from={BOT} to={PHONE_PORT} win={BOT_TO_PHONE} color="#c9a8ff" />
    </AbsoluteFill>
  );
};

/** Пузырь вопроса летит в аватар бота в шапке. */
const FlyToAvatar: React.FC = () => {
  const f = useCurrentFrame();
  if (f < FLY || f > FLY + 22) return null;
  const t = lerp(f, [FLY, FLY + 18], [0, 1], EASE_IN_OUT);
  const [x, y] = bezier(t, [780, 1430], [820, 700], [236, 452]);
  const s = 70 - 40 * t;
  return <div style={{ position: 'absolute', left: x - s / 2, top: y - s / 2, width: s, height: s, borderRadius: '50%', background: '#7fd8ff', boxShadow: '0 0 40px 18px #7fd8ff', opacity: 1 - ramp(f, FLY + 16, FLY + 22) }} />;
};

export const S10Ai: React.FC = () => {
  const f = useCurrentFrame();
  const shrink = ramp(f, SHRINK, SHRINK + 18, EASE_IN_OUT) * (1 - ramp(f, GROW[0], GROW[1], EASE_IN_OUT));
  const scale = 1 + (MINI - 1) * shrink;
  const dx = (MINI_X - 108) * shrink;
  const dy = (MINI_Y - 340) * shrink;
  return (
    <AbsoluteFill>
      <Backdrop />
      <AbsoluteFill style={{ background: '#07140e', opacity: 0.55 * shrink }} />
      <Caption
        caps={[
          { from: 0, to: SEND, text: 'Лень искать? Спроси словами' },
          { from: SEND, to: BOT_TO_AI[0], text: 'Вопрос летит к боту…' },
          { from: BOT_TO_AI[0], to: TOOLS_TO_BOT[0], text: '…бот передаёт его ИИ' },
          { from: TOOLS_TO_BOT[0], to: DB_GLOW[0], text: 'ИИ просит у бота данные' },
          { from: DB_GLOW[0], to: AI_FLASH[0], text: 'Бот достаёт пары из базы' },
          { from: AI_FLASH[0], to: ANSWER, text: 'ИИ собирает ответ' },
          { from: ANSWER, to: S10_DURATION, text: 'Ответ — через пару секунд' },
        ]}
      />
      <Phone style={{ scale: String(scale), transformOrigin: '0 0', translate: `${dx}px ${dy}px` }}>
        <Chat script={script} />
      </Phone>
      <Schematic />
      <FlyToAvatar />
    </AbsoluteFill>
  );
};
