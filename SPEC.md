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

## 60-level structure (v3)

60 levels, 5 per chapter → 12 chapters. Files: `js/levels_a.js` (1–10, LEVELS_A),
`js/levels_b.js` (11–22, LEVELS_B), `js/levels_c.js` (23–30, LEVELS_C),
`js/levels_d.js` (31–40, LEVELS_D), `js/levels_e.js` (41–50, LEVELS_E),
`js/levels_f.js` (51–60, LEVELS_F). `main.js` concatenates in order; chapter of a
level = `floor(index/5)`. Sawtooth difficulty: each chapter opens lighter and ends
with its climax. Mechanic debuts: ch5 conveyors+ice floors · ch6 darkness+portals ·
ch7 one-way+wind · ch8 buttons+keys+fake-clear · ch9 collapse/shrink/moving pits ·
ch10 gravity flip+momentum floors · ch11–12 remix only, no new mechanics.

## Level format

Each level is a plain JS object:

```js
{
  name: "Trust Issues",            // shown at level start
  theme: 'plain',                  // optional: 'plain' (default) | 'icecave' | 'lava' | 'night' | 'sky' | 'temple'
                                   // engine tints background/terrain accents and ambient decor per theme
                                   // ('sky'/'temple' added v3 wave 2 for ch7/ch8 — see js/levels_d.js)
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

{ type: 'hazard', x, y, w, h, variant: 'spikes'|'lava'|'ice', dir: 'up'|'down'|'left'|'right' }
// Touch = death. `dir` is the direction spikes point (render only). Default 'up'.
// 'ice' renders as an icicle cluster (pale ice-blue, tapered shards) — typically
// dir:'down' hanging from ceilings; same kill behavior as spikes.
// Projectiles spawned by `shoot` render as ICICLES (tapered shard, ice-blue).

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

{ type: 'decor', variant: 'ceiling'|'stalagmite'|'rocks'|'crystal', x, y, w, h }
// Non-colliding, non-lethal scenery drawn BEHIND gameplay objects, rendered
// visibly muted/darker than functional solids so it never reads as standable.
// Use to build cave ceilings, cave mouths, rock piles, ambient crystals.
// Hanging 'ice' hazards MUST visually attach to something: either real solid
// ceiling geometry, a 'decor' ceiling, or the engine's auto-drawn rock lip
// (the engine draws a small rock attachment above any visible dir:'down'
// ice hazard automatically) — no more icicles floating in open air.

{ type: 'conveyor', x, y, w, h, dir: 1, speed: 120 }        // v3 (ch5+)
// Solid block whose top surface carries the player: while standing on it,
// dir*speed px/s is added to the player's x each frame (stacks with input).
// Renders as terrain with a moving chevron strip on top. speed ≤ 200.

// Ice floor: any solid may set surface: 'ice' (v3, ch5+).
// Standing on it replaces instant accel/decel with momentum: vx eases toward
// the input target (reach ~full speed in ~0.35s, slide ~120px from full run
// when input stops). Renders with a pale glossy top edge.

{ type: 'portal', id: 'p1', x, y, w, h, to: 'p2', oneWay: false }   // v3 (ch6+)
// Teleporter pair (typical 24×48). Player overlap → instantly appear at the
// target portal (position offset preserved, velocity preserved), 0.4s
// re-entry cooldown so pairs can't ping-pong. `to` must reference a portal id
// in the same level. oneWay: true = target does not teleport back.
// Renders as a shimmering oval outline in the theme accent color.

// Darkness (v3, ch6+): level field `darkness: 150` limits vision to a soft
// circle of that radius around the player (rest of canvas near-black; HUD
// unaffected). Trigger action { do: 'dark', radius: 150 } sets it mid-level
// (radius 0 turns it off). Hazards inside the dark are the whole point.

{ type: 'spring', x, y, w, h }
// Bounce pad (typical 40×12, sits on a floor). Landing on / stepping onto its
// top launches the player upward at vy = -1150 (~275px rise — roughly 2× a
// normal jump). Deterministic, renders as a coiled pad with a subtle sheen.
// Fair-use: springs may launch players toward hidden trouble (icicles, warp
// triggers) but the level must remain beatable with knowledge; a spring on the
// only path must have a survivable landing.

{ type: 'oneway', x, y, w, h }                                       // v3 wave 2 (ch7+)
// Thin one-way platform (typical h: 12). Solid ONLY when the player is
// falling/resting onto its TOP (vy >= 0 at the moment of overlap) — jumping
// up into its underside passes through freely, and it never blocks horizontal
// movement (walking under/through the sides is always free). While standing
// on one, holding Down and pressing Jump drops the player straight through
// instead of jumping (a short ~0.3s grace window ignores that specific
// platform so the player actually clears it instead of re-landing next
// frame). Renders as a top line with short vertical slats hanging below it —
// deliberately NOT a filled block, so it reads as "see-through" at a glance.

{ type: 'wind', x, y, w, h, fx: 0, fy: 0 }                            // v3 wave 2 (ch7+)
// Invisible force region (renders as faint deterministic streak lines drifting
// in the force direction — no gameplay meaning, cosmetic only). While the
// player's AABB overlaps the zone, `fx`/`fy` (px/s²) are added to the
// player's velocity every tick. `fy` is capped at ±1200 (validator-enforced).
// Chosen ground rule (documented here since the alternative — "grounded only
// if it overcomes standing friction" — was judged harder to reason about for
// level design): wind ALWAYS applies while airborne; while grounded it only
// applies if the zone's |fx| > 400 (otherwise standing friction — i.e. the
// player's own instant-decel input handling — would fully cancel it anyway,
// so skip the wasted computation/visual mismatch). The wind-CONTRIBUTED
// portion of vx is tracked separately and capped at ±250 px/s; it decays to
// 0 the instant the player leaves the zone (no residual drift once outside).
// Multiple overlapping wind zones sum their fx/fy for that frame.

{ type: 'button', id, x, y, w, h (typical 30×12), once: false, actions: [...] }  // v3 wave 2 (ch8+)
// Non-collidable pressure plate (a floor solid still needs to be placed
// underneath it by the level — the button itself never blocks movement).
// Fires `actions` (same list as `trigger`) on the press EDGE (player
// overlaps after not overlapping). Unlike `trigger`, a button is RE-ARMABLE
// by default (`once` defaults to false) — leaving and re-touching it fires
// again; pass `once: true` for a single-use button. Renders as a plate that
// visually depresses into its housing while pressed.

{ do: 'open', target: 'doorId', duration: 3 }              // trigger action, v3 wave 2
// Targets a { type: 'door', id, x, y, w, h } object (a solid that renders as
// a barred/paneled gate; behaves as a normal solid while closed — including
// participating in `crushCheck` like solid/platform). 'open' makes it
// non-collidable and slides it up out of its footprint over ~0.15s, then
// after `duration` seconds it SLAMS back shut instantly (thunk SFX + a small
// screen shake) and becomes solid again. If the player's AABB overlaps the
// door's rect at the exact instant it slams shut → crush death (same
// "SQUEEZE" fairness family as a moving platform pinning the player, just
// triggered by a state flip instead of motion). Firing 'open' on a door
// that's ALREADY open RE-ARMS its hold timer to the new duration (does not
// no-op) — a second button that re-slams an already-open door much sooner
// than its first opener promised is a deliberate, supported trap (see
// js/levels_d.js L38's "the other button").

{ type: 'key', id, x, y, w, h (typical 24×24) }                       // v3 wave 2 (ch8+)
// Floating, slowly bobbing gold key. Touching it collects it (per-life —
// resets on death like all runtime state); plays a bright two-note chime.
// The player can hold at most one key at a time (a plain boolean flag, not
// per-id inventory — "keys are generic," see below); a small key icon floats
// above the player's head for as long as it's held (no HUD slot).

{ type: 'lock', id, x, y, w, h }                                      // v3 wave 2 (ch8+)
// A solid rendered with a padlock emblem. Without a key it behaves as a
// plain wall. Touched WHILE holding a key: consumes the key, removes the
// lock (pop FX + a reused subtle mechanical click — no new SFX was
// warranted for this one), and lets the player continue through unimpeded
// on that same frame. Multiple key/lock pairs are allowed per level; keys
// are intentionally generic/interchangeable — a held key opens the first
// lock it touches, not a matched id. Keep key/lock puzzles simple with this
// in mind (don't rely on a specific key going to a specific lock).

{ do: 'fakeclear' }                                          // trigger action, v3 wave 2
// The genre-famous troll. Instantly shows a replica of the real LEVEL CLEAR
// overlay (same DOM/CSS as the real one, so it is pixel-identical, not just
// similar) and plays the real levelClear chime. Holds for ~1.2s — during
// which the level and player physics keep running completely normally
// underneath (player retains full control the whole time; the overlay is a
// purely cosmetic layer on top of the canvas) — then rips away with a
// descending buzz/scratch SFX and a screen shake, and play continues. The
// REAL level-clear flow (touching the actual exit) is entirely separate code
// and is untouched by this. Typically wired to a `trigger` on a `decoy` door.
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
{ do: 'dark',   radius: 150 }                // v3: set vision radius (0 = off); see darkness note above
{ do: 'open',   target: 'doorId', duration: 3 }  // v3 wave 2: open a door for N seconds, then it slams shut (see `door` above)
{ do: 'fakeclear' }                          // v3 wave 2: troll fake LEVEL CLEAR overlay, then rips away (see above)
```

All trigger state (revealed/hidden/moved objects, projectiles, platform positions,
fired flags, door open/closed, button press-edge, collected keys/consumed locks,
the fake-clear hold) resets on death/respawn. Levels are fully deterministic.

### Death & respawn

- Touching any hazard, projectile, or falling below y > 620 = death.
- Death: ragdoll burst animation + buzzer + deaths++ , respawn in **< 0.7 s** at level spawn.
- Being crushed = death, defined as SQUEEZE: when a moving solid/platform
  displaces the player, the engine pushes the player along the mover's motion;
  if the pushed player would then overlap ANY other visible solid (or the mover
  still overlaps them), the player dies. A mover must never merely shove the
  player through/around geometry it has pinned them against. A closed `door`
  and a still-locked `lock` participate in this exact check like a solid
  (excluded the instant they open/unlock); a `door` slamming shut on the
  player (see the `open` action above) is its own separate, simpler crush
  check since nothing physically moved — it's a state flip, not a mover.

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
