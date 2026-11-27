import React from 'react';
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from 'remotion';
import { FONT } from '../fonts';
import { Chat, type ChatScript } from '../ui/Chat';
import { EASE_IN_OUT, ramp } from '../ui/anim';
import { Backdrop, Phone } from '../ui/Stage';
import { ownMenu } from '../data';

export const S11_DURATION = 150;

const script: ChatScript = {
  msgs: [{ from: 'bot', at: -1, photo: 'day-today-timeline', kb: [[{ t: '◀️ 25.11' }, { t: '27.11 ▶️' }], [{ t: '🗓 Неделя' }]] }],
  replyKb: [{ at: -100, rows: ownMenu() }],
};

const FEATURES = ['📅 Сегодня, завтра, неделя', '🎓 Поток, студенты, преподаватели', '📆 Календарь телефона', '🔔 Изменения — сразу', '🎨 Темы и свои кнопки', '🤖 Вопросы ИИ своими словами'];

export const S11Final: React.FC = () => {
  const f = useCurrentFrame();
  const away = ramp(f, 30, 56, EASE_IN_OUT);
  const logo = ramp(f, 46, 62);
  return (
    <AbsoluteFill style={{ fontFamily: FONT }}>
      <Backdrop />
      <Phone style={{ scale: String(1 - 0.35 * away), opacity: 1 - away, translate: `0px ${away * 300}px`, transformOrigin: '50% 100%' }}>
        <Chat script={script} />
      </Phone>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 230, display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: logo, scale: String(0.9 + 0.1 * logo) }}>
        <Img src={staticFile('avatar.png')} style={{ width: 260, height: 260, borderRadius: '50%', border: '10px solid rgba(255,255,255,0.25)' }} />
        <div style={{ color: 'white', fontWeight: 800, fontSize: 120, marginTop: 40, letterSpacing: -3 }}>Бот ВИШ</div>
        <div style={{ color: 'rgba(220,255,235,0.9)', fontWeight: 600, fontSize: 48, marginTop: 10, textAlign: 'center' }}>Расписание ВИШ ЧувГУ</div>
        <div style={{ color: 'rgba(220,255,235,0.9)', fontWeight: 600, fontSize: 48, textAlign: 'center' }}>в Telegram и МАКС</div>
        <div style={{ marginTop: 70, display: 'flex', flexDirection: 'column', gap: 22 }}>
          {FEATURES.map((t, i) => (
            <div
              key={t}
              style={{
                color: 'white',
                fontSize: 46,
                fontWeight: 600,
                background: 'rgba(255,255,255,0.1)',
                borderRadius: 24,
                padding: '16px 34px',
                opacity: ramp(f, 62 + i * 6, 74 + i * 6),
                translate: `${(1 - ramp(f, 62 + i * 6, 74 + i * 6)) * 60}px 0px`,
              }}
            >
              {t}
            </div>
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
};
