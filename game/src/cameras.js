// cameras.js — the three wall security cameras. Each sweeps its cone back and
// forth on a fixed rhythm; being caught inside a sweeping cone raises the alarm
// and flashes the camera red. A camera never moves, so its cone is a puzzle the
// player reads and times.

import { CAMERA_MOUNTS, lineOfSightBlocked, isHidden } from './level.js';
import { smokeBlocks } from './thief.js';

export const CAMERA_VIEW_RANGE = 285;
export const CAMERA_VIEW_HALF_ANGLE = 0.5; // about 29 degrees each side

export function createCameras() {
  return CAMERA_MOUNTS.map((mount, index) => ({
    name: mount.name,
    x: mount.x,
    y: mount.y,
    baseAngle: mount.baseAngle,
    sweep: mount.sweep,
    speed: mount.speed,
    phase: index * 1.7,
    angle: mount.baseAngle,
    seeing: false,
  }));
}

function angleDiff(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

export function cameraCanSee(camera, thiefX, thiefY, sneaking) {
  if (isHidden(thiefX, thiefY)) return false;
  const dx = thiefX - camera.x;
  const dy = thiefY - camera.y;
  const dist = Math.hypot(dx, dy);
  const range = sneaking ? CAMERA_VIEW_RANGE * 0.6 : CAMERA_VIEW_RANGE;
  if (dist > range) return false;
  const toThief = Math.atan2(dy, dx);
  if (Math.abs(angleDiff(toThief, camera.angle)) > CAMERA_VIEW_HALF_ANGLE) return false;
  if (lineOfSightBlocked(camera.x, camera.y, thiefX, thiefY)) return false;
  return true;
}

export function updateCameras(state, dt) {
  for (const camera of state.cameras) {
    // A slow sine sweep: the cone swings out and back, readable at a glance.
    camera.angle = camera.baseAngle + Math.sin(state.time * camera.speed + camera.phase) * camera.sweep;
    camera.seeing = cameraCanSee(camera, state.thief.x, state.thief.y, state.thief.sneaking) &&
      !smokeBlocks(camera.x, camera.y, state.thief.x, state.thief.y, state.smokes);
  }
}
