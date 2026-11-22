// shots.js — deterministic staged scenes for reproducible screenshots.
// ?shot=cover renders a mid-heist frame with everything visible at once:
// the thief crossing the room, guard cones, camera cones, loot, the diamond
// and a half-full alarm meter. ?shot=menu, ?shot=alert and ?shot=win stage
// the other three frames. The same URL always renders the same frame.

import { DIAMOND } from './level.js';

export const SHOT_NAMES = ['cover', 'menu', 'alert', 'win'];

export function shotFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const shot = params.get('shot');
  return SHOT_NAMES.includes(shot) ? shot : null;
}

// Place the guards at fixed patrol spots with fixed facing, so the cones in
// the cover frame are stable from run to run.
function stageGuards(state, specs) {
  specs.forEach((spec, i) => {
    const guard = state.guards[i];
    guard.x = spec.x;
    guard.y = spec.y;
    guard.angle = spec.angle;
    guard.state = spec.state;
    guard.stateTime = 0;
    guard.seeTime = 0;
    guard.seeing = spec.seeing;
  });
}

function stageCameras(state, angles) {
  state.cameras.forEach((camera, i) => {
    camera.angle = angles[i];
    camera.seeing = false;
  });
}

export function applyShot(state, shot) {
  state.shot = shot;
  state.screen = 'playing';
  state.time = 0;
  if (shot === 'menu') {
    state.screen = 'menu';
    return;
  }
  if (shot === 'cover') {
    // Mid-heist: the thief has two artifacts, is sneaking behind a case,
    // one guard is suspicious, the alarm sits at 42, cameras sweep the room.
    state.thief.x = 470;
    state.thief.y = 340;
    state.thief.dirX = 1;
    state.thief.dirY = 0;
    state.thief.sneaking = true;
    state.lootTaken.add('vase');
    state.lootTaken.add('chalice');
    state.score = 200;
    state.alarm = 42;
    state.time = 96;
    stageGuards(state, [
      { x: 300, y: 320, angle: 0.5, state: 'suspicious', seeing: false },
      { x: 980, y: 300, angle: Math.PI, state: 'patrol', seeing: false },
      { x: 640, y: 560, angle: -Math.PI / 2, state: 'patrol', seeing: false },
      { x: 800, y: 720, angle: Math.PI, state: 'patrol', seeing: false },
    ]);
    stageCameras(state, [0.96, 2.18, -1.2]);
    state.cameras[0].seeing = false;
    state.message = 'Guard Marco is suspicious — slip behind the case!';
    state.messageTime = 999;
    return;
  }
  if (shot === 'alert') {
    // The alarm is at 88, a guard is chasing the thief across the carpet,
    // a camera has the thief in its cone. The caught moment, a breath away.
    state.thief.x = 640;
    state.thief.y = 530;
    state.thief.dirX = 0;
    state.thief.dirY = 1;
    state.lootTaken.add('vase');
    state.lootTaken.add('mask');
    state.lootTaken.add('chalice');
    state.diamondTaken = true;
    state.score = 800;
    state.alarm = 88;
    state.time = 187;
    stageGuards(state, [
      { x: 640, y: 380, angle: Math.PI / 2, state: 'alert', seeing: true },
      { x: 980, y: 300, angle: Math.PI, state: 'patrol', seeing: false },
      { x: 500, y: 560, angle: 0, state: 'suspicious', seeing: false },
      { x: 900, y: 720, angle: Math.PI, state: 'patrol', seeing: false },
    ]);
    stageCameras(state, [0.7, 2.4, -1.5708]);
    state.cameras[2].seeing = true;
    state.message = 'RUN! The alarm is about to hit 100 — reach the EXIT!';
    state.messageTime = 999;
    return;
  }
  if (shot === 'win') {
    // The getaway screen over a finished heist.
    state.thief.x = 1210;
    state.thief.y = 760;
    state.lootTaken.add('vase');
    state.lootTaken.add('mask');
    state.lootTaken.add('idol');
    state.lootTaken.add('pearls');
    state.lootTaken.add('chalice');
    state.lootTaken.add('brooch');
    state.diamondTaken = true;
    state.score = 500 + 600 + Math.max(0, 600 - 214 * 2);
    state.time = 214;
    state.alarm = 18;
    state.screen = 'won';
    stageGuards(state, [
      { x: 300, y: 320, angle: 0.5, state: 'patrol', seeing: false },
      { x: 980, y: 300, angle: Math.PI, state: 'patrol', seeing: false },
      { x: 640, y: 560, angle: -Math.PI / 2, state: 'patrol', seeing: false },
      { x: 800, y: 720, angle: Math.PI, state: 'patrol', seeing: false },
    ]);
    stageCameras(state, [0.96, 2.18, -1.5708]);
    return;
  }
}
