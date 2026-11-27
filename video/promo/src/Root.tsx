import React from 'react';
import { Composition, Folder } from 'remotion';
import { Promo, PROMO_DURATION, SCENES } from './Promo';

const V = { fps: 30, width: 1080, height: 1920 } as const;

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="Promo" component={Promo} durationInFrames={PROMO_DURATION} {...V} />
    <Folder name="Promo-Scenes">
      {SCENES.map((s) => (
        <Composition key={s.id} id={s.id} component={s.component} durationInFrames={s.duration} {...V} />
      ))}
    </Folder>
  </>
);
