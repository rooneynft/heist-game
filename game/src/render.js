// render.js — draws everything on the canvas: the marble gallery, the display
// cases, the planters and shadow spots, the guards with their vision cones, the
// sweeping camera cones, the loot, the diamond, the thief, the thrown coin and
// smoke, plus the menu, pause, win and caught screens. Safe cover is green and
// dark, danger is red and amber, loot is gold — readable at a glance.

import {
  ROOM,
  WALLS,
  CASES,
  PLANTERS,
  HIDING_ZONES,
  DIAMOND,
  LOOT,
  EXIT,
  HUD_H,
} from './level.js';
import { GUARD_VIEW_RANGE, GUARD_VIEW_HALF_ANGLE } from './guards.js';
import { CAMERA_VIEW_RANGE, CAMERA_VIEW_HALF_ANGLE } from './cameras.js';
import { formatTime } from './hud.js';

export function drawGame(ctx, state) {
  // Clear only the room area: the HUD strip above it is drawn separately
  // and must never be erased by the room's redraw.
  ctx.clearRect(0, HUD_H, 1280, 800 - HUD_H);
  drawRoom(ctx, state);
  drawHidingZones(ctx);
  drawLoot(ctx, state);
  drawDiamond(ctx, state);
  drawExit(ctx, state);
  drawCameraCones(ctx, state);
  drawGuardCones(ctx, state);
  drawCameras(ctx, state);
  drawGuards(ctx, state);
  drawSmokes(ctx, state);
  drawThrownCoin(ctx, state);
  drawThief(ctx, state);
  drawLockpickBar(ctx, state);
  drawMessage(ctx, state);
  if (state.screen === 'menu') drawMenu(ctx, state);
  if (state.screen === 'paused') drawPause(ctx);
  if (state.screen === 'won') drawWin(ctx, state);
  if (state.screen === 'caught') drawCaught(ctx, state);
}

function drawRoom(ctx) {
  // Marble floor: alternating dark tiles.
  ctx.fillStyle = '#1c2436';
  ctx.fillRect(ROOM.x, ROOM.y, ROOM.w, ROOM.h);
  const tile = 64;
  for (let y = ROOM.y; y < ROOM.y + ROOM.h; y += tile) {
    for (let x = ROOM.x; x < ROOM.x + ROOM.w; x += tile) {
      const even = ((x - ROOM.x) / tile + (y - ROOM.y) / tile) % 2 === 0;
      ctx.fillStyle = even ? '#232e47' : '#1c2436';
      ctx.fillRect(x, y, tile, tile);
    }
  }
  // Red carpet runner down the middle of the room.
  ctx.fillStyle = '#7f1d1d';
  ctx.fillRect(ROOM.x, 428, ROOM.w, 54);
  ctx.fillStyle = '#b45309';
  ctx.fillRect(ROOM.x, 428, ROOM.w, 3);
  ctx.fillRect(ROOM.x, 479, ROOM.w, 3);
  // Gold trim around the room.
  ctx.strokeStyle = '#b45309';
  ctx.lineWidth = 4;
  ctx.strokeRect(ROOM.x + 2, ROOM.y + 2, ROOM.w - 4, ROOM.h - 4);

  // Inner partitions.
  for (const wall of WALLS) {
    ctx.fillStyle = '#3b2f2f';
    ctx.fillRect(wall.x, wall.y, wall.w, wall.h);
    ctx.strokeStyle = '#78716c';
    ctx.lineWidth = 2;
    ctx.strokeRect(wall.x, wall.y, wall.w, wall.h);
  }

  // Display cases: glass boxes on dark plinths.
  for (const c of CASES) {
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(c.x - 4, c.y - 4, c.w + 8, c.h + 8);
    ctx.fillStyle = '#475569';
    ctx.fillRect(c.x, c.y, c.w, c.h);
    ctx.fillStyle = 'rgba(147, 197, 253, 0.25)';
    ctx.fillRect(c.x + 4, c.y + 4, c.w - 8, c.h - 8);
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 2;
    ctx.strokeRect(c.x, c.y, c.w, c.h);
    ctx.fillStyle = '#e2e8f0';
    ctx.font = 'bold 11px Verdana, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(c.label, c.x + c.w / 2, c.y + c.h / 2);
    ctx.textAlign = 'left';
  }
}

function drawHidingZones(ctx) {
  // Planters: big green bushes the thief can crouch behind.
  for (const p of PLANTERS) {
    ctx.fillStyle = '#14532d';
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#22c55e';
    ctx.beginPath();
    ctx.arc(p.x - 8, p.y - 6, 12, 0, Math.PI * 2);
    ctx.arc(p.x + 10, p.y + 4, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#bbf7d0';
    ctx.font = 'bold 10px Verdana, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('HIDE', p.x, p.y + p.r + 12);
    ctx.textAlign = 'left';
  }
  // Shadow vent and curtains: dark safe strips.
  for (const z of HIDING_ZONES) {
    ctx.fillStyle = 'rgba(2, 6, 23, 0.75)';
    ctx.fillRect(z.x, z.y, z.w, z.h);
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    ctx.strokeRect(z.x, z.y, z.w, z.h);
    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 10px Verdana, sans-serif';
    ctx.textAlign = 'center';
    if (z.w > z.h) {
      ctx.fillText('SHADOW VENT — HIDE HERE', z.x + z.w / 2, z.y + z.h / 2 + 4);
    } else {
      ctx.save();
      ctx.translate(z.x + z.w / 2, z.y + z.h / 2);
      ctx.rotate(Math.PI / 2);
      ctx.fillText('CURTAIN', 0, 4);
      ctx.restore();
    }
    ctx.textAlign = 'left';
  }
}

function drawLoot(ctx, state) {
  for (const item of LOOT) {
    if (state.lootTaken.has(item.id)) continue;
    const pulse = 1 + Math.sin(state.time * 4 + item.x) * 0.08;
    ctx.save();
    ctx.translate(item.x, item.y);
    ctx.scale(pulse, pulse);
    // Glow ring so loot reads from across the room.
    ctx.fillStyle = 'rgba(251, 191, 36, 0.25)';
    ctx.beginPath();
    ctx.arc(0, 0, 24, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = item.color;
    ctx.beginPath();
    ctx.arc(0, 0, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 12px Verdana, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('$', 0, 1);
    ctx.restore();
    ctx.fillStyle = '#fde68a';
    ctx.font = 'bold 11px Verdana, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(item.name.toUpperCase(), item.x, item.y + 30);
    ctx.textAlign = 'left';
  }
}

function drawDiamond(ctx, state) {
  const cx = DIAMOND.x + DIAMOND.w / 2;
  const cy = DIAMOND.y + DIAMOND.h / 2;
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(DIAMOND.x - 6, DIAMOND.y - 6, DIAMOND.w + 12, DIAMOND.h + 12);
  ctx.strokeStyle = '#fbbf24';
  ctx.lineWidth = 3;
  ctx.strokeRect(DIAMOND.x - 6, DIAMOND.y - 6, DIAMOND.w + 12, DIAMOND.h + 12);
  if (!state.diamondTaken) {
    const glow = 0.5 + Math.sin(state.time * 3) * 0.2;
    ctx.fillStyle = `rgba(251, 191, 36, ${glow})`;
    ctx.beginPath();
    ctx.arc(cx, cy, 34, 0, Math.PI * 2);
    ctx.fill();
    // The diamond itself.
    ctx.fillStyle = '#fde68a';
    ctx.beginPath();
    ctx.moveTo(cx, cy - 18);
    ctx.lineTo(cx + 16, cy - 2);
    ctx.lineTo(cx, cy + 18);
    ctx.lineTo(cx - 16, cy - 2);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#fff7ed';
    ctx.beginPath();
    ctx.moveTo(cx, cy - 18);
    ctx.lineTo(cx + 16, cy - 2);
    ctx.lineTo(cx - 16, cy - 2);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 13px Verdana, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('SAFFRON DIAMOND', cx, DIAMOND.y - 16);
    ctx.fillStyle = '#e2e8f0';
    ctx.font = '11px Verdana, sans-serif';
    ctx.fillText('hold E to pick the lock (3s)', cx, DIAMOND.y + DIAMOND.h + 22);
    ctx.textAlign = 'left';
  } else {
    ctx.fillStyle = '#22c55e';
    ctx.font = 'bold 12px Verdana, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('◆ TAKEN', cx, cy + 4);
    ctx.textAlign = 'left';
  }
}

function drawExit(ctx, state) {
  ctx.fillStyle = state.diamondTaken ? '#15803d' : '#14532d';
  ctx.fillRect(EXIT.x, EXIT.y, EXIT.w, EXIT.h);
  ctx.strokeStyle = '#22c55e';
  ctx.lineWidth = 3;
  ctx.strokeRect(EXIT.x, EXIT.y, EXIT.w, EXIT.h);
  ctx.fillStyle = '#bbf7d0';
  ctx.font = 'bold 16px Verdana, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('EXIT →', EXIT.x + EXIT.w / 2, EXIT.y + EXIT.h / 2);
  ctx.textAlign = 'left';
  if (!state.diamondTaken) {
    ctx.fillStyle = '#94a3b8';
    ctx.font = '11px Verdana, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('needs the diamond', EXIT.x + EXIT.w / 2, EXIT.y - 10);
    ctx.textAlign = 'left';
  }
}

function drawCone(ctx, x, y, angle, range, halfAngle, fill, edge) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.arc(x, y, range, angle - halfAngle, angle + halfAngle);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = edge;
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

function drawCameraCones(ctx, state) {
  for (const camera of state.cameras) {
    const fill = camera.seeing
      ? 'rgba(239, 68, 68, 0.34)'
      : 'rgba(239, 68, 68, 0.13)';
    drawCone(ctx, camera.x, camera.y, camera.angle, CAMERA_VIEW_RANGE,
      CAMERA_VIEW_HALF_ANGLE, fill, 'rgba(239, 68, 68, 0.5)');
  }
}

function drawGuardCones(ctx, state) {
  for (const guard of state.guards) {
    const fill = guard.state === 'alert'
      ? 'rgba(239, 68, 68, 0.36)'
      : guard.state === 'suspicious'
        ? 'rgba(249, 115, 22, 0.28)'
        : 'rgba(251, 191, 36, 0.16)';
    const edge = guard.state === 'alert'
      ? 'rgba(239, 68, 68, 0.7)'
      : 'rgba(251, 191, 36, 0.45)';
    drawCone(ctx, guard.x, guard.y, guard.angle, GUARD_VIEW_RANGE,
      GUARD_VIEW_HALF_ANGLE, fill, edge);
  }
}

function drawCameras(ctx, state) {
  for (const camera of state.cameras) {
    ctx.fillStyle = camera.seeing ? '#ef4444' : '#64748b';
    ctx.beginPath();
    ctx.arc(camera.x, camera.y, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = camera.seeing ? '#ef4444' : '#cbd5e1';
    ctx.font = 'bold 10px Verdana, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(camera.name + (camera.seeing ? ' ● SEEING YOU' : ''), camera.x, camera.y + 24);
    ctx.textAlign = 'left';
  }
}

function drawGuards(ctx, state) {
  for (const guard of state.guards) {
    // Body.
    ctx.fillStyle = guard.color;
    ctx.beginPath();
    ctx.arc(guard.x, guard.y, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2;
    ctx.stroke();
    // Facing tick.
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(guard.x, guard.y);
    ctx.lineTo(guard.x + Math.cos(guard.angle) * 18, guard.y + Math.sin(guard.angle) * 18);
    ctx.stroke();
    // Name + state label.
    ctx.fillStyle = '#f1f5f9';
    ctx.font = 'bold 11px Verdana, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(guard.name + ' · ' + guard.state.toUpperCase(), guard.x, guard.y - 22);
    ctx.textAlign = 'left';
    // Alert mark.
    if (guard.state === 'alert' || guard.state === 'suspicious') {
      ctx.fillStyle = guard.state === 'alert' ? '#ef4444' : '#f97316';
      ctx.font = 'bold 18px Verdana, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('!', guard.x, guard.y - 34);
      ctx.textAlign = 'left';
    }
  }
}

function drawSmokes(ctx, state) {
  for (const smoke of state.smokes) {
    const alpha = Math.min(0.75, smoke.t * 0.2);
    ctx.fillStyle = `rgba(203, 213, 225, ${alpha})`;
    ctx.beginPath();
    ctx.arc(smoke.x, smoke.y, smoke.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(148, 163, 184, 0.9)';
    ctx.font = 'bold 11px Verdana, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('SMOKE', smoke.x, smoke.y);
    ctx.textAlign = 'left';
  }
}

function drawThrownCoin(ctx, state) {
  const coin = state.thrownCoin;
  if (!coin) return;
  ctx.fillStyle = '#fde68a';
  ctx.beginPath();
  ctx.arc(coin.x, coin.y, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#b45309';
  ctx.lineWidth = 2;
  ctx.stroke();
}

function drawThief(ctx, state) {
  const thief = state.thief;
  // Sneak ring: a faint circle while sneaking.
  if (thief.sneaking) {
    ctx.strokeStyle = 'rgba(34, 197, 94, 0.6)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(thief.x, thief.y, 20, 0, Math.PI * 2);
    ctx.stroke();
  }
  // Shadow.
  ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
  ctx.beginPath();
  ctx.ellipse(thief.x, thief.y + 10, 12, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  // Body: a thief in a dark hood with a gold trim.
  ctx.fillStyle = '#111827';
  ctx.beginPath();
  ctx.arc(thief.x, thief.y, 13, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#fbbf24';
  ctx.lineWidth = 2;
  ctx.stroke();
  // Eyes looking where the thief faces.
  ctx.fillStyle = '#fde68a';
  ctx.beginPath();
  ctx.arc(thief.x + thief.dirX * 5 - thief.dirY * 4, thief.y + thief.dirY * 5 + thief.dirX * 4, 2.5, 0, Math.PI * 2);
  ctx.arc(thief.x + thief.dirX * 5 + thief.dirY * 4, thief.y + thief.dirY * 5 - thief.dirX * 4, 2.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#f1f5f9';
  ctx.font = 'bold 11px Verdana, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('YOU' + (thief.hidden ? ' · HIDDEN' : thief.sneaking ? ' · SNEAKING' : ''), thief.x, thief.y - 22);
  ctx.textAlign = 'left';
}

function drawLockpickBar(ctx, state) {
  if (state.lockpickProgress <= 0 || state.diamondTaken) return;
  const cx = DIAMOND.x + DIAMOND.w / 2;
  const y = DIAMOND.y + DIAMOND.h + 34;
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(cx - 60, y, 120, 12);
  ctx.fillStyle = '#fbbf24';
  ctx.fillRect(cx - 58, y + 2, 116 * (state.lockpickProgress / DIAMOND.lockpickSeconds), 8);
  ctx.fillStyle = '#fde68a';
  ctx.font = 'bold 11px Verdana, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('PICKING LOCK…', cx, y + 26);
  ctx.textAlign = 'left';
}

function drawMessage(ctx, state) {
  if (!state.message || state.messageTime <= 0) return;
  ctx.save();
  ctx.globalAlpha = Math.min(1, state.messageTime);
  ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
  ctx.font = 'bold 15px Verdana, sans-serif';
  const w = ctx.measureText(state.message).width + 28;
  ctx.fillRect(640 - w / 2, 760, w, 28);
  ctx.strokeStyle = '#fbbf24';
  ctx.lineWidth = 1;
  ctx.strokeRect(640 - w / 2, 760, w, 28);
  ctx.fillStyle = '#fde68a';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(state.message, 640, 774);
  ctx.restore();
}

function overlay(ctx, alpha) {
  ctx.fillStyle = `rgba(2, 6, 23, ${alpha})`;
  ctx.fillRect(0, HUD_H, 1280, 800 - HUD_H);
}

function panel(ctx, x, y, w, h) {
  ctx.fillStyle = '#0d1220';
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = '#fbbf24';
  ctx.lineWidth = 3;
  ctx.strokeRect(x, y, w, h);
}

function drawMenu(ctx, state) {
  overlay(ctx, 0.72);
  panel(ctx, 290, 180, 700, 440);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#fbbf24';
  ctx.font = 'bold 44px Georgia, serif';
  ctx.fillText('THE SAFFRON VAULT', 640, 240);
  ctx.fillStyle = '#e2e8f0';
  ctx.font = '16px Verdana, sans-serif';
  ctx.fillText('One thief. Four guards. Three cameras. One diamond.', 640, 276);
  ctx.fillStyle = '#cbd5e1';
  ctx.font = '14px Verdana, sans-serif';
  const lines = [
    'Cross the gallery, grab 6 artifacts, pick the Saffron Diamond case,',
    'then slip out the green EXIT before the alarm hits 100.',
    '',
    'WASD / arrows — move      Shift — sneak (slower, harder to spot)',
    'Click — throw a coin to distract a guard      Q — smoke bomb',
    'E — grab loot / pick the lock      P — pause      R — restart      M — mute',
    '',
    'Hide in planters, the shadow vent and the curtains to break sight.',
    'Three ways across: open floor, behind the cases, or the top vent.',
  ];
  lines.forEach((line, i) => ctx.fillText(line, 640, 310 + i * 24));
  ctx.fillStyle = '#22c55e';
  ctx.font = 'bold 20px Verdana, sans-serif';
  ctx.fillText('Press ENTER or click to start', 640, 580);
  ctx.textAlign = 'left';
}

function drawPause(ctx) {
  overlay(ctx, 0.6);
  panel(ctx, 440, 320, 400, 140);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#e2e8f0';
  ctx.font = 'bold 30px Georgia, serif';
  ctx.fillText('PAUSED', 640, 375);
  ctx.font = '14px Verdana, sans-serif';
  ctx.fillText('Press P to keep stealing', 640, 415);
  ctx.textAlign = 'left';
}

function drawWin(ctx, state) {
  overlay(ctx, 0.72);
  panel(ctx, 340, 200, 600, 380);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#22c55e';
  ctx.font = 'bold 40px Georgia, serif';
  ctx.fillText('CLEAN GETAWAY!', 640, 260);
  ctx.fillStyle = '#e2e8f0';
  ctx.font = '16px Verdana, sans-serif';
  ctx.fillText('You slipped out with the Saffron Diamond.', 640, 300);
  const lootGot = state.lootTaken.size;
  const timeBonus = Math.max(0, 600 - Math.floor(state.time) * 2);
  ctx.font = '15px Verdana, sans-serif';
  ctx.fillText('Artifacts: ' + lootGot + ' / 6  ·  Diamond: +500', 640, 340);
  ctx.fillText('Time: ' + formatTime(state.time) + '  ·  Time bonus: +' + timeBonus, 640, 368);
  ctx.fillStyle = '#fbbf24';
  ctx.font = 'bold 26px Verdana, sans-serif';
  ctx.fillText('FINAL SCORE: ' + state.score, 640, 420);
  ctx.fillStyle = '#cbd5e1';
  ctx.font = '14px Verdana, sans-serif';
  ctx.fillText('Press R to steal again', 640, 470);
  ctx.fillText('The vault never knew you were there.', 640, 500);
  ctx.textAlign = 'left';
}

function drawCaught(ctx, state) {
  overlay(ctx, 0.72);
  panel(ctx, 340, 200, 600, 380);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ef4444';
  ctx.font = 'bold 40px Georgia, serif';
  ctx.fillText('CAUGHT!', 640, 260);
  ctx.fillStyle = '#e2e8f0';
  ctx.font = '16px Verdana, sans-serif';
  ctx.fillText(state.caughtBy || 'The vault locked down around you.', 640, 300);
  ctx.fillStyle = '#cbd5e1';
  ctx.font = '15px Verdana, sans-serif';
  ctx.fillText('Loot grabbed: ' + state.lootTaken.size + ' / 6' + (state.diamondTaken ? '  ·  Diamond secured' : ''), 640, 340);
  ctx.fillText('Alarm reached ' + Math.round(state.alarm) + ' / 100', 640, 368);
  ctx.fillText('Score kept: ' + state.score, 640, 396);
  ctx.fillStyle = '#fbbf24';
  ctx.font = 'bold 18px Verdana, sans-serif';
  ctx.fillText('Press R to try the heist again', 640, 460);
  ctx.fillStyle = '#94a3b8';
  ctx.font = '14px Verdana, sans-serif';
  ctx.fillText('Tip: watch the cones, sneak past, hide in the planters.', 640, 500);
  ctx.textAlign = 'left';
}
