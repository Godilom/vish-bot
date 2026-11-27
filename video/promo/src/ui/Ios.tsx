import React from 'react';
import { Img, staticFile, useCurrentFrame } from 'remotion';
import { FONT } from '../fonts';
import { lerp, ramp } from './anim';
import { StatusBar } from './Chat';
import { TapMark } from './Tap';

const BLUE = '#007aff';

/** Системный диалог iOS «Подписаться на календарь?» поверх экрана. */
export const IosAlert: React.FC<{ at: number; tapAt: number; url: string }> = ({ at, tapAt, url }) => {
  const f = useCurrentFrame();
  if (f < at) return null;
  const p = ramp(f, at, at + 8);
  const out = ramp(f, tapAt + 6, tapAt + 12);
  return (
    <div style={{ position: 'absolute', inset: 0, background: `rgba(0,0,0,${0.35 * p * (1 - out)})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT, zIndex: 80 }}>
      <div style={{ width: 760, background: 'rgba(245,245,247,0.97)', borderRadius: 40, overflow: 'visible', scale: String(1.1 - 0.1 * p), opacity: p * (1 - out) }}>
        <div style={{ padding: '44px 44px 34px', textAlign: 'center' }}>
          <div style={{ fontSize: 40, fontWeight: 700, color: '#111' }}>Подписаться на календарь?</div>
          <div style={{ fontSize: 30, color: '#555', marginTop: 16, wordBreak: 'break-all' }}>{url}</div>
        </div>
        <div style={{ display: 'flex', borderTop: '1px solid #d1d1d6' }}>
          <div style={{ flex: 1, textAlign: 'center', padding: 30, fontSize: 38, color: BLUE, borderRight: '1px solid #d1d1d6' }}>Отменить</div>
          <div style={{ position: 'relative', flex: 1, textAlign: 'center', padding: 30, fontSize: 38, color: BLUE, fontWeight: 700 }}>
            Подписаться
            <TapMark at={tapAt} radius={20} />
          </div>
        </div>
      </div>
    </div>
  );
};

export type CalEvent = { start: number; end: number; title: string; place: string; at: number; changeAt?: number; newPlace?: string; cancelAt?: number };

const H0 = 8 * 60;
const PX = 3.9;
const fmt = (m: number) => `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}`;

const Event: React.FC<{ e: CalEvent }> = ({ e }) => {
  const f = useCurrentFrame();
  const p = ramp(f, e.at, e.at + 12);
  if (f < e.at) return null;
  const changed = e.changeAt !== undefined && f >= e.changeAt;
  const flash = e.changeAt !== undefined ? lerp(f, [e.changeAt, e.changeAt + 6, e.changeAt + 30], [0, 1, 0]) : 0;
  const cancelled = e.cancelAt !== undefined && f >= e.cancelAt;
  const cflash = e.cancelAt !== undefined ? lerp(f, [e.cancelAt, e.cancelAt + 6, e.cancelAt + 30], [0, 1, 0]) : 0;
  return (
    <div
      style={{
        position: 'absolute',
        left: 150,
        right: 30,
        top: (e.start - H0) * PX,
        height: (e.end - e.start) * PX - 6,
        borderRadius: 14,
        background: cancelled ? 'rgba(160,160,170,0.18)' : 'rgba(175,82,222,0.18)',
        borderLeft: `10px solid ${cancelled ? '#a0a0aa' : '#af52de'}`,
        padding: '14px 22px',
        opacity: p,
        translate: `0px ${(1 - p) * -260}px`,
        boxShadow: `0 0 0 ${8 * Math.max(flash, cflash)}px rgba(255,59,127,${0.6 * Math.max(flash, cflash)})`,
      }}
    >
      <div style={{ fontSize: 36, fontWeight: 700, color: cancelled ? '#8e8e93' : '#6b1d93', textDecoration: cancelled ? 'line-through' : 'none' }}>
        {cancelled ? `Отменено: ${e.title}` : e.title}
      </div>
      <div style={{ fontSize: 30, color: cancelled ? '#8e8e93' : '#8a3fb5', marginTop: 6 }}>
        {fmt(e.start)}–{fmt(e.end)} · {changed ? <b style={{ background: `rgba(255,214,10,${0.3 + flash * 0.6})`, borderRadius: 6, padding: '0 6px' }}>{e.newPlace}</b> : e.place}
      </div>
    </div>
  );
};

/** Приложение «Календарь», вид дня: четверг 26 ноября. */
export const IosCalendar: React.FC<{ events: CalEvent[]; time: string; nowMin: number }> = ({ events, time, nowMin }) => {
  const days = [
    ['П', 23],
    ['В', 24],
    ['С', 25],
    ['Ч', 26],
    ['П', 27],
    ['С', 28],
    ['В', 29],
  ] as const;
  return (
    <div style={{ position: 'absolute', inset: 0, background: 'white', fontFamily: FONT }}>
      <StatusBar time={time} />
      <div style={{ padding: '10px 36px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 36, color: '#ff3b30' }}>‹ Ноябрь</span>
        <span style={{ fontSize: 34, color: '#ff3b30' }}>☰ 🔍 ＋</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-around', padding: '30px 20px 10px' }}>
        {days.map(([d, n]) => (
          <div key={n} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 26, color: '#8e8e93' }}>{d}</span>
            <span
              style={{
                width: 76,
                height: 76,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 36,
                fontWeight: n === 26 ? 700 : 500,
                background: n === 26 ? '#ff3b30' : 'transparent',
                color: n === 26 ? 'white' : '#111',
              }}
            >
              {n}
            </span>
          </div>
        ))}
      </div>
      <div style={{ textAlign: 'center', fontSize: 32, color: '#111', fontWeight: 600, padding: '6px 0 20px', borderBottom: '1px solid #e5e5ea' }}>Четверг, 26 ноября 2026 г.</div>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 380, height: 1500 }}>
        {[8, 9, 10, 11, 12, 13, 14].map((h) => (
          <div key={h} style={{ position: 'absolute', left: 0, right: 0, top: (h * 60 - H0) * PX, display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ width: 120, textAlign: 'right', fontSize: 26, color: '#8e8e93' }}>{h}:00</span>
            <span style={{ flex: 1, height: 1, background: '#e5e5ea' }} />
          </div>
        ))}
        {events.map((e, i) => (
          <Event key={i} e={e} />
        ))}
        <div style={{ position: 'absolute', left: 110, right: 0, top: (nowMin - H0) * PX, height: 4, background: '#ff3b30' }}>
          <span style={{ position: 'absolute', left: -14, top: -10, width: 24, height: 24, borderRadius: '50%', background: '#ff3b30' }} />
        </div>
      </div>
    </div>
  );
};

/** Баннер уведомления сверху экрана. */
export const IosBanner: React.FC<{ at: number; dur: number; icon: 'calendar' | 'bot'; app: string; title: string; body: string; top?: number; tapAt?: number }> = ({ at, dur, icon, app, title, body, top = 90, tapAt }) => {
  const f = useCurrentFrame();
  if (f < at || f > at + dur) return null;
  const p = ramp(f, at, at + 10);
  const out = ramp(f, at + dur - 8, at + dur);
  return (
    <div
      style={{
        position: 'absolute',
        left: 30,
        right: 30,
        top,
        background: 'rgba(250,250,252,0.96)',
        borderRadius: 40,
        padding: '28px 30px',
        display: 'flex',
        gap: 24,
        fontFamily: FONT,
        boxShadow: '0 20px 50px rgba(0,0,0,0.25)',
        translate: `0px ${(1 - p) * -260 - out * 260}px`,
        zIndex: 90,
      }}
    >
      {icon === 'bot' ? (
        <Img src={staticFile('avatar.png')} style={{ width: 90, height: 90, borderRadius: 22 }} />
      ) : (
        <div style={{ width: 90, height: 90, borderRadius: 22, background: 'white', boxShadow: 'inset 0 0 0 2px #eee', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: 18, color: '#ff3b30', fontWeight: 700 }}>ЧТ</span>
          <span style={{ fontSize: 44, fontWeight: 600, lineHeight: 1 }}>26</span>
        </div>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 28, color: '#8e8e93' }}>
          <span style={{ fontWeight: 600, color: '#111' }}>{app}</span>
          <span>сейчас</span>
        </div>
        <div style={{ fontSize: 32, fontWeight: 700, color: '#111', marginTop: 6 }}>{title}</div>
        <div style={{ fontSize: 30, color: '#111', marginTop: 4, whiteSpace: 'pre-wrap', lineHeight: 1.3 }}>{body}</div>
      </div>
      {tapAt !== undefined ? <TapMark at={tapAt} radius={40} /> : null}
    </div>
  );
};

/** Экран блокировки. */
export const LockScreen: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(170deg, #2b5876 0%, #4e4376 100%)', fontFamily: FONT, color: 'white' }}>
    <StatusBar dark time="" />
    <div style={{ textAlign: 'center', marginTop: 70, fontSize: 40, fontWeight: 600 }}>Четверг, 26 ноября</div>
    <div style={{ textAlign: 'center', fontSize: 230, fontWeight: 700, lineHeight: 1.05, letterSpacing: -6 }}>7:40</div>
    <div style={{ position: 'absolute', left: 0, right: 0, top: 560 }}>{children}</div>
  </div>
);
