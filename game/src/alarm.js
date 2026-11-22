// alarm.js — the alarm meter, 0 to 100. It climbs while any guard or camera
// watches the thief and falls while the thief stays hidden. At 100 the vault
// locks down and the thief is caught. The meter is the game's tension: the
// player reads it, breaks sight, and watches it fall again.

export const ALARM_MAX = 100;
export const GUARD_ALARM_RATE = 30; // points per second while a guard sees you
export const CAMERA_ALARM_RATE = 20; // points per second while a camera sees you
export const ALARM_DECAY_RATE = 7; // points per second while hidden
export const SNEAK_ALARM_FACTOR = 0.5; // sneaking halves how fast the alarm climbs

export function updateAlarm(state, dt) {
  let rise = 0;
  let watchedByGuard = false;
  let watchedByCamera = false;
  for (const guard of state.guards) {
    if (guard.seeing) {
      watchedByGuard = true;
      rise += GUARD_ALARM_RATE;
    }
  }
  for (const camera of state.cameras) {
    if (camera.seeing) {
      watchedByCamera = true;
      rise += CAMERA_ALARM_RATE;
    }
  }
  if (state.thief.sneaking) rise *= SNEAK_ALARM_FACTOR;
  if (rise > 0) {
    state.alarm = Math.min(ALARM_MAX, state.alarm + rise * dt);
    state.alarmRising = true;
  } else {
    state.alarm = Math.max(0, state.alarm - ALARM_DECAY_RATE * dt);
    state.alarmRising = false;
  }
  state.watchedByGuard = watchedByGuard;
  state.watchedByCamera = watchedByCamera;

  if (state.alarm >= ALARM_MAX) {
    state.events.push({ type: 'caught', name: 'the alarm' });
  }
}

// A short label for the meter's current danger band.
export function alarmBand(alarm) {
  if (alarm >= 75) return { label: 'LOCKDOWN IMMINENT', color: '#ef4444' };
  if (alarm >= 50) return { label: 'HUNTED', color: '#f97316' };
  if (alarm >= 25) return { label: 'SUSPICIOUS', color: '#eab308' };
  return { label: 'UNDETECTED', color: '#22c55e' };
}
