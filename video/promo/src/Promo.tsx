import React from 'react';
import { linearTiming, TransitionSeries } from '@remotion/transitions';
import { fade } from '@remotion/transitions/fade';
import { slide } from '@remotion/transitions/slide';
import { S0Hook, S0_DURATION } from './scenes/S0Hook';
import { S1Start, S1_DURATION } from './scenes/S1Start';
import { S2Days, S2_DURATION } from './scenes/S2Days';
import { S3Stream, S3_DURATION } from './scenes/S3Stream';
import { S4Student, S4_DURATION } from './scenes/S4Student';
import { S5Teacher, S5_DURATION } from './scenes/S5Teacher';
import { S6Calendar, S6_DURATION } from './scenes/S6Calendar';
import { S7Changes, S7_DURATION } from './scenes/S7Changes';
import { S8Settings, S8_DURATION } from './scenes/S8Settings';
import { S9Buttons, S9_DURATION } from './scenes/S9Buttons';
import { S10Ai, S10_DURATION } from './scenes/S10Ai';
import { S11Final, S11_DURATION } from './scenes/S11Final';

export const SCENES = [
  { id: 'S0Hook', component: S0Hook, duration: S0_DURATION },
  { id: 'S1Start', component: S1Start, duration: S1_DURATION },
  { id: 'S2Days', component: S2Days, duration: S2_DURATION },
  { id: 'S3Stream', component: S3Stream, duration: S3_DURATION },
  { id: 'S4Student', component: S4Student, duration: S4_DURATION },
  { id: 'S5Teacher', component: S5Teacher, duration: S5_DURATION },
  { id: 'S6Calendar', component: S6Calendar, duration: S6_DURATION },
  { id: 'S7Changes', component: S7Changes, duration: S7_DURATION },
  { id: 'S8Settings', component: S8Settings, duration: S8_DURATION },
  { id: 'S9Buttons', component: S9Buttons, duration: S9_DURATION },
  { id: 'S10Ai', component: S10Ai, duration: S10_DURATION },
  { id: 'S11Final', component: S11Final, duration: S11_DURATION },
] as const;

const T = 10;
export const PROMO_DURATION = SCENES.reduce((s, x) => s + x.duration, 0) - T * (SCENES.length - 1);

export const Promo: React.FC = () => (
  <TransitionSeries>
    {SCENES.map(({ id, component: Scene, duration }, i) => (
      <React.Fragment key={id}>
        {i > 0 ? (
          <TransitionSeries.Transition
            presentation={i === 1 || i === SCENES.length - 1 ? fade() : slide({ direction: 'from-right' })}
            timing={linearTiming({ durationInFrames: T })}
          />
        ) : null}
        <TransitionSeries.Sequence name={id} durationInFrames={duration}>
          <Scene />
        </TransitionSeries.Sequence>
      </React.Fragment>
    ))}
  </TransitionSeries>
);
