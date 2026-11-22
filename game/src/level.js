// level.js — the Saffron Vault room: walls, cover, loot, cameras, spawn and exit.
// One room, shown whole in a single frame. Three routes cross it: the open marble
// floor down the middle, the shadow vent along the top wall, and the gaps behind
// the display cases. Every number here is in canvas pixels (1280 x 800).

export const CANVAS_W = 1280;
export const CANVAS_H = 800;
export const HUD_H = 96;

// The room floor the thief walks on.
export const ROOM = { x: 8, y: 104, w: 1264, h: 688 };

// Solid walls inside the room (block movement and line of sight).
export const WALLS = [
  { x: 420, y: 280, w: 16, h: 260, name: 'west partition' },
  { x: 844, y: 240, w: 16, h: 260, name: 'east partition' },
];

// Display cases: glass boxes on plinths. They block movement and sight, so the
// thief can break a guard's vision cone by slipping behind one.
export const CASES = [
  { x: 220, y: 190, w: 150, h: 80, label: 'JADE HALL' },
  { x: 910, y: 190, w: 150, h: 80, label: 'GOLD HALL' },
  { x: 220, y: 580, w: 150, h: 80, label: 'RUBY HALL' },
  { x: 910, y: 580, w: 150, h: 80, label: 'PEARL HALL' },
  { x: 565, y: 180, w: 150, h: 70, label: 'SILVER HALL' },
  { x: 565, y: 640, w: 150, h: 70, label: 'EMERALD HALL' },
];

// Planters and shadow spots where the thief can hide. While the thief stands
// still inside one, guards and cameras cannot spot them.
export const PLANTERS = [
  { x: 150, y: 200, r: 36 },
  { x: 1130, y: 200, r: 36 },
  { x: 150, y: 700, r: 36 },
  { x: 1130, y: 700, r: 36 },
];

export const HIDING_ZONES = [
  { x: 450, y: 112, w: 380, h: 44, name: 'shadow vent' },
  { x: 16, y: 330, w: 44, h: 140, name: 'velvet curtain' },
  { x: 1220, y: 330, w: 44, h: 140, name: 'velvet curtain' },
];

// The main target: the Saffron Diamond, locked inside its own case.
export const DIAMOND = {
  x: 605, y: 420, w: 70, h: 70,
  name: 'SAFFRON DIAMOND',
  lockpickSeconds: 3,
};

// Six smaller artifacts scattered around the room. Grab each with E.
export const LOOT = [
  { id: 'vase', name: 'Jade Vase', x: 295, y: 300, value: 100, color: '#4ade80' },
  { id: 'mask', name: 'Gold Mask', x: 985, y: 300, value: 100, color: '#fbbf24' },
  { id: 'idol', name: 'Ruby Idol', x: 295, y: 540, value: 100, color: '#f87171' },
  { id: 'pearls', name: 'Pearl Necklace', x: 985, y: 540, value: 100, color: '#f8fafc' },
  { id: 'chalice', name: 'Silver Chalice', x: 640, y: 230, value: 100, color: '#cbd5e1' },
  { id: 'brooch', name: 'Emerald Brooch', x: 640, y: 690, value: 100, color: '#34d399' },
];

export const SPAWN = { x: 90, y: 720 };
export const EXIT = { x: 1180, y: 736, w: 80, h: 48 };

// Guard patrol routes: name, colour, waypoints, walking speed.
export const GUARD_ROUTES = [
  {
    name: 'Marco', color: '#38bdf8',
    waypoints: [{ x: 180, y: 300 }, { x: 180, y: 600 }, { x: 380, y: 600 }, { x: 380, y: 300 }],
    speed: 58,
  },
  {
    name: 'Lena', color: '#f472b6',
    waypoints: [{ x: 1100, y: 300 }, { x: 1100, y: 600 }, { x: 900, y: 600 }, { x: 900, y: 300 }],
    speed: 58,
  },
  {
    name: 'Otto', color: '#a78bfa',
    waypoints: [{ x: 500, y: 455 }, { x: 780, y: 455 }],
    speed: 48,
  },
  {
    name: 'Ivy', color: '#fb923c',
    waypoints: [{ x: 500, y: 720 }, { x: 1080, y: 720 }],
    speed: 62,
  },
];

// Security cameras: wall mounts, the direction they face when centred, and how
// far they sweep to each side (radians).
export const CAMERA_MOUNTS = [
  { name: 'CAM 1', x: 40, y: 132, baseAngle: 0.96, sweep: 0.62, speed: 0.55 },
  { name: 'CAM 2', x: 1240, y: 132, baseAngle: 2.18, sweep: 0.62, speed: 0.45 },
  { name: 'CAM 3', x: 640, y: 780, baseAngle: -1.5708, sweep: 0.7, speed: 0.4 },
];

// ---- geometry helpers -------------------------------------------------------

export function pointInRect(px, py, r) {
  return px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h;
}

export function pointInCircle(px, py, c) {
  const dx = px - c.x;
  const dy = py - c.y;
  return dx * dx + dy * dy <= c.r * c.r;
}

// True when the segment from (x1,y1) to (x2,y2) hits the rectangle.
export function segmentHitsRect(x1, y1, x2, y2, r) {
  if (pointInRect(x1, y1, r) || pointInRect(x2, y2, r)) return true;
  const edges = [
    [r.x, r.y, r.x + r.w, r.y],
    [r.x + r.w, r.y, r.x + r.w, r.y + r.h],
    [r.x + r.w, r.y + r.h, r.x, r.y + r.h],
    [r.x, r.y + r.h, r.x, r.y],
  ];
  for (const [ax, ay, bx, by] of edges) {
    if (segmentsCross(x1, y1, x2, y2, ax, ay, bx, by)) return true;
  }
  return false;
}

function segmentsCross(x1, y1, x2, y2, x3, y3, x4, y4) {
  const d1 = cross(x3 - x1, y3 - y1, x2 - x1, y2 - y1);
  const d2 = cross(x4 - x1, y4 - y1, x2 - x1, y2 - y1);
  const d3 = cross(x1 - x3, y1 - y3, x4 - x3, y4 - y3);
  const d4 = cross(x2 - x3, y2 - y3, x4 - x3, y4 - y3);
  return ((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) &&
    ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0));
}

function cross(ax, ay, bx, by) {
  return ax * by - ay * bx;
}

// Every solid rectangle that blocks sight: the room's outer walls, the inner
// partitions and the display cases. The diamond pedestal is low glass and
// does not block sight.
export function sightBlockers() {
  const outer = [
    { x: ROOM.x - 14, y: ROOM.y - 14, w: ROOM.w + 28, h: 14 },
    { x: ROOM.x - 14, y: ROOM.y + ROOM.h, w: ROOM.w + 28, h: 14 },
    { x: ROOM.x - 14, y: ROOM.y, w: 14, h: ROOM.h },
    { x: ROOM.x + ROOM.w, y: ROOM.y, w: 14, h: ROOM.h },
  ];
  return outer.concat(WALLS, CASES);
}

// True when anything solid stands between the two points.
export function lineOfSightBlocked(x1, y1, x2, y2) {
  for (const r of sightBlockers()) {
    if (segmentHitsRect(x1, y1, x2, y2, r)) return true;
  }
  return false;
}

// True when a circle of radius r at (x,y) overlaps any solid or the room edge.
export function circleBlocked(x, y, r) {
  if (x - r < ROOM.x || x + r > ROOM.x + ROOM.w) return true;
  if (y - r < ROOM.y || y + r > ROOM.y + ROOM.h) return true;
  for (const solid of WALLS.concat(CASES)) {
    if (circleHitsRect(x, y, r, solid)) return true;
  }
  if (circleHitsRect(x, y, r, DIAMOND)) return true;
  return false;
}

function circleHitsRect(cx, cy, r, rect) {
  const nx = Math.max(rect.x, Math.min(cx, rect.x + rect.w));
  const ny = Math.max(rect.y, Math.min(cy, rect.y + rect.h));
  const dx = cx - nx;
  const dy = cy - ny;
  return dx * dx + dy * dy < r * r;
}

// Move a circle by (dx,dy), sliding along solids instead of sticking.
export function moveCircle(x, y, r, dx, dy) {
  if (!circleBlocked(x + dx, y, r)) x += dx;
  if (!circleBlocked(x, y + dy, r)) y += dy;
  return { x, y };
}

// True when the thief is inside a hiding spot (planter or shadow zone).
export function isHidden(x, y) {
  for (const p of PLANTERS) {
    if (pointInCircle(x, y, p)) return true;
  }
  for (const z of HIDING_ZONES) {
    if (pointInRect(x, y, z)) return true;
  }
  return false;
}

export function nearestLoot(x, y, taken) {
  let best = null;
  let bestD = 70;
  for (const item of LOOT) {
    if (taken.has(item.id)) continue;
    const d = Math.hypot(item.x - x, item.y - y);
    if (d < bestD) {
      bestD = d;
      best = item;
    }
  }
  return best;
}

export function nearDiamond(x, y) {
  const cx = DIAMOND.x + DIAMOND.w / 2;
  const cy = DIAMOND.y + DIAMOND.h / 2;
  return Math.hypot(cx - x, cy - y) < 78;
}

export function atExit(x, y) {
  return pointInRect(x, y, EXIT);
}
