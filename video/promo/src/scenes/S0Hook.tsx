import React from 'react';
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from 'remotion';
import { FONT } from '../fonts';
import { lerp, ramp } from '../ui/anim';
import { Backdrop } from '../ui/Stage';

export const S0_DURATION = 100;

const ICONS = ['📅', '🗓', '🎓', '👨‍🏫', '📆', '🔔', '🎨', '🤖'];

export const S0Hook: React.FC = () => {
  const f = useCurrentFrame();
  const avatar = ramp(f, 0, 16);
  const title = ramp(f, 10, 26);
  const sub = ramp(f, 22, 38);
  const suck = ramp(f, 78, 98);
  return (
    <AbsoluteFill style={{ fontFamily: FONT }}>
      <Backdrop />
      {ICONS.map((ic, i) => {
        const a = (i / ICONS.length) * Math.PI * 2 + f / 40;
        const r = lerp(f, [4 + i * 2, 22 + i * 2], [0, 330]) * (1 - suck);
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: 540 + Math.cos(a) * r - 50,
              top: 700 + Math.sin(a) * r * 0.8 - 50,
              width: 100,
              height: 100,
              fontSize: 76,
              textAlign: 'center',
              opacity: ramp(f, 4 + i * 2, 14 + i * 2) * (1 - suck),
            }}
          >
            {ic}
          </div>
        );
      })}
      <Img
        src={staticFile('avatar.png')}
        style={{
          position: 'absolute',
          left: 540 - 150,
          top: 700 - 150,
          width: 300,
          height: 300,
          borderRadius: '50%',
          border: '10px solid rgba(255,255,255,0.25)',
          scale: String((0.6 + 0.4 * avatar) * (1 - 0.3 * suck)),
          opacity: avatar * (1 - suck),
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: 70,
          right: 70,
          top: 1100,
          textAlign: 'center',
          color: 'white',
          fontWeight: 800,
          fontSize: 96,
          lineHeight: 1.08,
          letterSpacing: -2,
          opacity: title * (1 - suck),
          translate: `0px ${(1 - title) * 50}px`,
        }}
      >
        Всё расписание ВИШ — в одном чате
      </div>
      <div style={{ position: 'absolute', left: 70, right: 70, top: 1480, textAlign: 'center', color: 'rgba(220,255,235,0.85)', fontWeight: 600, fontSize: 48, opacity: sub * (1 - suck) }}>
        Бот ВИШ в Telegram
      </div>
    </AbsoluteFill>
  );
};
