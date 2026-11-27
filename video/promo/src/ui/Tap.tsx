import React from 'react';
import { useCurrentFrame } from 'remotion';
import { lerp } from './anim';

export const PINK = '#ff3b7f';

/**
 * Нажатие на элемент: розовая рамка при подлёте пальца, круг касания,
 * «вдавливание» и волна. Кладётся внутрь элемента (position: relative),
 * поэтому координаты не нужны. `at` — кадр нажатия.
 */
export const TapMark: React.FC<{ at: number; radius?: number }> = ({ at, radius = 18 }) => {
  const f = useCurrentFrame();
  if (f < at - 16 || f > at + 18) return null;
  const outline = lerp(f, [at - 14, at - 8, at + 6, at + 14], [0, 1, 1, 0]);
  const fingerIn = lerp(f, [at - 16, at - 3], [0, 1]);
  const fingerOut = lerp(f, [at + 6, at + 16], [1, 0]);
  const press = lerp(f, [at - 3, at, at + 5], [1, 0.78, 1]);
  const ripple = lerp(f, [at, at + 14], [0, 1]);
  return (
    <>
      <div
        style={{
          position: 'absolute',
          inset: -7,
          borderRadius: radius + 7,
          border: `6px solid ${PINK}`,
          opacity: outline,
          pointerEvents: 'none',
          zIndex: 40,
        }}
      />
      <div style={{ position: 'absolute', inset: 0, borderRadius: radius, overflow: 'hidden', pointerEvents: 'none', zIndex: 41 }}>
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            width: 120,
            height: 120,
            marginLeft: -60,
            marginTop: -60,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.75)',
            scale: String(ripple * 4),
            opacity: f >= at ? 0.55 * (1 - ripple) : 0,
          }}
        />
      </div>
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          width: 104,
          height: 104,
          marginLeft: -52,
          marginTop: -52,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.45)',
          border: `6px solid ${PINK}`,
          boxShadow: '0 10px 30px rgba(0,0,0,0.25)',
          translate: `${(1 - fingerIn) * 90}px ${(1 - fingerIn) * 140}px`,
          scale: String(press),
          opacity: fingerIn * fingerOut,
          pointerEvents: 'none',
          zIndex: 42,
        }}
      />
    </>
  );
};

/** Затемнение нажатой кнопки на пару кадров. */
export const pressShade = (f: number, at?: number) => (at === undefined ? 0 : lerp(f, [at - 1, at, at + 6], [0, 0.18, 0]));
