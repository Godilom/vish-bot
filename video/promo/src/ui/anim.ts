import { Easing, interpolate } from 'remotion';

const CLAMP = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;
export const EASE_OUT = Easing.bezier(0.16, 1, 0.3, 1);
export const EASE_IN_OUT = Easing.bezier(0.65, 0, 0.35, 1);

/** 0 → 1 between frames a and b (ease-out), clamped. */
export const ramp = (f: number, a: number, b: number, easing = EASE_OUT) => interpolate(f, [a, b], [0, 1], { ...CLAMP, easing });

/** Clamped linear interpolation with custom keyframes. */
export const lerp = (f: number, input: number[], output: number[], easing?: (t: number) => number) => interpolate(f, input, output, { ...CLAMP, easing });

/** Point on a quadratic Bézier curve. */
export function bezier(t: number, p0: [number, number], c: [number, number], p1: [number, number]): [number, number] {
  const u = 1 - t;
  return [u * u * p0[0] + 2 * u * t * c[0] + t * t * p1[0], u * u * p0[1] + 2 * u * t * c[1] + t * t * p1[1]];
}
