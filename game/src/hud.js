// hud.js — the top HUD strip: title, the big labelled alarm meter, loot count,
// tools with their remaining counts, timer, score, each guard's live status,
// and the current objective. Everything the player needs to read before moving
// is in this one strip, above the room.

import { HUD_H } from './level.js';
import { alarmBand } from './alarm.js';
import { LOOT } from './level.js';

export function drawHUD(ctx, state) {
  ctx.save();
  // Strip background.
  ctx.fillStyle = '#0d1220';
  ctx.fillRect(0, 0, 1280, HUD_H);
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(0, HUD_H - 3, 1280, 3);

  // Title block.
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#fbbf24';
  ctx.font = 'bold 26px Georgia, serif';
  ctx.fillText('THE SAFFRON VAULT', 16, 26);
  ctx.fillStyle = '#94a3b8';
  ctx.font = '12px Verdana, sans-serif';
  ctx.fillText('steal the diamond · slip out the exit', 16, 52);

  // Alarm meter: the biggest, most readable element in the strip.
  const band = alarmBand(state.alarm);
  const meterX = 330;
  const meterY = 14;
  const meterW = 300;
  const meterH = 30;
  ctx.fillStyle = '#e2e8f0';
  ctx.font = 'bold 13px Verdana, sans-serif';
  ctx.fillText('ALARM', meterX, meterY + 9);
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(meterX + 62, meterY, meterW, meterH);
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 2;
  ctx.strokeRect(meterX + 62, meterY, meterW, meterH);
  const fillW = (meterW - 4) * (state.alarm / 100);
  ctx.fillStyle = band.color;
  ctx.fillRect(meterX + 64, meterY + 2, Math.max(0, fillW), meterH - 4);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 15px Verdana, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(Math.round(state.alarm) + '', meterX + 62 + meterW / 2, meterY + meterH / 2 + 1);
  ctx.textAlign = 'left';
  ctx.fillStyle = band.color;
  ctx.font = 'bold 13px Verdana, sans-serif';
  ctx.fillText(band.label, meterX + 62, meterY + meterH + 16);
  if (state.alarmRising) {
    ctx.fillStyle = '#ef4444';
    ctx.font = 'bold 12px Verdana, sans-serif';
    ctx.fillText('▲ SEEN!', meterX + 62 + meterW + 10, meterY + meterH / 2);
  }

  // Loot count.
  const lootX = 760;
  ctx.fillStyle = '#e2e8f0';
  ctx.font = 'bold 13px Verdana, sans-serif';
  ctx.fillText('LOOT', lootX, 22);
  ctx.fillStyle = '#fbbf24';
  ctx.font = 'bold 22px Verdana, sans-serif';
  const lootGot = state.lootTaken.size + (state.diamondTaken ? 1 : 0);
  ctx.fillText(lootGot + ' / ' + (LOOT.length + 1), lootX, 50);
  ctx.fillStyle = state.diamondTaken ? '#fbbf24' : '#64748b';
  ctx.font = '12px Verdana, sans-serif';
  ctx.fillText(state.diamondTaken ? '◆ DIAMOND SECURED' : '◆ diamond: locked case', lootX, 72);

  // Tools with counts.
  const toolsX = 930;
  ctx.fillStyle = '#e2e8f0';
  ctx.font = 'bold 13px Verdana, sans-serif';
  ctx.fillText('TOOLS', toolsX, 22);
  ctx.font = '14px Verdana, sans-serif';
  ctx.fillStyle = state.coins > 0 ? '#fde68a' : '#475569';
  ctx.fillText('◉ coin ×' + state.coins + '  (click)', toolsX, 46);
  ctx.fillStyle = state.smoke > 0 ? '#c4b5fd' : '#475569';
  ctx.fillText('☁ smoke ×' + state.smoke + '  (Q)', toolsX, 70);

  // Timer and score.
  const scoreX = 1130;
  ctx.fillStyle = '#e2e8f0';
  ctx.font = 'bold 13px Verdana, sans-serif';
  ctx.fillText('SCORE ' + state.score, scoreX, 22);
  ctx.fillStyle = '#94a3b8';
  ctx.font = '14px Verdana, sans-serif';
  ctx.fillText('TIME ' + formatTime(state.time), scoreX, 46);
  ctx.fillText(state.muted ? 'M: muted' : 'M: sound on', scoreX, 70);

  // Guard status row: one chip per guard, coloured by state.
  let chipX = 330;
  const chipY = 66;
  ctx.font = 'bold 11px Verdana, sans-serif';
  for (const guard of state.guards) {
    const label = guard.name.toUpperCase() + ': ' + guard.state.toUpperCase();
    const w = ctx.measureText(label).width + 14;
    ctx.fillStyle = guardStateColor(guard.state);
    ctx.fillRect(chipX, chipY, w, 18);
    ctx.fillStyle = '#0f172a';
    ctx.textAlign = 'center';
    ctx.fillText(label, chipX + w / 2, chipY + 9);
    ctx.textAlign = 'left';
    chipX += w + 6;
  }

  // Objective line, bottom of the strip.
  ctx.fillStyle = '#cbd5e1';
  ctx.font = '12px Verdana, sans-serif';
  ctx.fillText(objectiveText(state), 16, HUD_H - 10);
  ctx.restore();
}

function guardStateColor(guardState) {
  if (guardState === 'alert') return '#ef4444';
  if (guardState === 'suspicious') return '#f97316';
  if (guardState === 'investigate' || guardState === 'search') return '#eab308';
  return '#38bdf8';
}

export function formatTime(seconds) {
  const total = Math.floor(seconds);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return m + ':' + String(s).padStart(2, '0');
}

function objectiveText(state) {
  if (state.screen === 'menu') return 'Press ENTER or click to start the heist.';
  if (state.diamondTaken) return 'OBJECTIVE: reach the green EXIT door, bottom right — the getaway is waiting.';
  if (state.lockpickProgress > 0) return 'OBJECTIVE: hold E — picking the diamond case lock…';
  return 'OBJECTIVE: grab 6 artifacts (E), pick the Saffron Diamond case (hold E), then reach the EXIT.';
}
