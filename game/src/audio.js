// audio.js — all sound is synthesized with WebAudio: no audio files, no
// network. Short blips for footsteps, pickups and coins, a rising alarm tone,
// a lockpick tick, and a little win arpeggio. M toggles mute.

let audioContext = null;
let muted = false;

export function isMuted() {
  return muted;
}

export function toggleMute() {
  muted = !muted;
  return muted;
}

function context() {
  if (!audioContext) {
    const Ctor = window.AudioContext || window.webkitAudioContext;
    if (!Ctor) return null;
    audioContext = new Ctor();
  }
  if (audioContext.state === 'suspended') audioContext.resume();
  return audioContext;
}

function tone(freq, seconds, type, volume, when = 0) {
  if (muted) return;
  const ctx = context();
  if (!ctx) return;
  const start = ctx.currentTime + when;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  gain.gain.setValueAtTime(volume, start);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + seconds);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(start);
  osc.stop(start + seconds);
}

export function playStep() {
  tone(180 + Math.random() * 40, 0.06, 'sine', 0.05);
}

export function playPickup() {
  tone(660, 0.09, 'triangle', 0.12);
  tone(990, 0.12, 'triangle', 0.1, 0.07);
}

export function playDiamond() {
  tone(523, 0.12, 'triangle', 0.14);
  tone(659, 0.12, 'triangle', 0.14, 0.1);
  tone(784, 0.2, 'triangle', 0.14, 0.2);
}

export function playCoin() {
  tone(1200, 0.08, 'square', 0.06);
  tone(900, 0.1, 'square', 0.05, 0.12);
}

export function playAlarm() {
  tone(440, 0.18, 'sawtooth', 0.08);
  tone(587, 0.18, 'sawtooth', 0.08, 0.16);
}

export function playLockpickTick() {
  tone(1500, 0.03, 'square', 0.04);
}

export function playSmoke() {
  tone(220, 0.25, 'sine', 0.08);
  tone(160, 0.3, 'sine', 0.07, 0.08);
}

export function playWin() {
  const notes = [523, 659, 784, 1047, 1319];
  notes.forEach((freq, i) => tone(freq, 0.22, 'triangle', 0.13, i * 0.11));
}

export function playCaught() {
  tone(220, 0.3, 'sawtooth', 0.12);
  tone(165, 0.5, 'sawtooth', 0.12, 0.25);
}
