import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { FONT } from '../fonts';
import { ramp } from './anim';
import { H, W } from './Chat';

/** Тёмно-зелёный фон с медленно плывущими пятнами света. */
export const Backdrop: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: 'linear-gradient(165deg, #0f2a1f 0%, #1d4a33 55%, #2f6a45 100%)', overflow: 'hidden' }}>
      <div
        style={{
          position: 'absolute',
          width: 900,
          height: 900,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(120,220,160,0.35) 0%, rgba(120,220,160,0) 65%)',
          left: -300 + 120 * Math.sin(f / 70),
          top: 200 + 100 * Math.cos(f / 90),
        }}
      />
      <div
        style={{
          position: 'absolute',
          width: 800,
          height: 800,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(90,190,255,0.25) 0%, rgba(90,190,255,0) 65%)',
          right: -260 + 100 * Math.cos(f / 80),
          bottom: 100 + 120 * Math.sin(f / 60),
        }}
      />
    </AbsoluteFill>
  );
};

export type Cap = { from: number; to: number; text: string };

/** Крупная подпись над телефоном. */
export const Caption: React.FC<{ caps: Cap[] }> = ({ caps }) => {
  const f = useCurrentFrame();
  const c = caps.find((x) => f >= x.from && f < x.to);
  if (!c) return null;
  const p = ramp(f, c.from, c.from + 12);
  const out = ramp(f, c.to - 8, c.to);
  return (
    <div
      style={{
        position: 'absolute',
        left: 70,
        right: 70,
        top: 80,
        height: 230,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        color: 'white',
        fontFamily: FONT,
        fontWeight: 800,
        fontSize: 70,
        lineHeight: 1.12,
        letterSpacing: -1,
        opacity: p * (1 - out),
        translate: `0px ${(1 - p) * 40 - out * 20}px`,
        textShadow: '0 6px 30px rgba(0,0,0,0.35)',
      }}
    >
      {c.text}
    </div>
  );
};

export const PHONE_SCALE = 0.8;
export const PHONE_X = (W - W * PHONE_SCALE) / 2;
export const PHONE_Y = 340;

/** Телефон: рамка и экран 1080×1920, уменьшенный до 0.8. */
export const Phone: React.FC<{ children: React.ReactNode; style?: React.CSSProperties; enter?: boolean }> = ({ children, style, enter }) => {
  const f = useCurrentFrame();
  const p = enter ? ramp(f, 0, 18) : 1;
  return (
    <div
      style={{
        position: 'absolute',
        left: PHONE_X,
        top: PHONE_Y,
        width: W * PHONE_SCALE,
        height: H * PHONE_SCALE,
        translate: `0px ${(1 - p) * 700}px`,
        ...style,
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: -14,
          borderRadius: 74,
          background: '#0b1310',
          boxShadow: '0 40px 90px rgba(0,0,0,0.5), inset 0 0 0 3px #2c3a34',
        }}
      />
      <div style={{ position: 'absolute', inset: 0, borderRadius: 62, overflow: 'hidden', background: 'white' }}>
        <div style={{ position: 'absolute', left: 0, top: 0, width: W, height: H, scale: String(PHONE_SCALE), transformOrigin: '0 0' }}>{children}</div>
      </div>
    </div>
  );
};

/** Сцена с телефоном: фон, подпись, экран. */
export const PhoneScene: React.FC<{ caps: Cap[]; children: React.ReactNode; overlay?: React.ReactNode }> = ({ caps, children, overlay }) => (
  <AbsoluteFill>
    <Backdrop />
    <Caption caps={caps} />
    <Phone>{children}</Phone>
    {overlay}
  </AbsoluteFill>
);

