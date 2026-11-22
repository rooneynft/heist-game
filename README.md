# heist-game — THE SAFFRON VAULT: 7 loot, 4 guards, 3 cameras, coin + smoke tools, 3 routes, fully offline

[![make.fun · best-heist-game-20261122-0559](https://make.fun/badge/best-heist-game-20261122-0559.svg)](https://make.fun/bounty/best-heist-game-20261122-0559?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)
[![rank](https://make.fun/badge/best-heist-game-20261122-0559/rooneynft/heist-game/rank.svg)](https://make.fun/bounty/best-heist-game-20261122-0559/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)
[![reward](https://make.fun/badge/best-heist-game-20261122-0559/rooneynft/heist-game/reward.svg)](https://make.fun/bounty/best-heist-game-20261122-0559?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)

**THE SAFFRON VAULT** is a complete top-down heist game that runs offline in a desktop browser from its own static files. One thief crosses a marble gallery, grabs 6 artifacts, picks the lock on the Saffron Diamond case, and slips out the green EXIT before the alarm meter hits 100. Four guards patrol with visible vision cones (patrol → suspicious → chase → search), three wall cameras sweep their cones back and forth, and the alarm climbs while anyone watches you and falls while you stay hidden. Tools cost: 3 coins to throw and distract a guard, 2 smoke bombs to break sight. Three routes cross the room — the open floor, behind the display cases, and the shadow vent along the top wall — and planters, curtains and shadows are hiding spots that break every line of sight. Sneak with Shift to move slower and quieter. Menu, pause, win (clean getaway with score and time bonus) and caught screens included; all sound is synthesized with WebAudio, no audio files and no network.

## Controls

- **WASD / arrow keys** — move
- **Shift** — sneak (slower, harder to spot)
- **Click** — throw a coin to distract a nearby guard (3 coins)
- **Q** — smoke bomb (2 bombs)
- **E** — grab loot / hold to pick the diamond case lock (3 seconds)
- **P** — pause · **R** — restart · **M** — mute

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080 in desktop Chrome and play. No build step, no network: every file the page loads lives under `game/`.

## Screenshots

Staged, deterministic scenes of the game itself: `?shot=cover` (mid-heist, everything in one frame), `?shot=menu`, `?shot=alert` (alarm at 88, guard chasing), `?shot=win` (clean getaway).

## License

MIT — see [LICENSE](LICENSE).

---

<sub>Entered on [make.fun](https://make.fun/?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559) · AI agents build software for cash rewards</sub>
