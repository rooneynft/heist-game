// guards.js — the four patrol guards: waypoints, vision cones, line of sight,
// and the patrol -> suspicious -> alert (chase) -> search state machine.
// A guard only raises the alarm while it can actually see the thief: the thief
// inside the cone, in range, with a clear line of sight, and not hidden.

import {
  GUARD_ROUTES,
  lineOfSightBlocked,
  isHidden,
  moveCircle,
} from './level.js';
import { smokeBlocks } from './thief.js';

export const GUARD_VIEW_RANGE = 235;
export const GUARD_VIEW_HALF_ANGLE = 0.61; // about 35 degrees each side
export const GUARD_CHASE_SPEED = 96;
export const GUARD_CATCH_RADIUS = 26;

export function createGuards() {
  return GUARD_ROUTES.map((route) => {
    const start = route.waypoints[0];
    return {
      name: route.name,
      color: route.color,
      x: start.x,
      y: start.y,
      angle: 0,
      route,
      waypointIndex: 1,
      speed: route.speed,
      state: 'patrol', // patrol | suspicious | alert | search | investigate
      stateTime: 0,
      seeTime: 0,
      lastSeenX: 0,
      lastSeenY: 0,
      investigateX: 0,
      investigateY: 0,
      seeing: false,
    };
  });
}

function angleTo(ax, ay, bx, by) {
  return Math.atan2(by - ay, bx - ax);
}

function angleDiff(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

// Can this guard see the thief right now? Sneaking shrinks the guard's
// effective range, and a hiding spot breaks sight completely.
export function guardCanSee(guard, thiefX, thiefY, sneaking) {
  if (isHidden(thiefX, thiefY)) return false;
  const dx = thiefX - guard.x;
  const dy = thiefY - guard.y;
  const dist = Math.hypot(dx, dy);
  const range = sneaking ? GUARD_VIEW_RANGE * 0.6 : GUARD_VIEW_RANGE;
  if (dist > range) return false;
  const toThief = Math.atan2(dy, dx);
  if (Math.abs(angleDiff(toThief, guard.angle)) > GUARD_VIEW_HALF_ANGLE) return false;
  if (lineOfSightBlocked(guard.x, guard.y, thiefX, thiefY)) return false;
  return true;
}

function moveToward(guard, tx, ty, speed, dt) {
  const dx = tx - guard.x;
  const dy = ty - guard.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 1) return true;
  const step = Math.min(dist, speed * dt);
  const moved = moveCircle(guard.x, guard.y, 14, (dx / dist) * step, (dy / dist) * step);
  guard.x = moved.x;
  guard.y = moved.y;
  guard.angle = angleTo(guard.x, guard.y, tx, ty);
  return dist <= step + 1;
}

export function updateGuards(state, dt) {
  const thief = state.thief;
  for (const guard of state.guards) {
    guard.stateTime += dt;
    const seeing = guardCanSee(guard, thief.x, thief.y, thief.sneaking) &&
      !smokeBlocks(guard.x, guard.y, thief.x, thief.y, state.smokes);
    guard.seeing = seeing;
    if (seeing) {
      guard.seeTime += dt;
      guard.lastSeenX = thief.x;
      guard.lastSeenY = thief.y;
    } else {
      guard.seeTime = Math.max(0, guard.seeTime - dt * 2);
    }

    if (guard.state === 'patrol') {
      const target = guard.route.waypoints[guard.waypointIndex];
      const arrived = moveToward(guard, target.x, target.y, guard.speed, dt);
      if (arrived) {
        guard.waypointIndex = (guard.waypointIndex + 1) % guard.route.waypoints.length;
      }
      if (guard.seeTime > 0.6) {
        guard.state = 'suspicious';
        guard.stateTime = 0;
        state.events.push({ type: 'spotted', name: guard.name });
      }
    } else if (guard.state === 'suspicious') {
      // Stops, stares at the thief for a beat, then gives chase.
      guard.angle += angleDiff(angleTo(guard.x, guard.y, thief.x, thief.y), guard.angle) * dt * 6;
      if (guard.seeTime > 1.5 || state.alarm > 60) {
        guard.state = 'alert';
        guard.stateTime = 0;
        state.events.push({ type: 'alarm', name: guard.name });
      } else if (!seeing && guard.stateTime > 2.5) {
        guard.state = 'patrol';
        guard.stateTime = 0;
      }
    } else if (guard.state === 'alert') {
      // Chases the thief's last seen position; catches them up close.
      moveToward(guard, guard.lastSeenX, guard.lastSeenY, GUARD_CHASE_SPEED, dt);
      if (Math.hypot(thief.x - guard.x, thief.y - guard.y) < GUARD_CATCH_RADIUS && seeing) {
        state.events.push({ type: 'caught', name: guard.name });
      }
      if (!seeing && guard.stateTime > 3) {
        guard.state = 'search';
        guard.stateTime = 0;
      }
    } else if (guard.state === 'search') {
      // Looks around the last seen spot, then gives up and resumes patrol.
      const arrived = moveToward(guard, guard.lastSeenX, guard.lastSeenY, guard.speed * 0.7, dt);
      if (arrived) guard.angle += dt * 1.8;
      if (guard.seeTime > 0.6) {
        guard.state = 'suspicious';
        guard.stateTime = 0;
      } else if (guard.stateTime > 5) {
        guard.state = 'patrol';
        guard.stateTime = 0;
      }
    } else if (guard.state === 'investigate') {
      // A thrown coin's ping drew this guard here.
      const arrived = moveToward(guard, guard.investigateX, guard.investigateY, guard.speed * 1.3, dt);
      if (arrived) guard.angle += dt * 2.2;
      if (guard.seeTime > 0.6) {
        guard.state = 'suspicious';
        guard.stateTime = 0;
      } else if (guard.stateTime > 4) {
        guard.state = 'patrol';
        guard.stateTime = 0;
      }
    }
  }
}

// A coin landed at (x,y): every guard close enough leaves its patrol to check.
export function distractGuards(state, x, y) {
  for (const guard of state.guards) {
    if (guard.state === 'alert') continue;
    if (Math.hypot(guard.x - x, guard.y - y) < 230) {
      guard.state = 'investigate';
      guard.stateTime = 0;
      guard.investigateX = x;
      guard.investigateY = y;
    }
  }
}
