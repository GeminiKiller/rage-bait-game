// js/levels_b.js — Levels 11-22 ("Complexity" -> "Mastery" -> "Victory Lap" -> "Finale")
// Plain script, no modules. Defines window.LEVELS_B per SPEC.md v2 level format.
// Levels 1-10 (levels_a.js) already taught: fake floors (hide), spike pop-ups
// (reveal), runaway exits (move exit), invisible blocks over pits (reveal
// solid), pin-crushers (startOnTrigger fast platform), wall arrows (shoot).
// v2 adds: warp (teleport player), invert (reverse controls, no indicator),
// decoy (fake exit, pixel-identical), and reveal/hide/move on hazards
// (falling ceiling spikes = a hazard moved down after being revealed).
// v3 (this pass) escalates density further and weaves in the 'ice' hazard
// variant (icicle cluster, typically dir:'down' hanging from ceilings, same
// kill behavior as spikes; shoot projectiles now always render as icicles
// regardless of direction — mechanics unchanged, 24x6 hitbox, <=500px/s).
//
// DENSITY (per player-facing directive, escalated from the v2 remix):
// L11-14 = 6 traps, L15-18 = 7, L19-21 = 7-8, L22 = 10 (everything-gauntlet).
// Traps CHAIN — the recovery/panic move from trap N (a jump, a dash, a
// sprint) carries the player straight into trap N+1's trigger zone, so
// there is rarely a calm beat between events. Every trap still: kills by
// surprise at most once, is beatable with knowledge + honest execution (no
// pixel-perfect), gives >=0.25s reaction once sprung, and resets fully on
// death.
//
// ICE MODULES (used in >=5 levels: L11, L14, L16, L18, L19, L21, L22):
//   - Hanging icicle cluster: a VISIBLE (not hidden) variant:'ice' hazard
//     spanning from the ceiling down to well above the walkable tier
//     (>=90px clearance over the tallest jump needed there) — atmosphere +
//     a real hazard, not a surprise. See L11's iceHang1 over the safe1 gap.
//   - Triggered falling icicle: a trigger fires
//     { do:'shoot', from:{x:targetX,y:250}, dir:{x:0,y:1}, speed:460 } with
//     delay~0.1s, trigger zone placed ~120px before targetX (matches the
//     ~0.4s total fall+delay time at the player's 300px/s) so it intercepts
//     the corridor near where the player will be. See L14/L18/L19.
//   - Icicle rain: 2-3 of the above falling-icicle triggers spaced >=90px
//     apart along a corridor (>=0.3s apart at 300px/s). See L21, L22.
//   - Horizontal icicle volley: a second { do:'shoot', dir:{x:1,y:0} }
//     trigger staggered ~0.3-0.4s after an existing arrow shot from the
//     opposite side — true crossfire, now icicle-flavored. See L16.
//
// Geometry conventions:
//   - Ground tier (tier1): floors at y=480, h=60 (top surface y=480);
//     standing player top-left y=440 (feet at 480).
//   - Raised tier (tier2): floors at y=390, h=150 (top surface y=390);
//     standing player top-left y=350 (feet at 390). Step-up from tier1 is
//     480-390=90px (<=100 OK), always placed FLUSH (no horizontal gap) so
//     it's a pure vertical hop.
//   - Exit door 30w x 50h sits flush on its tier: y = tierTop - 50.
//   - Trigger zones over a tier use y=290,h=110 (tier2, covers player box
//     350-390) or y=380,h=100 (tier1, covers player box 440-480).
//   - "Ceiling-spike drop" module: hazard hidden ~50px above its landing
//     spot, trigger reveals it and moves it down at speed 500-600 (near
//     -instant fall), with the trigger placed ~100-130px before the
//     landing x so first crossing gets caught (travel+delay ~0.25-0.3s <
//     100-130px/300px/s) while a knowing player just hops the now-static
//     spike like any other bump.
//   - Jump math verified per level: step-up <=100px, flat/board gap <=170px
//     (usually <=20-30px for boarding, <=150 for dismounts), platform hop
//     <=150px. Arrows <=500px/s, crushers/platforms <=600px/s.

window.LEVELS_B = [

  // ================= LEVEL 11 =================
  // SOLUTION: FloorA[0,200], hop spike1(150-180). Step up (90px, flush) onto
  //   step1(200-340,tier2). Crossing x210 fires an arrow from the right
  //   wall (~1.2s lead) - hop it. Board plat1 at x360 (20px gap) and ride
  //   UNDER the visible hanging icicle cluster over safe1 (stay low, plenty
  //   of clearance); crossing x460-510 silently hides plat1 AND reveals
  //   safe1(560-690) in the same instant - jump the ~50-100px remainder onto
  //   safe1. Stepping onto tier2B(690+) instantly springs crusher1 (corridor
  //   710-770, panic-chained off the ghost scare) - wait, dash through.
  //   Immediately after, an icicle silently drops onto x890-920
  //   (100px/0.33s lead) as you're still recovering from the dash - hop it,
  //   then exit@925.
  {
    name: "Platform Ghosting",
    theme: 'icecave',
    deathMsgs: [
      "It ghosted you mid-ride.",
      "New phone, who dis?",
      "The platform said 'it's not you, it's me.'"
    ],
    spawn: { x: 40, y: 440 },
    exit: { x: 925, y: 340 },
    objects: [
      { id: 'floorA', type: 'solid', x: 0, y: 480, w: 200, h: 60 },
      { id: 'spike1', type: 'hazard', variant: 'spikes', dir: 'up', x: 150, y: 460, w: 30, h: 20 },
      { id: 'step1', type: 'solid', x: 200, y: 390, w: 140, h: 150 },
      { type: 'trigger', x: 210, y: 290, w: 40, h: 110, once: true, delay: 0.25,
        actions: [ { do: 'shoot', from: { x: 960, y: 365 }, dir: { x: -1, y: 0 }, speed: 420 } ] },
      { id: 'plat1', type: 'platform', x: 360, y: 390, w: 90, h: 20,
        path: [{ x: 540, y: 390 }], speed: 150, mode: 'pingpong' },
      { id: 'safe1', type: 'solid', x: 560, y: 390, w: 130, h: 150, hidden: true },
      { type: 'trigger', x: 460, y: 290, w: 50, h: 110, once: true, delay: 0,
        actions: [ { do: 'hide', target: 'plat1' }, { do: 'reveal', target: 'safe1' } ] },
      { id: 'iceHang1', type: 'hazard', variant: 'ice', dir: 'down', x: 560, y: 0, w: 130, h: 300 },
      { id: 'tier2B', type: 'solid', x: 690, y: 390, w: 270, h: 150 },
      { id: 'crusher1', type: 'platform', x: 710, y: 80, w: 60, h: 40,
        path: [{ x: 710, y: 350 }], speed: 560, mode: 'pingpong', startOnTrigger: true, hidden: true },
      { type: 'trigger', x: 692, y: 290, w: 18, h: 110, once: true, delay: 0,
        actions: [ { do: 'reveal', target: 'crusher1' }, { do: 'start', target: 'crusher1' }, { do: 'shake' } ] },
      { id: 'ceilSpike1', type: 'hazard', variant: 'ice', dir: 'down', x: 890, y: 350, w: 30, h: 20, hidden: true },
      { type: 'trigger', x: 790, y: 290, w: 20, h: 110, once: true, delay: 0.05,
        actions: [ { do: 'reveal', target: 'ceilSpike1' }, { do: 'move', target: 'ceilSpike1', to: { x: 890, y: 370 }, speed: 500 }, { do: 'shake' } ] },
      // Cave dressing: decor is non-colliding, cannot affect physics.
      { id: 'ceilDecor1', type: 'decor', variant: 'ceiling', x: 860, y: 320, w: 65, h: 30 },
      { id: 'stal1', type: 'decor', variant: 'stalagmite', x: 130, y: 450, w: 20, h: 30 },
      { id: 'crystal1', type: 'decor', variant: 'crystal', x: 280, y: 370, w: 20, h: 20 },
      { id: 'rocks1', type: 'decor', variant: 'rocks', x: 800, y: 370, w: 18, h: 20 }
    ]
  },

  // ================= LEVEL 12 =================
  // SOLUTION: FloorA[0,200], hop spike1(150-180). Step up onto step1
  //   (200-340,tier2). Board plat1 at x360 (20px gap) and ride; crossing
  //   x430 fires an arrow from the right (~1.2s lead), crossing x490 fires
  //   one from the LEFT (~1.6s lead) - true crossfire, hop each in turn
  //   without stopping. Dismount flush onto tier2B(650+) - the crossfire
  //   panic silently pops a ground spike at x700-730 (~0.32s lead) - hop it.
  //   Ceiling spike drops onto x770 (100px/0.33s lead) - hop it. Immediately
  //   after, crusher1 springs (corridor 850-910) - wait, dash through, then
  //   exit@925 is right there.
  {
    name: "Arrow Alley",
    theme: 'icecave',
    deathMsgs: [
      "Death by a thousand... well, two arrows.",
      "You had a whole second to react.",
      "Dodgeball champion you are not."
    ],
    spawn: { x: 40, y: 440 },
    exit: { x: 925, y: 340 },
    objects: [
      { id: 'floorA', type: 'solid', x: 0, y: 480, w: 200, h: 60 },
      { id: 'spike1', type: 'hazard', variant: 'spikes', dir: 'up', x: 150, y: 460, w: 30, h: 20 },
      { id: 'step1', type: 'solid', x: 200, y: 390, w: 140, h: 150 },
      { id: 'plat1', type: 'platform', x: 360, y: 390, w: 90, h: 20,
        path: [{ x: 560, y: 390 }], speed: 160, mode: 'pingpong' },
      { type: 'trigger', x: 430, y: 290, w: 40, h: 110, once: true, delay: 0.25,
        actions: [ { do: 'shoot', from: { x: 960, y: 365 }, dir: { x: -1, y: 0 }, speed: 420 } ] },
      { type: 'trigger', x: 490, y: 290, w: 40, h: 110, once: true, delay: 0.25,
        actions: [ { do: 'shoot', from: { x: 0, y: 365 }, dir: { x: 1, y: 0 }, speed: 420 } ] },
      { id: 'tier2B', type: 'solid', x: 650, y: 390, w: 310, h: 150 },
      { id: 'popSpike1', type: 'hazard', variant: 'spikes', dir: 'up', x: 700, y: 370, w: 30, h: 20, hidden: true },
      { type: 'trigger', x: 650, y: 290, w: 15, h: 110, once: true, delay: 0.15,
        actions: [ { do: 'reveal', target: 'popSpike1' }, { do: 'shake' } ] },
      { id: 'ceilSpike1', type: 'hazard', variant: 'spikes', dir: 'down', x: 770, y: 350, w: 30, h: 20, hidden: true },
      { type: 'trigger', x: 670, y: 290, w: 20, h: 110, once: true, delay: 0.05,
        actions: [ { do: 'reveal', target: 'ceilSpike1' }, { do: 'move', target: 'ceilSpike1', to: { x: 770, y: 370 }, speed: 600 }, { do: 'shake' } ] },
      { id: 'crusher1', type: 'platform', x: 850, y: 80, w: 60, h: 40,
        path: [{ x: 850, y: 350 }], speed: 560, mode: 'pingpong', startOnTrigger: true, hidden: true },
      { type: 'trigger', x: 800, y: 290, w: 20, h: 110, once: true, delay: 0,
        actions: [ { do: 'reveal', target: 'crusher1' }, { do: 'start', target: 'crusher1' }, { do: 'shake' } ] },
      // Cave dressing (non-colliding).
      { id: 'stal1', type: 'decor', variant: 'stalagmite', x: 50, y: 450, w: 20, h: 30 },
      { id: 'crystal1', type: 'decor', variant: 'crystal', x: 260, y: 370, w: 20, h: 20 },
      { id: 'rocks1', type: 'decor', variant: 'rocks', x: 810, y: 370, w: 18, h: 20 },
      // Optional bonus spring: sits on floorA well before spike1 (90-130 vs
      // 150-180, 20px clear margin) - hop over it to ignore, or ride it for a
      // harmless ~275px bounce with nothing but a taunt up top. Never required.
      { id: 'bonusSpring1', type: 'spring', x: 90, y: 468, w: 40, h: 12 },
      { type: 'trigger', x: 80, y: 50, w: 60, h: 150, once: true, delay: 0,
        actions: [ { do: 'msg', text: "Bonus air. Don't get used to it." } ] }
    ]
  },

  // ================= LEVEL 13 =================
  // SOLUTION: FloorA[0,220]; jump fake1's 80px gap (220-300) - a silent
  //   trigger hides it 0.25s after you step on it. FloorB: crusher1 springs
  //   at x360 (corridor 390-460, chained off the collapsing-floor panic) -
  //   wait, dash through. Still recovering, a ground spike pops at x490-520
  //   (~0.28s lead) - hop it. Step up onto tier2 (550, 90px flush). A
  //   ceiling spike drops onto x660 (100px/0.33s lead) - hop it. The decoy door at
  //   x800 looks exactly like the exit; touching it silently warps you to a
  //   caged ledge (770,160) with a spike at x850-880 - walk LEFT off the
  //   ledge (never touch the spike) to drop safely back onto the deck at
  //   ~750-770. The real exit is now revealed at x870 - walk past the inert
  //   decoy to it.
  {
    name: "Three-Course Betrayal",
    theme: 'icecave',
    deathMsgs: [
      "Appetizer, entree, and your funeral.",
      "The crusher sends its regards.",
      "The cage was the real trap all along."
    ],
    spawn: { x: 40, y: 440 },
    exit: { x: 870, y: 340, hidden: true },
    objects: [
      { id: 'floorA', type: 'solid', x: 0, y: 480, w: 220, h: 60 },
      { id: 'fake1', type: 'solid', x: 220, y: 480, w: 80, h: 60 },
      { type: 'trigger', x: 220, y: 440, w: 80, h: 40, once: true, delay: 0.25,
        actions: [ { do: 'hide', target: 'fake1' } ] },
      { id: 'floorB', type: 'solid', x: 300, y: 480, w: 250, h: 60 },
      { id: 'crusher1', type: 'platform', x: 390, y: 80, w: 70, h: 40,
        path: [{ x: 390, y: 440 }], speed: 560, mode: 'pingpong', startOnTrigger: true, hidden: true },
      { type: 'trigger', x: 360, y: 380, w: 20, h: 100, once: true, delay: 0,
        actions: [ { do: 'reveal', target: 'crusher1' }, { do: 'start', target: 'crusher1' }, { do: 'shake' } ] },
      { id: 'popSpike1', type: 'hazard', variant: 'spikes', dir: 'up', x: 490, y: 460, w: 30, h: 20, hidden: true },
      { type: 'trigger', x: 400, y: 380, w: 15, h: 100, once: true, delay: 0,
        actions: [ { do: 'reveal', target: 'popSpike1' }, { do: 'shake' } ] },
      { id: 'step1', type: 'solid', x: 550, y: 390, w: 150, h: 150 },
      { id: 'ceilSpike1', type: 'hazard', variant: 'spikes', dir: 'down', x: 660, y: 350, w: 30, h: 20, hidden: true },
      { type: 'trigger', x: 560, y: 290, w: 20, h: 110, once: true, delay: 0.05,
        actions: [ { do: 'reveal', target: 'ceilSpike1' }, { do: 'move', target: 'ceilSpike1', to: { x: 660, y: 370 }, speed: 600 }, { do: 'shake' } ] },
      { id: 'deck2', type: 'solid', x: 700, y: 390, w: 220, h: 150 },
      { id: 'decoy1', type: 'decoy', x: 800, y: 340, w: 30, h: 50 },
      { type: 'trigger', x: 795, y: 335, w: 40, h: 60, once: true, delay: 0,
        actions: [
          { do: 'warp', to: { x: 770, y: 160 } },
          { do: 'reveal', target: 'cageFloor' },
          { do: 'reveal', target: 'cageSpike' },
          { do: 'reveal', target: 'exit' },
          { do: 'shake' }
        ] },
      { id: 'cageFloor', type: 'solid', x: 750, y: 200, w: 140, h: 20, hidden: true },
      { id: 'cageSpike', type: 'hazard', variant: 'spikes', dir: 'up', x: 850, y: 180, w: 30, h: 20, hidden: true },
      { type: 'trigger', x: 760, y: 120, w: 60, h: 80, once: true, delay: 0.1,
        actions: [ { do: 'msg', text: 'Not the exit. Try again.' } ] },
      // Cave dressing (non-colliding); kept clear of decoy1 and the cage.
      { id: 'stal1', type: 'decor', variant: 'stalagmite', x: 60, y: 450, w: 20, h: 30 },
      { id: 'crystal1', type: 'decor', variant: 'crystal', x: 610, y: 370, w: 20, h: 20 },
      { id: 'rocks1', type: 'decor', variant: 'rocks', x: 720, y: 370, w: 20, h: 20 }
    ]
  },

  // ================= LEVEL 14 =================
  // SOLUTION: FloorA[0,200], hop spike1(150-180). Step up onto step1
  //   (200-340). Crossing x210 fires an arrow (~1.2s lead) - hop it. Board
  //   plat1 at x360 (20px gap) and ride; mid-ride a spike silently pops at
  //   the OBVIOUS landing spot (650-700) - don't step off there, jump PAST
  //   it onto tier2B (land >=700, <=150px hop). Landing (still rushing)
  //   springs a ceiling icicle drop at x760 (chained) - hop it. Immediately
  //   after, crusher1 springs (corridor 850-910, chained) - wait, dash. As
  //   you clear it, one more icicle falls at x890 (~0.4s lead) right before
  //   the door - hop it, exit@925.
  {
    name: "Stick the Landing",
    theme: 'icecave',
    deathMsgs: [
      "10/10 for style, 0/10 for survival.",
      "The welcome mat had a catch.",
      "You landed. On spikes. Great job."
    ],
    spawn: { x: 40, y: 440 },
    exit: { x: 925, y: 340 },
    objects: [
      { id: 'floorA', type: 'solid', x: 0, y: 480, w: 200, h: 60 },
      { id: 'spike1', type: 'hazard', variant: 'spikes', dir: 'up', x: 150, y: 460, w: 30, h: 20 },
      { id: 'step1', type: 'solid', x: 200, y: 390, w: 140, h: 150 },
      { type: 'trigger', x: 210, y: 290, w: 40, h: 110, once: true, delay: 0.25,
        actions: [ { do: 'shoot', from: { x: 960, y: 365 }, dir: { x: -1, y: 0 }, speed: 420 } ] },
      { id: 'plat1', type: 'platform', x: 360, y: 390, w: 90, h: 20,
        path: [{ x: 560, y: 390 }], speed: 150, mode: 'pingpong' },
      { id: 'tier2B', type: 'solid', x: 650, y: 390, w: 310, h: 150 },
      { id: 'spikepop', type: 'hazard', variant: 'spikes', dir: 'up', x: 650, y: 370, w: 50, h: 20, hidden: true },
      { type: 'trigger', x: 560, y: 290, w: 40, h: 110, once: true, delay: 0.2,
        actions: [ { do: 'reveal', target: 'spikepop' }, { do: 'shake' } ] },
      { id: 'ceilSpike1', type: 'hazard', variant: 'ice', dir: 'down', x: 760, y: 350, w: 30, h: 20, hidden: true },
      { type: 'trigger', x: 705, y: 290, w: 15, h: 110, once: true, delay: 0.05,
        actions: [ { do: 'reveal', target: 'ceilSpike1' }, { do: 'move', target: 'ceilSpike1', to: { x: 760, y: 370 }, speed: 500 }, { do: 'shake' } ] },
      { id: 'crusher1', type: 'platform', x: 850, y: 80, w: 60, h: 40,
        path: [{ x: 850, y: 350 }], speed: 560, mode: 'pingpong', startOnTrigger: true, hidden: true },
      { type: 'trigger', x: 800, y: 290, w: 20, h: 110, once: true, delay: 0,
        actions: [ { do: 'reveal', target: 'crusher1' }, { do: 'start', target: 'crusher1' }, { do: 'shake' } ] },
      { type: 'trigger', x: 770, y: 290, w: 15, h: 110, once: true, delay: 0.1,
        actions: [ { do: 'shoot', from: { x: 890, y: 250 }, dir: { x: 0, y: 1 }, speed: 460 }, { do: 'shake' } ] },
      // Cave dressing (non-colliding): ceiling slab flush above ceilSpike1.
      { id: 'ceilDecor1', type: 'decor', variant: 'ceiling', x: 740, y: 320, w: 70, h: 30 },
      { id: 'stal1', type: 'decor', variant: 'stalagmite', x: 100, y: 450, w: 20, h: 30 },
      { id: 'crystal1', type: 'decor', variant: 'crystal', x: 280, y: 370, w: 20, h: 20 },
      { id: 'rocks1', type: 'decor', variant: 'rocks', x: 715, y: 370, w: 18, h: 20 }
    ]
  },

  // ================= LEVEL 15 =================
  // SOLUTION: FloorA[0,220]; jump fake1's 80px gap (220-300, hides 0.25s
  //   after touch). FloorB: crusher1 springs at x355 (corridor 380-440,
  //   chained off the collapse) - wait, dash. Step up onto tier2(550) -
  //   immediately an arrow fires (~1.3s lead) - hop it. A second arrow fires
  //   from the LEFT at x600 (~1.1s lead) right after - true crossfire, hop
  //   both. Entering tier2B(680) a ceiling spike drops on x740 (chained) -
  //   hop it. 20px later crusher2 springs (corridor 820-880, chained) -
  //   wait, dash. One more hidden spike pops at x895 right after (chained)
  //   - hop it, exit@930.
  {
    name: "Everything Bagel",
    theme: 'lava',
    deathMsgs: [
      "You ordered the combo. It ordered you.",
      "Floor, crusher, arrow, spikes. Pick your poison.",
      "That's a lot of ways to die in one hallway."
    ],
    spawn: { x: 40, y: 440 },
    exit: { x: 930, y: 340 },
    objects: [
      { id: 'floorA', type: 'solid', x: 0, y: 480, w: 220, h: 60 },
      { id: 'fake1', type: 'solid', x: 220, y: 480, w: 80, h: 60 },
      { type: 'trigger', x: 220, y: 440, w: 80, h: 40, once: true, delay: 0.25,
        actions: [ { do: 'hide', target: 'fake1' } ] },
      { id: 'floorB', type: 'solid', x: 300, y: 480, w: 250, h: 60 },
      { id: 'crusher1', type: 'platform', x: 380, y: 80, w: 60, h: 40,
        path: [{ x: 380, y: 440 }], speed: 560, mode: 'pingpong', startOnTrigger: true, hidden: true },
      { type: 'trigger', x: 355, y: 380, w: 20, h: 100, once: true, delay: 0,
        actions: [ { do: 'reveal', target: 'crusher1' }, { do: 'start', target: 'crusher1' }, { do: 'shake' } ] },
      { id: 'step1', type: 'solid', x: 550, y: 390, w: 130, h: 150 },
      { type: 'trigger', x: 560, y: 290, w: 30, h: 110, once: true, delay: 0.2,
        actions: [ { do: 'shoot', from: { x: 960, y: 365 }, dir: { x: -1, y: 0 }, speed: 430 } ] },
      { type: 'trigger', x: 600, y: 290, w: 20, h: 110, once: true, delay: 0.15,
        actions: [ { do: 'shoot', from: { x: 0, y: 365 }, dir: { x: 1, y: 0 }, speed: 420 } ] },
      { id: 'tier2B', type: 'solid', x: 680, y: 390, w: 280, h: 150 },
      { id: 'ceilSpike1', type: 'hazard', variant: 'spikes', dir: 'down', x: 740, y: 350, w: 30, h: 20, hidden: true },
      { type: 'trigger', x: 690, y: 290, w: 15, h: 110, once: true, delay: 0.05,
        actions: [ { do: 'reveal', target: 'ceilSpike1' }, { do: 'move', target: 'ceilSpike1', to: { x: 740, y: 370 }, speed: 600 }, { do: 'shake' } ] },
      { id: 'crusher2', type: 'platform', x: 820, y: 80, w: 60, h: 40,
        path: [{ x: 820, y: 350 }], speed: 580, mode: 'pingpong', startOnTrigger: true, hidden: true },
      { type: 'trigger', x: 790, y: 290, w: 20, h: 110, once: true, delay: 0,
        actions: [ { do: 'reveal', target: 'crusher2' }, { do: 'start', target: 'crusher2' }, { do: 'shake' } ] },
      { id: 'finalSpike', type: 'hazard', variant: 'lava', dir: 'up', x: 895, y: 370, w: 30, h: 20, hidden: true },
      { type: 'trigger', x: 890, y: 290, w: 10, h: 110, once: true, delay: 0.1,
        actions: [ { do: 'reveal', target: 'finalSpike' }, { do: 'shake' } ] },
      // Lava-zone dressing (non-colliding rocks).
      { id: 'rocks1', type: 'decor', variant: 'rocks', x: 100, y: 450, w: 24, h: 30 },
      { id: 'rocks2', type: 'decor', variant: 'rocks', x: 640, y: 370, w: 20, h: 20 },
      { id: 'rocks3', type: 'decor', variant: 'rocks', x: 780, y: 370, w: 18, h: 20 }
    ]
  },

  // ================= LEVEL 16 =================
  // SOLUTION: Long flat floor[0,960] - looks trivial. Hop spike1(300-330).
  //   Crossing x150-170 silently reveals a lava wall right behind you
  //   (starts x90, chases right at 180px/s, well under your 300px/s) and
  //   RUN! flashes - too late to matter, it's already sprung. While
  //   fleeing: an arrow fires at x450 (~1.1s lead) - hop it. A second shard
  //   fires from the LEFT at x520 (~1.3s lead) right after - a true
  //   icicle volley, hop both without slowing (the chaser is still ~200px
  //   back, safe). A ceiling icicle drops at x600 (chained) - hop it.
  //   Crusher springs at x700 (corridor 700-760, chained) - wait, dash. One
  //   more spike hop at x880, then exit@925. Don't stop.
  {
    name: "The Point of No Return",
    theme: 'lava',
    deathMsgs: [
      "Should've kept running.",
      "The wall wanted a word.",
      "This is why we don't sightsee."
    ],
    spawn: { x: 40, y: 440 },
    exit: { x: 925, y: 430 },
    objects: [
      { id: 'floor', type: 'solid', x: 0, y: 480, w: 960, h: 60 },
      { id: 'spike1', type: 'hazard', variant: 'spikes', dir: 'up', x: 300, y: 460, w: 30, h: 20 },
      { id: 'chaser', type: 'hazard', variant: 'lava', dir: 'right', x: 90, y: 0, w: 40, h: 540, hidden: true },
      { type: 'trigger', x: 150, y: 380, w: 20, h: 150, once: true, delay: 0,
        actions: [
          { do: 'msg', text: 'RUN!' },
          { do: 'shake' },
          { do: 'reveal', target: 'chaser' },
          { do: 'move', target: 'chaser', to: { x: 1000, y: 0 }, speed: 180 }
        ] },
      { type: 'trigger', x: 450, y: 380, w: 20, h: 150, once: true, delay: 0.2,
        actions: [ { do: 'shoot', from: { x: 960, y: 450 }, dir: { x: -1, y: 0 }, speed: 440 } ] },
      { type: 'trigger', x: 520, y: 380, w: 15, h: 150, once: true, delay: 0.15,
        actions: [ { do: 'shoot', from: { x: 0, y: 450 }, dir: { x: 1, y: 0 }, speed: 420 } ] },
      { id: 'ceilSpike1', type: 'hazard', variant: 'ice', dir: 'down', x: 600, y: 440, w: 30, h: 20, hidden: true },
      { type: 'trigger', x: 560, y: 380, w: 20, h: 100, once: true, delay: 0.05,
        actions: [ { do: 'reveal', target: 'ceilSpike1' }, { do: 'move', target: 'ceilSpike1', to: { x: 600, y: 460 }, speed: 500 }, { do: 'shake' } ] },
      { id: 'crusher1', type: 'platform', x: 700, y: 80, w: 60, h: 40,
        path: [{ x: 700, y: 440 }], speed: 580, mode: 'pingpong', startOnTrigger: true, hidden: true },
      { type: 'trigger', x: 670, y: 380, w: 20, h: 100, once: true, delay: 0,
        actions: [ { do: 'reveal', target: 'crusher1' }, { do: 'start', target: 'crusher1' }, { do: 'shake' } ] },
      { id: 'spike2', type: 'hazard', variant: 'lava', dir: 'up', x: 880, y: 460, w: 30, h: 20 },
      // Lava-zone dressing: ceiling slab flush above ceilSpike1, plus rocks.
      { id: 'ceilDecor1', type: 'decor', variant: 'ceiling', x: 580, y: 400, w: 70, h: 40 },
      { id: 'rocks1', type: 'decor', variant: 'rocks', x: 220, y: 450, w: 24, h: 30 },
      { id: 'rocks2', type: 'decor', variant: 'rocks', x: 380, y: 450, w: 20, h: 30 },
      { id: 'rocks3', type: 'decor', variant: 'rocks', x: 800, y: 450, w: 20, h: 30 },
      // Optional bonus spring, well before the chaser wakes up at x150 - a
      // calm little bounce before you have to run for your life. Never required.
      { id: 'bonusSpring1', type: 'spring', x: 50, y: 468, w: 40, h: 12 },
      { type: 'trigger', x: 40, y: 50, w: 60, h: 150, once: true, delay: 0,
        actions: [ { do: 'msg', text: "Enjoy it. Won't last." } ] }
    ]
  },

  // ================= LEVEL 17 =================
  // SOLUTION (safe route, 5 traps): FloorA[0,300], hop spike1(180-210).
  //   Take the SCARY-looking lowerBridge at ground level (300-700): crusher1
  //   springs at x420 (corridor 450-510, chained) - wait, dash. Still
  //   recovering, a ground spike pops at x710-740 on floorB (~0.68s lead,
  //   fully past up2's ceiling at 660 so the hop launches at full height).
  //   FloorB: a ceiling icicle drops at x800 (chained) - hop it, then hop
  //   the plain spike2(850-880), exit@880. The pretty elevated path
  //   (up1/upFake/up2, step up at x300, optional/bait) fires an arrow the
  //   instant you board it, then silently swaps upFake for solid ground
  //   spikes underfoot (2 more traps) - it looks safer and is strictly
  //   worse. Never take it.
  {
    name: "The Devil You Know",
    theme: 'lava',
    deathMsgs: [
      "The pretty path lied.",
      "Looked safe. Wasn't.",
      "Should've trusted the scary bridge."
    ],
    spawn: { x: 40, y: 440 },
    exit: { x: 880, y: 430 },
    objects: [
      { id: 'floorA', type: 'solid', x: 0, y: 480, w: 300, h: 60 },
      { id: 'spike1', type: 'hazard', variant: 'spikes', dir: 'up', x: 180, y: 460, w: 30, h: 20 },
      { id: 'lowerBridge', type: 'solid', x: 300, y: 480, w: 400, h: 60 },
      { id: 'crusher1', type: 'platform', x: 450, y: 80, w: 60, h: 40,
        path: [{ x: 450, y: 440 }], speed: 560, mode: 'pingpong', startOnTrigger: true, hidden: true },
      { type: 'trigger', x: 420, y: 380, w: 20, h: 100, once: true, delay: 0,
        actions: [ { do: 'reveal', target: 'crusher1' }, { do: 'start', target: 'crusher1' }, { do: 'shake' } ] },
      { id: 'popSpike1', type: 'hazard', variant: 'spikes', dir: 'up', x: 710, y: 460, w: 30, h: 20, hidden: true },
      { type: 'trigger', x: 490, y: 380, w: 15, h: 100, once: true, delay: 0,
        actions: [ { do: 'reveal', target: 'popSpike1' }, { do: 'shake' } ] },
      { id: 'floorB', type: 'solid', x: 700, y: 480, w: 260, h: 60 },
      { id: 'ceilSpike1', type: 'hazard', variant: 'ice', dir: 'down', x: 800, y: 440, w: 30, h: 20, hidden: true },
      { type: 'trigger', x: 760, y: 380, w: 20, h: 100, once: true, delay: 0.05,
        actions: [ { do: 'reveal', target: 'ceilSpike1' }, { do: 'move', target: 'ceilSpike1', to: { x: 800, y: 460 }, speed: 500 }, { do: 'shake' } ] },
      { id: 'spike2', type: 'hazard', variant: 'spikes', dir: 'up', x: 850, y: 460, w: 30, h: 20 },
      { id: 'up1', type: 'solid', x: 300, y: 390, w: 180, h: 20 },
      { type: 'trigger', x: 310, y: 290, w: 20, h: 110, once: true, delay: 0.2,
        actions: [ { do: 'shoot', from: { x: 960, y: 365 }, dir: { x: -1, y: 0 }, speed: 420 } ] },
      { id: 'upFake', type: 'solid', x: 480, y: 390, w: 80, h: 20 },
      { id: 'up2', type: 'solid', x: 560, y: 390, w: 100, h: 20 },
      { id: 'spikeDrop', type: 'hazard', variant: 'spikes', dir: 'up', x: 480, y: 460, w: 80, h: 20, hidden: true },
      { type: 'trigger', x: 470, y: 290, w: 40, h: 110, once: true, delay: 0.25,
        actions: [ { do: 'hide', target: 'upFake' }, { do: 'reveal', target: 'spikeDrop' } ] },
      // GEOMETRY FROZEN above (L17 QA-certified) - additions below are
      // non-colliding decor only, cannot affect any jump/trigger/trap.
      { id: 'ceilDecor1', type: 'decor', variant: 'ceiling', x: 780, y: 400, w: 70, h: 40 },
      { id: 'rocks1', type: 'decor', variant: 'rocks', x: 50, y: 450, w: 24, h: 30 },
      { id: 'rocks2', type: 'decor', variant: 'rocks', x: 610, y: 450, w: 20, h: 30 },
      { id: 'rocks3', type: 'decor', variant: 'rocks', x: 745, y: 450, w: 20, h: 30 }
    ]
  },

  // ================= LEVEL 18 =================
  // SOLUTION: FloorA[0,230]; crusher1 springs at x70 (corridor 110-170,
  //   right out of the gate) - wait, dash. Hop spike1(185-215). Step up
  //   onto step1(230-350). Crossing x240 fires an arrow (~1.3s lead) - hop
  //   it. Board plat1 at x370 (20px gap), ride to tier2B(640+) - mid-ride an
  //   icicle starts falling toward x755 (~0.4s lead). A ceiling icicle also
  //   drops at x710 (chained) - hop both. The visible exit(790) flees to
  //   x870 as you approach ("Nice try.") - follow it; it flees AGAIN to its
  //   true rest at x930 ("AGAIN?!") - walk in, done.
  {
    name: "Two-Timer",
    theme: 'night',
    deathMsgs: [
      "It's not you, it's commitment.",
      "The door has trust issues.",
      "Two-timed. Literally."
    ],
    spawn: { x: 40, y: 440 },
    exit: { x: 790, y: 340 },
    objects: [
      { id: 'floorA', type: 'solid', x: 0, y: 480, w: 230, h: 60 },
      { id: 'crusher1', type: 'platform', x: 110, y: 80, w: 60, h: 40,
        path: [{ x: 110, y: 440 }], speed: 560, mode: 'pingpong', startOnTrigger: true, hidden: true },
      { type: 'trigger', x: 70, y: 380, w: 20, h: 100, once: true, delay: 0,
        actions: [ { do: 'reveal', target: 'crusher1' }, { do: 'start', target: 'crusher1' }, { do: 'shake' } ] },
      { id: 'spike1', type: 'hazard', variant: 'spikes', dir: 'up', x: 185, y: 460, w: 30, h: 20 },
      { id: 'step1', type: 'solid', x: 230, y: 390, w: 120, h: 150 },
      { type: 'trigger', x: 240, y: 290, w: 30, h: 110, once: true, delay: 0.2,
        actions: [ { do: 'shoot', from: { x: 960, y: 365 }, dir: { x: -1, y: 0 }, speed: 420 } ] },
      { id: 'plat1', type: 'platform', x: 370, y: 390, w: 90, h: 20,
        path: [{ x: 550, y: 390 }], speed: 150, mode: 'pingpong' },
      { id: 'tier2B', type: 'solid', x: 640, y: 390, w: 320, h: 150 },
      { type: 'trigger', x: 635, y: 290, w: 15, h: 110, once: true, delay: 0.1,
        actions: [ { do: 'shoot', from: { x: 755, y: 250 }, dir: { x: 0, y: 1 }, speed: 460 }, { do: 'shake' } ] },
      { id: 'ceilSpike1', type: 'hazard', variant: 'ice', dir: 'down', x: 710, y: 350, w: 30, h: 20, hidden: true },
      { type: 'trigger', x: 660, y: 290, w: 20, h: 110, once: true, delay: 0.05,
        actions: [ { do: 'reveal', target: 'ceilSpike1' }, { do: 'move', target: 'ceilSpike1', to: { x: 710, y: 370 }, speed: 500 }, { do: 'shake' } ] },
      { type: 'trigger', x: 760, y: 290, w: 30, h: 110, once: true, delay: 0,
        actions: [ { do: 'msg', text: 'Nice try.' }, { do: 'shake' }, { do: 'move', target: 'exit', to: { x: 870, y: 340 }, speed: 500 } ] },
      { type: 'trigger', x: 870, y: 290, w: 30, h: 110, once: true, delay: 0,
        actions: [ { do: 'msg', text: 'AGAIN?!' }, { do: 'shake' }, { do: 'move', target: 'exit', to: { x: 930, y: 340 }, speed: 500 } ] },
      // Night dressing (non-colliding): ceiling slab flush above ceilSpike1.
      { id: 'ceilDecor1', type: 'decor', variant: 'ceiling', x: 690, y: 320, w: 70, h: 30 },
      { id: 'crystal1', type: 'decor', variant: 'crystal', x: 275, y: 370, w: 20, h: 20 },
      { id: 'rocks1', type: 'decor', variant: 'rocks', x: 600, y: 370, w: 18, h: 20 }
    ]
  },

  // ================= LEVEL 19 =================
  // SOLUTION: FloorA[0,250], hop spike1(150-180). Crossing x250-270
  //   silently inverts your controls for 3.5s - NOTHING happens yet, you
  //   get ~0.7s of flat floorB[270,470] to notice steering feels wrong. At
  //   470 jump the 90px gap (steer with REVERSED input) onto floorC[560+].
  //   Hop spike_mid(580-610). Crusher1 springs at x650 (corridor 680-740,
  //   chained) - wait, dash (invert has likely worn off by now, ride is
  //   normal). Right after, an icicle falls toward x850 (~0.55s lead). A
  //   ceiling icicle also drops at x810 (chained) - hop both. An arrow
  //   fires with long lead - hop it, hop finalSpike(890-915), exit@925.
  {
    name: "The Corridor of Consequences",
    theme: 'night',
    deathMsgs: [
      "Consequences, indeed.",
      "Left is right. Right is wrong. You're dead.",
      "The corridor remembers."
    ],
    spawn: { x: 40, y: 440 },
    exit: { x: 925, y: 430 },
    objects: [
      { id: 'floorA', type: 'solid', x: 0, y: 480, w: 250, h: 60 },
      { id: 'spike1', type: 'hazard', variant: 'spikes', dir: 'up', x: 150, y: 460, w: 30, h: 20 },
      { type: 'trigger', x: 250, y: 380, w: 20, h: 100, once: true, delay: 0,
        actions: [ { do: 'invert', duration: 3.5 } ] },
      { id: 'floorB', type: 'solid', x: 270, y: 480, w: 200, h: 60 },
      { id: 'floorC', type: 'solid', x: 560, y: 480, w: 190, h: 60 },
      { id: 'spike_mid', type: 'hazard', variant: 'spikes', dir: 'up', x: 580, y: 460, w: 30, h: 20 },
      { id: 'crusher1', type: 'platform', x: 680, y: 80, w: 60, h: 40,
        path: [{ x: 680, y: 440 }], speed: 560, mode: 'pingpong', startOnTrigger: true, hidden: true },
      { type: 'trigger', x: 650, y: 380, w: 20, h: 100, once: true, delay: 0,
        actions: [ { do: 'reveal', target: 'crusher1' }, { do: 'start', target: 'crusher1' }, { do: 'shake' } ] },
      { id: 'floorD', type: 'solid', x: 750, y: 480, w: 210, h: 60 },
      { type: 'trigger', x: 730, y: 380, w: 15, h: 100, once: true, delay: 0.1,
        actions: [ { do: 'shoot', from: { x: 850, y: 250 }, dir: { x: 0, y: 1 }, speed: 460 }, { do: 'shake' } ] },
      { id: 'ceilSpike1', type: 'hazard', variant: 'ice', dir: 'down', x: 810, y: 440, w: 30, h: 20, hidden: true },
      { type: 'trigger', x: 760, y: 380, w: 20, h: 100, once: true, delay: 0.05,
        actions: [ { do: 'reveal', target: 'ceilSpike1' }, { do: 'move', target: 'ceilSpike1', to: { x: 810, y: 460 }, speed: 500 }, { do: 'shake' } ] },
      { type: 'trigger', x: 860, y: 380, w: 20, h: 100, once: true, delay: 0.2,
        actions: [ { do: 'shoot', from: { x: 960, y: 450 }, dir: { x: -1, y: 0 }, speed: 440 } ] },
      { id: 'finalSpike', type: 'hazard', variant: 'spikes', dir: 'up', x: 890, y: 460, w: 25, h: 20 },
      // Night dressing (non-colliding): ceiling slab flush above ceilSpike1.
      { id: 'ceilDecor1', type: 'decor', variant: 'ceiling', x: 790, y: 400, w: 70, h: 40 },
      { id: 'crystal1', type: 'decor', variant: 'crystal', x: 350, y: 450, w: 20, h: 30 },
      { id: 'rocks1', type: 'decor', variant: 'rocks', x: 755, y: 450, w: 20, h: 30 }
    ]
  },

  // ================= LEVEL 20 =================
  // SOLUTION: FloorA[0,200], hop spike1(150-180). Jump fake1's 80px gap
  //   (200-270, hides 0.25s after touch). Crusher1 springs at x330
  //   (corridor 360-420, chained) - wait, dash. Step up onto step1
  //   (480-630); a ceiling spike drops at x590 (chained) - hop it. On
  //   tier2B, decoy1(670) looks like the exit; touching it silently warps
  //   you back 30px + "Not it." Recovering from that, a ground spike pops
  //   at x750-775 (~0.26s lead) - hop it. Decoy2(780) pops an adjacent
  //   spike at x820 + "Nope." - back off/hop it. An arrow fires at x870
  //   (long lead) - hop it. Clearing it all reveals the REAL exit at x930.
  {
    name: "The Kitchen Sink",
    theme: 'night',
    deathMsgs: [
      "Everything but the kitchen sink. And that too.",
      "Two decoys, one sucker.",
      "This is what mastery costs."
    ],
    spawn: { x: 40, y: 440 },
    exit: { x: 930, y: 340, hidden: true },
    objects: [
      { id: 'floorA', type: 'solid', x: 0, y: 480, w: 200, h: 60 },
      { id: 'spike1', type: 'hazard', variant: 'spikes', dir: 'up', x: 150, y: 460, w: 30, h: 20 },
      { id: 'fake1', type: 'solid', x: 200, y: 480, w: 70, h: 60 },
      { type: 'trigger', x: 200, y: 440, w: 70, h: 40, once: true, delay: 0.25,
        actions: [ { do: 'hide', target: 'fake1' } ] },
      { id: 'floorB', type: 'solid', x: 270, y: 480, w: 210, h: 60 },
      { id: 'crusher1', type: 'platform', x: 360, y: 80, w: 60, h: 40,
        path: [{ x: 360, y: 440 }], speed: 560, mode: 'pingpong', startOnTrigger: true, hidden: true },
      { type: 'trigger', x: 330, y: 380, w: 20, h: 100, once: true, delay: 0,
        actions: [ { do: 'reveal', target: 'crusher1' }, { do: 'start', target: 'crusher1' }, { do: 'shake' } ] },
      { id: 'step1', type: 'solid', x: 480, y: 390, w: 150, h: 150 },
      { id: 'ceilSpike1', type: 'hazard', variant: 'spikes', dir: 'down', x: 590, y: 350, w: 30, h: 20, hidden: true },
      { type: 'trigger', x: 490, y: 290, w: 15, h: 110, once: true, delay: 0.05,
        actions: [ { do: 'reveal', target: 'ceilSpike1' }, { do: 'move', target: 'ceilSpike1', to: { x: 590, y: 370 }, speed: 600 }, { do: 'shake' } ] },
      { id: 'tier2B', type: 'solid', x: 630, y: 390, w: 330, h: 150 },
      { id: 'decoy1', type: 'decoy', x: 670, y: 340, w: 30, h: 50 },
      { type: 'trigger', x: 665, y: 335, w: 40, h: 60, once: true, delay: 0,
        actions: [ { do: 'warp', to: { x: 640, y: 350 } }, { do: 'msg', text: 'Not it.' }, { do: 'shake' } ] },
      { id: 'popSpike1', type: 'hazard', variant: 'spikes', dir: 'up', x: 750, y: 370, w: 25, h: 20, hidden: true },
      { type: 'trigger', x: 710, y: 290, w: 15, h: 110, once: true, delay: 0.2,
        actions: [ { do: 'reveal', target: 'popSpike1' }, { do: 'shake' } ] },
      { id: 'decoy2', type: 'decoy', x: 780, y: 340, w: 30, h: 50 },
      { id: 'decoySpike', type: 'hazard', variant: 'spikes', dir: 'up', x: 820, y: 370, w: 20, h: 20, hidden: true },
      { type: 'trigger', x: 775, y: 335, w: 40, h: 60, once: true, delay: 0,
        actions: [ { do: 'reveal', target: 'decoySpike' }, { do: 'msg', text: 'Nope.' }, { do: 'shake' } ] },
      { type: 'trigger', x: 870, y: 290, w: 20, h: 110, once: true, delay: 0.2,
        actions: [ { do: 'shoot', from: { x: 960, y: 365 }, dir: { x: -1, y: 0 }, speed: 440 } ] },
      { type: 'trigger', x: 910, y: 290, w: 20, h: 110, once: true, delay: 0,
        actions: [ { do: 'reveal', target: 'exit' } ] },
      // Night dressing (non-colliding); no hanging ice in this level.
      { id: 'stal1', type: 'decor', variant: 'stalagmite', x: 60, y: 450, w: 20, h: 30 },
      { id: 'crystal1', type: 'decor', variant: 'crystal', x: 280, y: 450, w: 20, h: 30 },
      { id: 'rocks1', type: 'decor', variant: 'rocks', x: 500, y: 370, w: 20, h: 20 }
    ]
  },

  // ================= LEVEL 21 =================
  // SOLUTION: Looks like a trivial victory jog - it isn't. FloorA[0,220];
  //   hop fakeA's 70px gap (silent hide). Hop fakeB's 50px gap (silent
  //   hide) too. Approaching x540 sends the visible exit(600) fleeing to
  //   x900 ("Not so fast."). The gap past floorC(610) is too wide (240px)
  //   to clear directly - crossing mid-air silently reveals finalBlock
  //   (650-800), splitting it into two trivial hops (610->650, 800->850).
  //   Running across finalBlock, two icicles rain down staggered at x690
  //   and x780 (0.33s apart) - keep moving, hop each as it lands. On
  //   floorE a ceiling spike drops at x875 (chained) - hop it. Right
  //   before the door, a SILENT trigger yanks you back to spawn ONCE
  //   ("Not so fast. Do it again.") - it only fires once, so the second
  //   pass through is clean: redo the (now-known) run to the real exit@900.
  {
    name: "Don't Get Comfortable",
    theme: 'plain',
    deathMsgs: [
      "Comfortable? Not anymore.",
      "The victory lap lied to your face.",
      "Almost. ALMOST."
    ],
    spawn: { x: 40, y: 440 },
    exit: { x: 540, y: 430 },
    objects: [
      { id: 'floorA', type: 'solid', x: 0, y: 480, w: 220, h: 60 },
      { id: 'fakeA', type: 'solid', x: 220, y: 480, w: 70, h: 60 },
      { type: 'trigger', x: 220, y: 440, w: 70, h: 40, once: true, delay: 0.25,
        actions: [ { do: 'hide', target: 'fakeA' } ] },
      { id: 'floorB', type: 'solid', x: 290, y: 480, w: 170, h: 60 },
      { id: 'fakeB', type: 'solid', x: 460, y: 480, w: 40, h: 60 },
      { type: 'trigger', x: 460, y: 440, w: 40, h: 40, once: true, delay: 0.2,
        actions: [ { do: 'hide', target: 'fakeB' } ] },
      { id: 'floorC', type: 'solid', x: 500, y: 480, w: 110, h: 60 },
      { type: 'trigger', x: 490, y: 380, w: 20, h: 100, once: true, delay: 0,
        actions: [ { do: 'msg', text: 'Not so fast.' }, { do: 'shake' }, { do: 'move', target: 'exit', to: { x: 930, y: 430 }, speed: 500 } ] },
      { id: 'finalBlock', type: 'solid', x: 650, y: 480, w: 150, h: 60, hidden: true },
      { type: 'trigger', x: 615, y: 380, w: 25, h: 100, once: true, delay: 0.2,
        actions: [ { do: 'reveal', target: 'finalBlock' }, { do: 'shake' } ] },
      { type: 'trigger', x: 660, y: 380, w: 15, h: 100, once: true, delay: 0.1,
        actions: [ { do: 'shoot', from: { x: 690, y: 250 }, dir: { x: 0, y: 1 }, speed: 460 }, { do: 'shake' } ] },
      { type: 'trigger', x: 750, y: 380, w: 15, h: 100, once: true, delay: 0.1,
        actions: [ { do: 'shoot', from: { x: 780, y: 250 }, dir: { x: 0, y: 1 }, speed: 460 }, { do: 'shake' } ] },
      { id: 'floorE', type: 'solid', x: 850, y: 480, w: 110, h: 60 },
      { id: 'ceilSpike1', type: 'hazard', variant: 'spikes', dir: 'down', x: 875, y: 440, w: 30, h: 20, hidden: true },
      { type: 'trigger', x: 790, y: 380, w: 15, h: 100, once: true, delay: 0.05,
        actions: [ { do: 'reveal', target: 'ceilSpike1' }, { do: 'move', target: 'ceilSpike1', to: { x: 875, y: 460 }, speed: 600 }, { do: 'shake' } ] },
      { type: 'trigger', x: 910, y: 380, w: 15, h: 100, once: true, delay: 0,
        actions: [ { do: 'warp', to: { x: 40, y: 440 } }, { do: 'msg', text: 'Not so fast. Do it again.' }, { do: 'shake' } ] },
      // Minimal plain dressing - the deceptive-calm look must survive intact.
      { id: 'rocks1', type: 'decor', variant: 'rocks', x: 60, y: 450, w: 20, h: 30 },
      { id: 'rocks2', type: 'decor', variant: 'rocks', x: 300, y: 450, w: 20, h: 30 },
      // Reverse-troll bonus spring: framed as scary, actually 100% safe - sits
      // on floorA well clear of fakeA (220+). Never required, never touched by
      // the certified route.
      { id: 'bonusSpring1', type: 'spring', x: 120, y: 468, w: 40, h: 12 },
      { type: 'trigger', x: 110, y: 50, w: 60, h: 150, once: true, delay: 0,
        actions: [ { do: 'msg', text: 'Trust it. For once.' } ] }
    ]
  },

  // ================= LEVEL 22 =================
  // SOLUTION (every mechanic, chained, <45s once known): FloorA[0,120]; a
  //   spike pops at x90 (chained lead-in) - hop it. Jump fake1's 70px gap
  //   (silent hide). Crusher1 springs at x235 (corridor 260-320, chained)
  //   - wait, dash. Step up onto step1(360-490); an arrow fires at x370
  //   (chained) - hop it. Board plat1 at x510 (20px gap) and ride; two
  //   icicles rain down at x550 (0.7s after boarding - visible while you
  //   ride, hop or drift off its column) and x650 (chained) - dodge both. Mid-ride it vanishes
  //   AND reveals safe1(650-730) in the same instant - jump the remainder.
  //   A ceiling icicle drops at x760 (chained) - hop it. The decoy at x800
  //   looks exactly like the exit; touching it silently warps you back to
  //   x650 + "So close." Walk past the (now-inert) decoy - the real exit
  //   reveals AND flees once more to x930 ("Not quite.") - walk in, done.
  {
    name: "The Gauntlet",
    theme: 'night',
    deathMsgs: [
      "The greatest hits, remixed to kill you.",
      "You made it 21 levels for THIS?",
      "This is the last one. Don't blow it."
    ],
    spawn: { x: 40, y: 440 },
    exit: { x: 880, y: 340, hidden: true },
    objects: [
      { id: 'floorA', type: 'solid', x: 0, y: 480, w: 120, h: 60 },
      { id: 'popupSpike', type: 'hazard', variant: 'spikes', dir: 'up', x: 90, y: 460, w: 30, h: 20, hidden: true },
      { type: 'trigger', x: 10, y: 380, w: 15, h: 100, once: true, delay: 0.2,
        actions: [ { do: 'reveal', target: 'popupSpike' }, { do: 'shake' } ] },
      { id: 'fake1', type: 'solid', x: 120, y: 480, w: 70, h: 60 },
      { type: 'trigger', x: 120, y: 440, w: 70, h: 40, once: true, delay: 0.25,
        actions: [ { do: 'hide', target: 'fake1' } ] },
      { id: 'floorB', type: 'solid', x: 190, y: 480, w: 170, h: 60 },
      { id: 'crusher1', type: 'platform', x: 260, y: 80, w: 60, h: 40,
        path: [{ x: 260, y: 440 }], speed: 560, mode: 'pingpong', startOnTrigger: true, hidden: true },
      { type: 'trigger', x: 235, y: 380, w: 20, h: 100, once: true, delay: 0,
        actions: [ { do: 'reveal', target: 'crusher1' }, { do: 'start', target: 'crusher1' }, { do: 'shake' } ] },
      { id: 'step1', type: 'solid', x: 360, y: 390, w: 130, h: 150 },
      { type: 'trigger', x: 370, y: 290, w: 30, h: 110, once: true, delay: 0.2,
        actions: [ { do: 'shoot', from: { x: 960, y: 365 }, dir: { x: -1, y: 0 }, speed: 430 } ] },
      { id: 'plat1', type: 'platform', x: 510, y: 390, w: 80, h: 20,
        path: [{ x: 600, y: 390 }], speed: 160, mode: 'pingpong' },
      { type: 'trigger', x: 520, y: 290, w: 15, h: 110, once: true, delay: 0.7,
        actions: [ { do: 'shoot', from: { x: 550, y: 250 }, dir: { x: 0, y: 1 }, speed: 460 }, { do: 'shake' } ] },
      { type: 'trigger', x: 620, y: 290, w: 15, h: 110, once: true, delay: 0.1,
        actions: [ { do: 'shoot', from: { x: 660, y: 250 }, dir: { x: 0, y: 1 }, speed: 460 }, { do: 'shake' } ] },
      { id: 'safe1', type: 'solid', x: 650, y: 390, w: 80, h: 150, hidden: true },
      { type: 'trigger', x: 590, y: 290, w: 40, h: 110, once: true, delay: 0,
        actions: [ { do: 'hide', target: 'plat1' }, { do: 'reveal', target: 'safe1' } ] },
      { id: 'tier2C', type: 'solid', x: 730, y: 390, w: 230, h: 150 },
      { id: 'ceilSpike1', type: 'hazard', variant: 'ice', dir: 'down', x: 760, y: 350, w: 30, h: 20, hidden: true },
      { type: 'trigger', x: 680, y: 290, w: 20, h: 110, once: true, delay: 0.05,
        actions: [ { do: 'reveal', target: 'ceilSpike1' }, { do: 'move', target: 'ceilSpike1', to: { x: 760, y: 370 }, speed: 500 }, { do: 'shake' } ] },
      { id: 'decoy1', type: 'decoy', x: 800, y: 340, w: 30, h: 50 },
      { type: 'trigger', x: 795, y: 335, w: 40, h: 60, once: true, delay: 0,
        actions: [ { do: 'warp', to: { x: 650, y: 350 } }, { do: 'msg', text: 'So close.' }, { do: 'shake' } ] },
      { type: 'trigger', x: 850, y: 290, w: 15, h: 110, once: true, delay: 0,
        actions: [ { do: 'reveal', target: 'exit' }, { do: 'move', target: 'exit', to: { x: 930, y: 340 }, speed: 500 }, { do: 'msg', text: 'Not quite.' }, { do: 'shake' } ] },
      // GEOMETRY FROZEN above (L22 QA-certified) - additions below are
      // non-colliding decor only, cannot affect any jump/trigger/trap.
      { id: 'ceilDecor1', type: 'decor', variant: 'ceiling', x: 740, y: 320, w: 55, h: 30 },
      { id: 'crystal1', type: 'decor', variant: 'crystal', x: 430, y: 370, w: 20, h: 20 },
      { id: 'rocks1', type: 'decor', variant: 'rocks', x: 845, y: 370, w: 15, h: 20 }
    ]
  }

];
