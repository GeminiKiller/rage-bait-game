# Stickman Rage — Engine & Level Format Spec (v1)

This is the binding contract between the engine and level data. Engine and level
designers work in parallel against this document. Do not deviate without updating it.

## Tech constraints

- Vanilla JS + HTML5 canvas. **No build step, no external assets, no network.**
  Must run by opening `index.html` from a static server or `file://`.
- Files:
  - `index.html` — canvas + HUD + script tags
  - `js/engine.js` — physics, collision, triggers, rendering, stickman, FX
  - `js/audio.js` — WebAudio oscillator SFX (no files)
  - `js/main.js` — state machine (title → play → level clear → all clear), HUD, persistence
  - `js/levels_a.js` — defines `window.LEVELS_A = [...]` (levels 1–10)
  - `js/levels_b.js` — defines `window.LEVELS_B = [...]` (levels 11–20+)
  - `main.js` uses `const LEVELS = [...LEVELS_A, ...LEVELS_B]`

## Canvas & physics constants (FIXED — level geometry depends on these)

| Constant | Value |
|---|---|
| Canvas | 960 × 540 (one screen per level, no camera scrolling) |
| Player size | 20 w × 40 h (AABB; stickman drawn inside it) |
| Move speed | 300 px/s (instant accel/decel — snappy) |
| Gravity | 2400 px/s² |
| Jump velocity | −800 px/s |
| Max fall speed | 900 px/s |
| Coyote time | 0.1 s · Jump buffer 0.1 s · Variable jump: releasing jump halves upward velocity |
| Fixed timestep | 1/120 s accumulator loop |

**Derived jump metrics for level design (use safety margins):**
- Max jump height ≈ 133 px → design step-ups ≤ **100 px**
- Full-jump airtime ≈ 0.67 s → max flat gap ≈ 200 px → design gaps ≤ **170 px**
- Y axis points DOWN. (0,0) is top-left.

## Level format

Each level is a plain JS object:

```js
{
  name: "Trust Issues",            // shown at level start
  deathMsgs: ["Skill issue.", …],  // optional extra taunts mixed into global pool
  spawn: { x: 40, y: 440 },        // player TOP-LEFT at spawn (feet at y+40)
  exit:  { x: 880, y: 430 },       // door TOP-LEFT, door is 30w × 50h; touch = win
  objects: [ … ]                   // see object types
}
```

The engine wraps `exit` as an object with implicit `id: "exit"` so triggers can move it.
Every level MUST be completable after its traps are known (deterministic, no RNG).

### Object types

All objects may have an optional string `id` (unique per level) so triggers can target them.
All may have `hidden: true` (not rendered, not collided) until revealed.

```js
{ type: 'solid',  x, y, w, h }
// Static wall/floor. Player collides on all sides.

{ type: 'hazard', x, y, w, h, variant: 'spikes'|'lava', dir: 'up'|'down'|'left'|'right' }
// Touch = death. `dir` is the direction spikes point (render only). Default 'up'.

{ type: 'platform', x, y, w, h, path: [{x,y}, …], speed: 120, mode: 'loop'|'pingpong',
  startOnTrigger: false }
// Moving solid. `path` includes waypoints AFTER the start position; starts at (x,y).
// Carries the player standing on it. If startOnTrigger, it is inert until a
// trigger fires {do:'start', target:id}.

{ type: 'trigger', x, y, w, h, once: true, delay: 0, actions: [ … ] }
// Invisible region. Fires `actions` when the PLAYER overlaps it. `once:true`
// (default) = fires a single time per life; resets on respawn. `delay` in
// seconds before actions execute.

{ type: 'decoy', x, y }
// Renders EXACTLY like the exit door (30×50) but is NOT the exit: touching it
// does not win. Pair it with a trigger to punish (warp back to spawn, spike
// reveal). Levels using a decoy usually hide the real exit until earned.
```

`reveal`, `hide`, and `move` work on ANY object type with an id — including
hazards (e.g. `move` a ceiling spike strip downward = falling spikes) and decoys.

### Trigger actions

```js
{ do: 'warp',   to: {x,y} }                  // instantly teleport the PLAYER (top-left) to (x,y); tiny poof FX + click
{ do: 'invert', duration: 2.5 }              // invert the player's horizontal controls for N seconds; NO on-screen indicator
{ do: 'reveal', target: 'id' }               // unhide object (solid appears mid-air, spikes pop out)
{ do: 'hide',   target: 'id' }               // object vanishes (floor drops away)
{ do: 'move',   target: 'id', to: {x,y}, speed: 400 }  // slide object to position (exit runs away, wall closes)
{ do: 'start',  target: 'id' }               // start a startOnTrigger platform (crushers, chasers)
{ do: 'shoot',  from: {x,y}, dir: {x:1,y:0}, speed: 500 }  // spawn a 24×6 arrow projectile; touch = death; despawns off-screen
{ do: 'msg',    text: "..." }                // small taunt toast on screen
{ do: 'shake' }                              // screen shake burst
```

All trigger state (revealed/hidden/moved objects, projectiles, platform positions,
fired flags) resets on death/respawn. Levels are fully deterministic.

### Death & respawn

- Touching any hazard, projectile, or falling below y > 620 = death.
- Death: ragdoll burst animation + buzzer + deaths++ , respawn in **< 0.7 s** at level spawn.
- Being crushed = death, defined as SQUEEZE: when a moving solid/platform
  displaces the player, the engine pushes the player along the mover's motion;
  if the pushed player would then overlap ANY other visible solid (or the mover
  still overlaps them), the player dies. A mover must never merely shove the
  player through/around geometry it has pinned them against.

## HUD / meta (main.js)

- Top bar: level number + name, session timer, **death counter** (big, prominent).
- Random sarcastic taunt on every death (global pool + level's `deathMsgs`).
- localStorage: total deaths, per-level deaths, best clear time, furthest level.
- Level select on title screen (unlocked levels only). Keys: ←→/AD move, ↑/W/Space jump, R restart level.
- After final level: victory screen with total deaths + time + "share your suffering" copy-to-clipboard text.

## Fairness rules for level designers

1. A trap may kill the player once by surprise, but the level must be beatable with
   knowledge + honest execution (no pixel-perfect, no unreactable second-kill of the same trap).
2. Every level completable in < 30 s by a knowing player.
3. Teach a rule before betraying it (e.g., safe gap before the fake floor).
4. Keep all geometry inside 0 ≤ x ≤ 960, 0 ≤ y ≤ 540; floors typically at y = 480.
