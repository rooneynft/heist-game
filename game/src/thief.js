// thief.js — the thief: WASD / arrow movement, Shift to sneak, E to grab loot
// or pick the diamond's lock, mouse click to toss a coin, Q for a smoke bomb.
// Sneaking is slower and quieter but much harder to spot; running is fast and
// loud. Standing still inside a hiding spot breaks every line of sight.

import {
  SPAWN,
  DIAMOND,
  moveCircle,
  nearestLoot,
  nearDiamond,
  atExit,
  isHidden,
} from './level.js';

export const THIEF_RADIUS = 13;
export const WALK_SPEED = 152;
export const SNEAK_SPEED = 82;

export function createThief() {
  return {
    x: SPAWN.x,
    y: SPAWN.y,
    dirX: 0,
    dirY: 1,
    sneaking: false,
    moving: false,
    hidden: false,
  };
}

export function updateThief(state, input, dt) {
  const thief = state.thief;
  let dx = 0;
  let dy = 0;
  if (input.left) dx -= 1;
  if (input.right) dx += 1;
  if (input.up) dy -= 1;
  if (input.down) dy += 1;
  const len = Math.hypot(dx, dy);
  thief.moving = len > 0;
  thief.sneaking = input.sneak;
  if (len > 0) {
    dx /= len;
    dy /= len;
    thief.dirX = dx;
    thief.dirY = dy;
    const speed = thief.sneaking ? SNEAK_SPEED : WALK_SPEED;
    const moved = moveCircle(thief.x, thief.y, THIEF_RADIUS, dx * speed * dt, dy * speed * dt);
    thief.x = moved.x;
    thief.y = moved.y;
    // Moving cancels lockpicking: the diamond needs a steady hand.
    if (state.lockpickProgress > 0) state.lockpickProgress = 0;
  }
  thief.hidden = isHidden(thief.x, thief.y) && !thief.moving;

  // E: grab the nearest loot (edge-triggered, so a quick tap never misses),
  // or work the diamond's lock while E is held down.
  if (input.interactPressed) {
    const loot = nearestLoot(thief.x, thief.y, state.lootTaken);
    if (loot) {
      state.lootTaken.add(loot.id);
      state.score += loot.value;
      state.events.push({ type: 'loot', name: loot.name, value: loot.value });
    }
    input.interactPressed = false;
  }
  if (input.interactHeld && !state.diamondTaken && nearDiamond(thief.x, thief.y)) {
    state.lockpickProgress += dt;
    if (state.lockpickProgress >= DIAMOND.lockpickSeconds) {
      state.diamondTaken = true;
      state.score += 500;
      state.lockpickProgress = 0;
      state.events.push({ type: 'diamond' });
    }
  } else if (state.lockpickProgress > 0) {
    state.lockpickProgress = 0;
  }

  // Reaching the exit with the diamond ends the heist in a getaway.
  if (state.diamondTaken && atExit(thief.x, thief.y)) {
    state.events.push({ type: 'win' });
  }
  if (!state.diamondTaken && atExit(thief.x, thief.y) && !state.exitHintShown) {
    state.exitHintShown = true;
    state.events.push({ type: 'hint', text: 'The exit is locked to you — steal the Saffron Diamond first!' });
  }
  if (!atExit(thief.x, thief.y)) state.exitHintShown = false;
}

// Click to throw a coin: it arcs to the clicked floor point and pings,
// pulling nearby guards over to investigate. Costs one coin.
export function throwCoin(state, targetX, targetY) {
  if (state.coins <= 0 || state.thrownCoin) return false;
  const dx = targetX - state.thief.x;
  const dy = targetY - state.thief.y;
  const dist = Math.hypot(dx, dy);
  if (dist > 340) return false;
  state.coins -= 1;
  state.thrownCoin = { x: state.thief.x, y: state.thief.y, tx: targetX, ty: targetY, t: 0 };
  state.events.push({ type: 'coin' });
  return true;
}

export function updateThrownCoin(state, dt) {
  const coin = state.thrownCoin;
  if (!coin) return;
  coin.t += dt;
  const flight = 0.45;
  const k = Math.min(1, coin.t / flight);
  coin.x = coin.tx * k + state.thief.x * (1 - k);
  coin.y = coin.ty * k + state.thief.y * (1 - k);
  if (coin.t >= flight) {
    state.events.push({ type: 'coinLand', x: coin.tx, y: coin.ty });
    state.thrownCoin = null;
  }
}

// Q: drop a smoke bomb at the thief's feet. The cloud blocks sight for 5 s.
export function dropSmoke(state) {
  if (state.smoke <= 0) return false;
  state.smoke -= 1;
  state.smokes.push({ x: state.thief.x, y: state.thief.y, t: 5, r: 95 });
  state.events.push({ type: 'smoke' });
  return true;
}

export function updateSmokes(state, dt) {
  for (const smoke of state.smokes) smoke.t -= dt;
  state.smokes = state.smokes.filter((s) => s.t > 0);
}

// True when a smoke cloud sits between the watcher and the thief.
export function smokeBlocks(x1, y1, x2, y2, smokes) {
  for (const s of smokes) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len2 = dx * dx + dy * dy;
    if (len2 === 0) return false;
    let t = ((s.x - x1) * dx + (s.y - y1) * dy) / len2;
    t = Math.max(0, Math.min(1, t));
    const px = x1 + dx * t;
    const py = y1 + dy * t;
    if (Math.hypot(s.x - px, s.y - py) < s.r * 0.7) return true;
  }
  return false;
}
