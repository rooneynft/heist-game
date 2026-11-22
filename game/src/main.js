// main.js — bootstrap and game loop for THE SAFFRON VAULT. Owns the game
// state, the keyboard and mouse input, the fixed update step, and the event
// queue that turns gameplay into sounds, messages and screen changes.
// A staged screenshot URL (?shot=cover|menu|alert|win) renders one frozen
// frame instead of starting the loop, so screenshots are reproducible.

import { createGuards, updateGuards, distractGuards } from './guards.js';
import { createCameras, updateCameras } from './cameras.js';
import {
  createThief,
  updateThief,
  updateThrownCoin,
  updateSmokes,
  throwCoin,
  dropSmoke,
} from './thief.js';
import { updateAlarm } from './alarm.js';
import { drawGame } from './render.js';
import { drawHUD } from './hud.js';
import { shotFromUrl, applyShot } from './shots.js';
import * as audio from './audio.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

export function createState() {
  return {
    screen: 'menu', // menu | playing | paused | won | caught
    time: 0,
    alarm: 0,
    alarmRising: false,
    watchedByGuard: false,
    watchedByCamera: false,
    score: 0,
    lootTaken: new Set(),
    diamondTaken: false,
    lockpickProgress: 0,
    coins: 3,
    smoke: 2,
    thrownCoin: null,
    smokes: [],
    thief: createThief(),
    guards: createGuards(),
    cameras: createCameras(),
    events: [],
    message: '',
    messageTime: 0,
    caughtBy: '',
    exitHintShown: false,
    muted: false,
    shot: null,
    stepSoundTimer: 0,
    alarmSoundTimer: 0,
    lockpickSoundTimer: 0,
  };
}

let state = createState();

const input = {
  up: false,
  down: false,
  left: false,
  right: false,
  sneak: false,
  interactHeld: false,
  interactPressed: false,
};

function resetGame() {
  state = createState();
  state.screen = 'playing';
  state.message = 'Steal the diamond. Mind the cones.';
  state.messageTime = 4;
  window.__heist = state;
}

function showMessage(text, seconds = 4) {
  state.message = text;
  state.messageTime = seconds;
}

function handleEvents() {
  for (const event of state.events) {
    if (event.type === 'loot') {
      audio.playPickup();
      showMessage(event.name + ' grabbed! +' + event.value + ' points');
    } else if (event.type === 'diamond') {
      audio.playDiamond();
      showMessage('SAFFRON DIAMOND secured! Get to the EXIT!');
    } else if (event.type === 'coin') {
      audio.playCoin();
    } else if (event.type === 'coinLand') {
      distractGuards(state, event.x, event.y);
      audio.playCoin();
      showMessage('Coin clinks on the marble — a guard goes to look.');
    } else if (event.type === 'smoke') {
      audio.playSmoke();
      showMessage('Smoke! No one can see through it for 5 seconds.');
    } else if (event.type === 'spotted') {
      audio.playAlarm();
      showMessage('Guard ' + event.name + ' spotted you — break sight!');
    } else if (event.type === 'alarm') {
      audio.playAlarm();
      showMessage('Guard ' + event.name + ' is chasing you!');
    } else if (event.type === 'hint') {
      showMessage(event.text, 5);
    } else if (event.type === 'win') {
      const bonus = Math.max(0, 600 - Math.floor(state.time) * 2);
      state.score += bonus;
      state.screen = 'won';
      audio.playWin();
    } else if (event.type === 'caught') {
      state.screen = 'caught';
      state.caughtBy = event.name === 'the alarm'
        ? 'The alarm hit 100 — the vault sealed itself shut.'
        : 'Guard ' + event.name + ' grabbed you by the collar.';
      audio.playCaught();
    }
  }
  state.events.length = 0;
}

function update(dt) {
  if (state.screen !== 'playing') return;
  state.time += dt;
  updateThief(state, input, dt);
  updateThrownCoin(state, dt);
  updateSmokes(state, dt);
  updateGuards(state, dt);
  updateCameras(state, dt);
  updateAlarm(state, dt);
  handleEvents();

  // Footstep blips while walking, slower while sneaking.
  if (state.thief.moving) {
    state.stepSoundTimer -= dt;
    if (state.stepSoundTimer <= 0) {
      audio.playStep();
      state.stepSoundTimer = state.thief.sneaking ? 0.55 : 0.32;
    }
  }
  // A rising alarm tone while the meter climbs.
  if (state.alarmRising) {
    state.alarmSoundTimer -= dt;
    if (state.alarmSoundTimer <= 0) {
      audio.playAlarm();
      state.alarmSoundTimer = 0.9;
    }
  }
  // Lockpick ticks while the thief works the case.
  if (state.lockpickProgress > 0) {
    state.lockpickSoundTimer -= dt;
    if (state.lockpickSoundTimer <= 0) {
      audio.playLockpickTick();
      state.lockpickSoundTimer = 0.25;
    }
  }
  if (state.messageTime > 0) state.messageTime -= dt;
}

let lastTime = 0;
function frame(now) {
  const dt = Math.min(0.05, (now - lastTime) / 1000 || 0.016);
  lastTime = now;
  update(dt);
  drawGame(ctx, state);
  drawHUD(ctx, state);
  requestAnimationFrame(frame);
}

function canvasPoint(clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((clientX - rect.left) / rect.width) * 1280,
    y: ((clientY - rect.top) / rect.height) * 800,
  };
}

canvas.addEventListener('click', (event) => {
  if (state.screen === 'menu') {
    resetGame();
    return;
  }
  if (state.screen !== 'playing') return;
  const point = canvasPoint(event.clientX, event.clientY);
  if (point.y < 96) return; // clicks on the HUD do not throw coins
  throwCoin(state, point.x, point.y);
});

window.addEventListener('keydown', (event) => {
  const key = event.key.toLowerCase();
  if (key === 'arrowup' || key === 'w') input.up = true;
  if (key === 'arrowdown' || key === 's') input.down = true;
  if (key === 'arrowleft' || key === 'a') input.left = true;
  if (key === 'arrowright' || key === 'd') input.right = true;
  if (key === 'shift') input.sneak = true;
  if (key === 'e') {
    input.interactHeld = true;
    input.interactPressed = true;
  }
  if (key === 'q' && state.screen === 'playing') dropSmoke(state);
  if (key === 'm') {
    state.muted = audio.toggleMute();
    showMessage(state.muted ? 'Sound muted.' : 'Sound on.', 2);
  }
  if (key === 'p') {
    if (state.screen === 'playing') state.screen = 'paused';
    else if (state.screen === 'paused') state.screen = 'playing';
  }
  if (key === 'r') {
    if (state.screen === 'won' || state.screen === 'caught' || state.screen === 'paused') resetGame();
  }
  if (key === 'enter') {
    if (state.screen === 'menu') resetGame();
    else if (state.screen === 'won' || state.screen === 'caught') resetGame();
  }
  if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(key)) {
    event.preventDefault();
  }
});

window.addEventListener('keyup', (event) => {
  const key = event.key.toLowerCase();
  if (key === 'arrowup' || key === 'w') input.up = false;
  if (key === 'arrowdown' || key === 's') input.down = false;
  if (key === 'arrowleft' || key === 'a') input.left = false;
  if (key === 'arrowright' || key === 'd') input.right = false;
  if (key === 'shift') input.sneak = false;
  if (key === 'e') input.interactHeld = false;
});

// Handle for play-testing from the browser console and automation.
window.__heist = state;
window.__heistReset = resetGame;

// A staged screenshot URL renders one frozen frame and never starts the loop.
const shot = shotFromUrl();
if (shot) {
  applyShot(state, shot);
  drawGame(ctx, state);
  drawHUD(ctx, state);
} else {
  requestAnimationFrame(frame);
}
