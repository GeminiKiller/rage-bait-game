// js/levels_c.js — Levels 23-30 (chapter 5 finish: icecave conveyor/ice
// debut; chapter 6: night darkness/portal debut). Plain script, no modules.
// Defines window.LEVELS_C per SPEC.md v3 level format.
//
// New-mechanic notes used throughout this file:
//   - conveyor: solid top surface adds dir*speed to player x EACH FRAME
//     while grounded on it (stacks with input). Effect is local to standing
//     on the tile - leaving it (jump, walk off) stops the addition
//     immediately. Forward belts can push effective speed up to ~450px/s
//     (300 input + 150 belt); backward "fight" belts cut net speed to
//     ~150px/s (300 input - 150 belt) - reveal-to-hazard leads are sized
//     for the FASTER case (worst-case reaction time) wherever a boosted
//     belt is involved, and get a natural bonus of extra reaction time on
//     backward "fight" belts.
//   - ice (solid.surface:'ice'): while holding a direction, easing reaches
//     full 300px/s quickly (no practical slowdown vs normal floor); the
//     betrayal only fires when input is RELEASED - coasts ~120px before
//     fully stopping. Design implication: never require a stop-precisely
//     move on ice; either keep holding through a hop, or release EARLY
//     (120px+ of buffer) before any edge/hazard.
//   - Jump metrics (per SPEC.md): step-up <=100px, flat gap <=170px,
//     platform/hop <=150px. Checked in each SOLUTION comment.
//   - Geometry conventions: ground floors y=480 h=60 (top surface y=480);
//     standing player top-left y=440; exit door 30w x 50h sits flush
//     (door y = floor-top - 50).

window.LEVELS_C = [

  // ================= LEVEL 23 =================
  // SOLUTION: floorA[0,220], hop visible spike0(80-110). Board conv1
  //   (forward belt, 220-380) - it pushes you toward a pit(380-480,100px
  //   gap<=170) even if you stand still; just keep walking/hop the gap
  //   like normal, don't dawdle on the belt. Land on floorB[480,660], hop
  //   spike1(560-590). Board conv2 (backward belt, 660-860, dir=-1) -
  //   HOLD right the whole crossing (net ~160px/s, still forward); near
  //   its far end a hidden popSpike1(820-850) pops with ~50-70px/~0.3-0.4s
  //   lead (backward belt slows your approach, generous reaction) - hop
  //   it. FloorC[860,960], exit@920.
  {
    name: "The Belt Has Opinions",
    theme: 'icecave',
    deathMsgs: [
      "Standing still was the mistake.",
      "The belt had other plans.",
      "You fought the belt. The belt won."
    ],
    spawn: { x: 40, y: 440 },
    exit: { x: 920, y: 430 },
    objects: [
      { id: 'floorA', type: 'solid', x: 0, y: 480, w: 220, h: 60 },
      { id: 'spike0', type: 'hazard', variant: 'spikes', dir: 'up', x: 80, y: 460, w: 30, h: 20 },
      { id: 'conv1', type: 'conveyor', x: 220, y: 480, w: 160, h: 60, dir: 1, speed: 140 },
      // pit 380-480 (100px, <=170 flat gap) - jump it, don't idle on conv1
      { id: 'floorB', type: 'solid', x: 480, y: 480, w: 180, h: 60 },
      { id: 'spike1', type: 'hazard', variant: 'spikes', dir: 'up', x: 560, y: 460, w: 30, h: 20 },
      { id: 'conv2', type: 'conveyor', x: 660, y: 480, w: 200, h: 60, dir: -1, speed: 140 },
      { id: 'popSpike1', type: 'hazard', variant: 'spikes', dir: 'up', x: 820, y: 460, w: 30, h: 20, hidden: true },
      { type: 'trigger', x: 750, y: 380, w: 20, h: 100, once: true, delay: 0,
        actions: [ { do: 'reveal', target: 'popSpike1' }, { do: 'shake' } ] },
      { id: 'floorC', type: 'solid', x: 860, y: 480, w: 100, h: 60 },
      // icecave dressing (non-colliding)
      { id: 'rocks1', type: 'decor', variant: 'rocks', x: 60, y: 450, w: 20, h: 30 },
      { id: 'stalagmite1', type: 'decor', variant: 'stalagmite', x: 620, y: 450, w: 20, h: 30 },
      { id: 'crystal1', type: 'decor', variant: 'crystal', x: 890, y: 450, w: 20, h: 30 }
    ]
  },

  // ================= LEVEL 24 =================
  // SOLUTION: floorA[0,160], hop spike0(90-120). Run onto iceA[160,380] -
  //   DON'T brake at the far edge like a normal floor; ice coasts ~120px,
  //   so just keep holding right into the pit(380-500,120px<=170) jump.
  //   Land on iceB[500,760]: a hidden falling icicle pops at x590 (~40-
  //   60px/~0.3-0.35s lead incl. delay) - hop it; a hidden iceSpike1 pops
  //   at x710 (~90-110px/~0.3-0.37s lead) - hop it too (don't release
  //   input near it - sliding would carry you right into it). Board conv1
  //   (760-840, forward, boosts you) straight onto iceC[840,960]: the
  //   combo means a hidden comboSpike1 at x890 arrives sooner than plain
  //   ice would suggest - trigger at conv1's start gives ~0.33s total
  //   lead across both surfaces. Hop it, exit@925.
  {
    name: "Friction Is a Lie",
    theme: 'icecave',
    deathMsgs: [
      "Ice doesn't do 'stop'.",
      "The belt gave you a running start. Into a spike.",
      "You slid right into that one."
    ],
    spawn: { x: 40, y: 440 },
    exit: { x: 925, y: 430 },
    objects: [
      { id: 'floorA', type: 'solid', x: 0, y: 480, w: 160, h: 60 },
      { id: 'spike0', type: 'hazard', variant: 'spikes', dir: 'up', x: 90, y: 460, w: 30, h: 20 },
      { id: 'iceA', type: 'solid', x: 160, y: 480, w: 220, h: 60, surface: 'ice' },
      // pit 380-500 (120px, <=170) - ice run-up betrayal: don't try to
      // brake at the edge, just keep going and jump it like any gap
      { id: 'iceB', type: 'solid', x: 500, y: 480, w: 260, h: 60, surface: 'ice' },
      { id: 'fallIcicle1', type: 'hazard', variant: 'ice', dir: 'down', x: 590, y: 440, w: 30, h: 20, hidden: true },
      { id: 'ceilDecor1', type: 'decor', variant: 'ceiling', x: 580, y: 420, w: 50, h: 20 },
      { type: 'trigger', x: 530, y: 380, w: 20, h: 100, once: true, delay: 0.15,
        actions: [ { do: 'reveal', target: 'fallIcicle1' }, { do: 'move', target: 'fallIcicle1', to: { x: 590, y: 460 }, speed: 600 }, { do: 'shake' } ] },
      { id: 'iceSpike1', type: 'hazard', variant: 'spikes', dir: 'up', x: 710, y: 460, w: 30, h: 20, hidden: true },
      { type: 'trigger', x: 600, y: 380, w: 20, h: 100, once: true, delay: 0,
        actions: [ { do: 'reveal', target: 'iceSpike1' }, { do: 'shake' } ] },
      { id: 'conv1', type: 'conveyor', x: 760, y: 480, w: 80, h: 60, dir: 1, speed: 140 },
      { id: 'iceC', type: 'solid', x: 840, y: 480, w: 120, h: 60, surface: 'ice' },
      { id: 'comboSpike1', type: 'hazard', variant: 'spikes', dir: 'up', x: 890, y: 460, w: 30, h: 20, hidden: true },
      { type: 'trigger', x: 770, y: 380, w: 20, h: 100, once: true, delay: 0,
        actions: [ { do: 'reveal', target: 'comboSpike1' }, { do: 'shake' } ] },
      // icecave dressing (non-colliding)
      { id: 'rocks1', type: 'decor', variant: 'rocks', x: 60, y: 450, w: 20, h: 30 },
      { id: 'crystal1', type: 'decor', variant: 'crystal', x: 780, y: 450, w: 20, h: 20 },
      { id: 'stalagmite1', type: 'decor', variant: 'stalagmite', x: 815, y: 450, w: 15, h: 25 }
    ]
  },

  // ================= LEVEL 25 =================
  // SOLUTION (chapter 5 climax): floorA[0,140], hop spike0(80-110). Board
  //   conv1 (forward, 140-320) - a hidden popSpike1 pops at x280 (~140px/
  //   ~0.3s lead even at boosted ~450px/s) - hop it. FloorB breather
  //   [320,400]. Board conv2 (backward "fight", 400-600, dir=-1, HOLD
  //   right, net ~150px/s) - a hidden ceiling icicle drops at x520 (huge
  //   ~0.65s lead thanks to the slow fight-speed) - hop it. FakeC[600,670]
  //   LOOKS like solid ground between belts but hides 0.25s after you step
  //   on - cross it at a run (~0.23s), don't linger. FloorD[670,750] warns
  //   of two icicles ahead (triggers at x680/x710, well before conv3
  //   starts) - board conv3 (forward, "belt over the pit", 750-920): the
  //   first icicle lands at x790 (~0.39s total lead), the second at x880
  //   (~0.47s total lead) - hop both while the belt keeps pushing you
  //   forward regardless. FloorE[920,960], exit@925.
  {
    name: "The Assembly Line",
    theme: 'icecave',
    deathMsgs: [
      "The line doesn't stop for you.",
      "Two belts, one grave.",
      "The floor was a belt in disguise."
    ],
    spawn: { x: 40, y: 440 },
    exit: { x: 925, y: 430 },
    objects: [
      { id: 'floorA', type: 'solid', x: 0, y: 480, w: 140, h: 60 },
      { id: 'spike0', type: 'hazard', variant: 'spikes', dir: 'up', x: 80, y: 460, w: 30, h: 20 },
      { id: 'conv1', type: 'conveyor', x: 140, y: 480, w: 180, h: 60, dir: 1, speed: 150 },
      { id: 'popSpike1', type: 'hazard', variant: 'spikes', dir: 'up', x: 280, y: 460, w: 30, h: 20, hidden: true },
      { type: 'trigger', x: 140, y: 380, w: 20, h: 100, once: true, delay: 0,
        actions: [ { do: 'reveal', target: 'popSpike1' }, { do: 'shake' } ] },
      { id: 'floorB', type: 'solid', x: 320, y: 480, w: 80, h: 60 },
      { id: 'conv2', type: 'conveyor', x: 400, y: 480, w: 200, h: 60, dir: -1, speed: 150 },
      { id: 'fallIcicle2', type: 'hazard', variant: 'ice', dir: 'down', x: 520, y: 440, w: 30, h: 20, hidden: true },
      { id: 'ceilDecor2', type: 'decor', variant: 'ceiling', x: 505, y: 420, w: 60, h: 20 },
      { type: 'trigger', x: 420, y: 380, w: 20, h: 100, once: true, delay: 0.1,
        actions: [ { do: 'reveal', target: 'fallIcicle2' }, { do: 'move', target: 'fallIcicle2', to: { x: 520, y: 460 }, speed: 600 }, { do: 'shake' } ] },
      { id: 'fakeC', type: 'solid', x: 600, y: 480, w: 70, h: 60 },
      { type: 'trigger', x: 600, y: 440, w: 70, h: 40, once: true, delay: 0.25,
        actions: [ { do: 'hide', target: 'fakeC' } ] },
      { id: 'floorD', type: 'solid', x: 670, y: 480, w: 80, h: 60 },
      { id: 'icicleA', type: 'hazard', variant: 'ice', dir: 'down', x: 790, y: 440, w: 30, h: 20, hidden: true },
      { id: 'ceilDecorA', type: 'decor', variant: 'ceiling', x: 775, y: 420, w: 60, h: 20 },
      { type: 'trigger', x: 680, y: 380, w: 20, h: 100, once: true, delay: 0.05,
        actions: [ { do: 'reveal', target: 'icicleA' }, { do: 'move', target: 'icicleA', to: { x: 790, y: 460 }, speed: 600 }, { do: 'shake' } ] },
      { id: 'icicleB', type: 'hazard', variant: 'ice', dir: 'down', x: 880, y: 440, w: 30, h: 20, hidden: true },
      { id: 'ceilDecorB', type: 'decor', variant: 'ceiling', x: 860, y: 420, w: 55, h: 20 },
      { type: 'trigger', x: 710, y: 380, w: 20, h: 100, once: true, delay: 0.05,
        actions: [ { do: 'reveal', target: 'icicleB' }, { do: 'move', target: 'icicleB', to: { x: 880, y: 460 }, speed: 600 }, { do: 'shake' } ] },
      { id: 'conv3', type: 'conveyor', x: 750, y: 480, w: 170, h: 60, dir: 1, speed: 150 },
      { id: 'floorE', type: 'solid', x: 920, y: 480, w: 40, h: 60 },
      // icecave dressing (non-colliding)
      { id: 'rocksL', type: 'decor', variant: 'rocks', x: 40, y: 450, w: 20, h: 30 }
    ]
  },

  // ================= LEVEL 26 =================
  // SOLUTION (portals intro, normal light): floorA[0,200], hop spike0
  //   (80-110). Pit1(200-420,220px) is deliberately too wide to jump -
  //   step into p1(170) instead, it drops you safely at p2(430) on
  //   floorB. Continue: a hidden falling icicle pops at x520 (~0.27-0.37s
  //   lead) - hop it. FloorB ends at 640; pit2(640-820,180px) is again
  //   too wide - step into p3(600, oneWay) to cross. It dumps you at p4
  //   on floorC RIGHT NEXT to a hidden ambushSpike(895) that pops the
  //   instant you land (~0.2-0.33s lead, 46px clearance from the portal) -
  //   hop it, exit@925.
  {
    name: "Step Right In",
    theme: 'night',
    deathMsgs: [
      "Wrong portal.",
      "Teleported straight into a spike.",
      "The pit was faster than you thought."
    ],
    spawn: { x: 40, y: 440 },
    exit: { x: 925, y: 430 },
    objects: [
      { id: 'floorA', type: 'solid', x: 0, y: 480, w: 200, h: 60 },
      { id: 'spike0', type: 'hazard', variant: 'spikes', dir: 'up', x: 80, y: 460, w: 30, h: 20 },
      { id: 'p1', type: 'portal', x: 170, y: 432, w: 24, h: 48, to: 'p2' },
      // pit1 200-420 (220px, unjumpable) - the portal is the only way across
      { id: 'floorB', type: 'solid', x: 420, y: 480, w: 220, h: 60 },
      { id: 'p2', type: 'portal', x: 430, y: 432, w: 24, h: 48, to: 'p1' },
      { id: 'fallIcicle3', type: 'hazard', variant: 'ice', dir: 'down', x: 520, y: 440, w: 30, h: 20, hidden: true },
      { id: 'ceilDecor3', type: 'decor', variant: 'ceiling', x: 505, y: 420, w: 60, h: 20 },
      { type: 'trigger', x: 460, y: 380, w: 20, h: 100, once: true, delay: 0.1,
        actions: [ { do: 'reveal', target: 'fallIcicle3' }, { do: 'move', target: 'fallIcicle3', to: { x: 520, y: 460 }, speed: 600 }, { do: 'shake' } ] },
      { id: 'p3', type: 'portal', x: 600, y: 432, w: 24, h: 48, to: 'p4', oneWay: true },
      // pit2 640-820 (180px, unjumpable) - p3 is the only way across
      { id: 'floorC', type: 'solid', x: 820, y: 480, w: 140, h: 60 },
      { id: 'p4', type: 'portal', x: 825, y: 432, w: 24, h: 48, to: 'p3' },
      { id: 'ambushSpike', type: 'hazard', variant: 'spikes', dir: 'up', x: 895, y: 460, w: 25, h: 20, hidden: true },
      { type: 'trigger', x: 825, y: 380, w: 40, h: 100, once: true, delay: 0.1,
        actions: [ { do: 'reveal', target: 'ambushSpike' }, { do: 'shake' } ] },
      // night dressing (non-colliding)
      { id: 'rocks1', type: 'decor', variant: 'rocks', x: 60, y: 450, w: 20, h: 30 },
      { id: 'crystal1', type: 'decor', variant: 'crystal', x: 870, y: 450, w: 20, h: 20 }
    ]
  },

  // ================= LEVEL 27 =================
  // SOLUTION (darkness debut, radius 170 - generous): floorA[0,260]; a
  //   ground spike at x160 sits just past the light's edge from spawn -
  //   hop it once you see it. Jump gap1(260-380,120px). FloorB[380,560]:
  //   spike2(460) same fog-reveal deal; a hidden icicle also drops at
  //   x500 (~0.37s lead) - hop both. Jump gap2(560-680,120px) - mid-air a
  //   hidden ground spike reveals at x700 (~0.23s lead, land and hop it
  //   immediately). FloorC[680,960]: spike3(820) fog-reveals same as
  //   before, exit@900. Nothing here needs memorizing beyond "the dark
  //   doesn't mean empty" - everything is a normal hazard once lit.
  {
    name: "What You Can't See",
    theme: 'night',
    darkness: 170,
    deathMsgs: [
      "It was right there. You just couldn't see it.",
      "The dark doesn't apologize.",
      "You should've remembered that one."
    ],
    spawn: { x: 40, y: 440 },
    exit: { x: 900, y: 430 },
    objects: [
      { id: 'floorA', type: 'solid', x: 0, y: 480, w: 260, h: 60 },
      { id: 'spike1', type: 'hazard', variant: 'spikes', dir: 'up', x: 160, y: 460, w: 30, h: 20 },
      // gap1 260-380 (120px)
      { id: 'floorB', type: 'solid', x: 380, y: 480, w: 180, h: 60 },
      { id: 'spike2', type: 'hazard', variant: 'spikes', dir: 'up', x: 460, y: 460, w: 30, h: 20 },
      { id: 'fallIcicle4', type: 'hazard', variant: 'ice', dir: 'down', x: 500, y: 440, w: 30, h: 20, hidden: true },
      { id: 'ceilDecor4', type: 'decor', variant: 'ceiling', x: 485, y: 420, w: 60, h: 20 },
      { type: 'trigger', x: 420, y: 380, w: 20, h: 100, once: true, delay: 0.1,
        actions: [ { do: 'reveal', target: 'fallIcicle4' }, { do: 'move', target: 'fallIcicle4', to: { x: 500, y: 460 }, speed: 600 }, { do: 'shake' } ] },
      // gap2 560-680 (120px) - trigger sits over the airspace, mid-jump
      { type: 'trigger', x: 630, y: 380, w: 20, h: 100, once: true, delay: 0,
        actions: [ { do: 'reveal', target: 'hiddenSpike1' }, { do: 'shake' } ] },
      { id: 'floorC', type: 'solid', x: 680, y: 480, w: 280, h: 60 },
      { id: 'hiddenSpike1', type: 'hazard', variant: 'spikes', dir: 'up', x: 700, y: 460, w: 30, h: 20, hidden: true },
      { id: 'spike3', type: 'hazard', variant: 'spikes', dir: 'up', x: 820, y: 460, w: 30, h: 20 },
      // night dressing (non-colliding)
      { id: 'rocks1', type: 'decor', variant: 'rocks', x: 380, y: 450, w: 20, h: 30 },
      { id: 'crystal1', type: 'decor', variant: 'crystal', x: 870, y: 450, w: 20, h: 20 }
    ]
  },

  // ================= LEVEL 28 =================
  // SOLUTION (portal decoy troll): floorA[0,260], pHome(90) sits inert
  //   near spawn - ignore it. Hop spike0(150). Jump gap1(260-380,120px) -
  //   mid-air a hidden spike reveals at x420 (~0.3s lead) - hop it.
  //   FloorB[380,640]: a hidden icicle drops at x490 (~0.2-0.27s lead) -
  //   hop it. Two portals sit close together: pTroll(540) dumps you back
  //   at pHome (spawn area, harmless but wastes your run - AVOID once you
  //   know); pGood(600) is the real way across pit2(640-830,190px,
  //   unjumpable). Land at pDest(835) on floorC - a hidden spike pops at
  //   x900 (~0.2-0.3s lead, 41px clear of the portal) - hop it, exit@930.
  {
    name: "Wrong Door",
    theme: 'night',
    deathMsgs: [
      "Wrong door. Er, portal.",
      "Back to start. Enjoy the walk.",
      "That portal had a sense of humor."
    ],
    spawn: { x: 40, y: 440 },
    exit: { x: 930, y: 430 },
    objects: [
      { id: 'floorA', type: 'solid', x: 0, y: 480, w: 260, h: 60 },
      { id: 'pHome', type: 'portal', x: 90, y: 432, w: 24, h: 48, to: 'pTroll' },
      { id: 'spike0', type: 'hazard', variant: 'spikes', dir: 'up', x: 150, y: 460, w: 30, h: 20 },
      // gap1 260-380 (120px) - trigger over the airspace
      { type: 'trigger', x: 330, y: 380, w: 20, h: 100, once: true, delay: 0,
        actions: [ { do: 'reveal', target: 'hiddenSpike2' }, { do: 'shake' } ] },
      { id: 'floorB', type: 'solid', x: 380, y: 480, w: 260, h: 60 },
      { id: 'hiddenSpike2', type: 'hazard', variant: 'spikes', dir: 'up', x: 420, y: 460, w: 30, h: 20, hidden: true },
      { type: 'trigger', x: 440, y: 380, w: 20, h: 100, once: true, delay: 0.1,
        actions: [ { do: 'reveal', target: 'fallIcicle5' }, { do: 'move', target: 'fallIcicle5', to: { x: 490, y: 460 }, speed: 600 }, { do: 'shake' } ] },
      { id: 'fallIcicle5', type: 'hazard', variant: 'ice', dir: 'down', x: 490, y: 440, w: 30, h: 20, hidden: true },
      { id: 'ceilDecor5', type: 'decor', variant: 'ceiling', x: 475, y: 420, w: 60, h: 20 },
      { id: 'pTroll', type: 'portal', x: 540, y: 432, w: 24, h: 48, to: 'pHome', oneWay: true },
      { id: 'pGood', type: 'portal', x: 600, y: 432, w: 24, h: 48, to: 'pDest', oneWay: true },
      // pit2 640-830 (190px, unjumpable) - pGood is the only forward path
      { id: 'floorC', type: 'solid', x: 830, y: 480, w: 130, h: 60 },
      { id: 'pDest', type: 'portal', x: 835, y: 432, w: 24, h: 48, to: 'pGood' },
      { type: 'trigger', x: 835, y: 380, w: 30, h: 100, once: true, delay: 0.1,
        actions: [ { do: 'reveal', target: 'hiddenSpike3' }, { do: 'shake' } ] },
      { id: 'hiddenSpike3', type: 'hazard', variant: 'spikes', dir: 'up', x: 900, y: 460, w: 25, h: 20, hidden: true },
      // night dressing (non-colliding)
      { id: 'rocks1', type: 'decor', variant: 'rocks', x: 200, y: 450, w: 20, h: 30 },
      { id: 'crystal1', type: 'decor', variant: 'crystal', x: 610, y: 450, w: 15, h: 20 }
    ]
  },

  // ================= LEVEL 29 =================
  // SOLUTION (darkness 140 + conveyor callback): floorA[0,200], hop
  //   spike0(120, fog-reveals on approach). Jump gap1(200-320,120px).
  //   Board conv1(320-500, forward) - it pushes you on regardless of
  //   input; a spike waits at its far edge (460), fogged until ~140px out
  //   - hop it. FloorC[500,700]: a rumbling icicle (shake cue) drops at
  //   x600 (~0.42s lead) - hop it; a hidden spike pops at x660 (~0.23s
  //   lead) - hop it. Jump gap2(700-820,120px). FloorD[820,960]: spike_end
  //   (870) fog-reveals same as always, exit@910.
  {
    name: "Heard, Not Seen",
    theme: 'night',
    darkness: 140,
    deathMsgs: [
      "Heard it. Didn't see it. Dead anyway.",
      "The belt in the dark doesn't care about your eyes.",
      "Some things you just have to remember."
    ],
    spawn: { x: 40, y: 440 },
    exit: { x: 910, y: 430 },
    objects: [
      { id: 'floorA', type: 'solid', x: 0, y: 480, w: 200, h: 60 },
      { id: 'spike0', type: 'hazard', variant: 'spikes', dir: 'up', x: 120, y: 460, w: 30, h: 20 },
      // gap1 200-320 (120px)
      { id: 'conv1', type: 'conveyor', x: 320, y: 480, w: 180, h: 60, dir: 1, speed: 140 },
      { id: 'spikeConv', type: 'hazard', variant: 'spikes', dir: 'up', x: 460, y: 460, w: 30, h: 20 },
      { id: 'floorC', type: 'solid', x: 500, y: 480, w: 200, h: 60 },
      { id: 'fallIcicle6', type: 'hazard', variant: 'ice', dir: 'down', x: 600, y: 440, w: 30, h: 20, hidden: true },
      { id: 'ceilDecor6', type: 'decor', variant: 'ceiling', x: 585, y: 420, w: 60, h: 20 },
      { type: 'trigger', x: 520, y: 380, w: 20, h: 100, once: true, delay: 0.15,
        actions: [ { do: 'reveal', target: 'fallIcicle6' }, { do: 'move', target: 'fallIcicle6', to: { x: 600, y: 460 }, speed: 600 }, { do: 'shake' } ] },
      { id: 'hiddenSpike4', type: 'hazard', variant: 'spikes', dir: 'up', x: 660, y: 460, w: 30, h: 20, hidden: true },
      { type: 'trigger', x: 590, y: 380, w: 20, h: 100, once: true, delay: 0,
        actions: [ { do: 'reveal', target: 'hiddenSpike4' }, { do: 'shake' } ] },
      // gap2 700-820 (120px)
      { id: 'floorD', type: 'solid', x: 820, y: 480, w: 140, h: 60 },
      { id: 'spikeEnd', type: 'hazard', variant: 'spikes', dir: 'up', x: 870, y: 460, w: 30, h: 20 },
      // night dressing (non-colliding)
      { id: 'rocks1', type: 'decor', variant: 'rocks', x: 60, y: 450, w: 20, h: 30 },
      { id: 'crystal1', type: 'decor', variant: 'crystal', x: 930, y: 450, w: 15, h: 20 }
    ]
  },

  // ================= LEVEL 30 =================
  // SOLUTION (chapter 6 climax - darkness 120 + portal chain): floorA
  //   [0,160], hop spike0(90). Pit1(160-360,220px unjumpable) - step into
  //   p1(130) to land at p2(370) on floorB. A rumbling icicle drops at
  //   x460 (~0.35s lead) - hop it. Pit2(570-750,180px unjumpable) - step
  //   into p3(540,oneWay) to land at p4(760) on floorC. A hidden spike
  //   pops at x830 (~0.23-0.33s lead) - hop it. Just after, a hidden
  //   spike at x900 is revealed WHILE lit (~0.17-0.23s lead) - THEN the
  //   lights drop to radius 90 right after ("the lights dim") for the
  //   final few steps - you already saw it, now just execute the hop
  //   blind, exit@930.
  {
    name: "The Lights Dim",
    theme: 'night',
    darkness: 120,
    deathMsgs: [
      "The lights dim. Your luck doesn't improve.",
      "Chained portals, chained deaths.",
      "You knew it was there. The dark didn't care."
    ],
    spawn: { x: 40, y: 440 },
    exit: { x: 930, y: 430 },
    objects: [
      { id: 'floorA', type: 'solid', x: 0, y: 480, w: 160, h: 60 },
      { id: 'spike0', type: 'hazard', variant: 'spikes', dir: 'up', x: 90, y: 460, w: 30, h: 20 },
      { id: 'p1', type: 'portal', x: 130, y: 432, w: 24, h: 48, to: 'p2' },
      // pit1 160-360 (200px, unjumpable) - p1 is the only way across
      { id: 'floorB', type: 'solid', x: 360, y: 480, w: 210, h: 60 },
      { id: 'p2', type: 'portal', x: 370, y: 432, w: 24, h: 48, to: 'p1' },
      { id: 'fallIcicle7', type: 'hazard', variant: 'ice', dir: 'down', x: 460, y: 440, w: 30, h: 20, hidden: true },
      { id: 'ceilDecor7', type: 'decor', variant: 'ceiling', x: 445, y: 420, w: 60, h: 20 },
      { type: 'trigger', x: 400, y: 380, w: 20, h: 100, once: true, delay: 0.15,
        actions: [ { do: 'reveal', target: 'fallIcicle7' }, { do: 'move', target: 'fallIcicle7', to: { x: 460, y: 460 }, speed: 600 }, { do: 'shake' } ] },
      { id: 'p3', type: 'portal', x: 540, y: 432, w: 24, h: 48, to: 'p4', oneWay: true },
      // pit2 570-750 (180px, unjumpable) - p3 is the only way across
      { id: 'floorC', type: 'solid', x: 750, y: 480, w: 210, h: 60 },
      { id: 'p4', type: 'portal', x: 760, y: 432, w: 24, h: 48, to: 'p3' },
      { id: 'hiddenSpike5', type: 'hazard', variant: 'spikes', dir: 'up', x: 830, y: 460, w: 30, h: 20, hidden: true },
      { type: 'trigger', x: 760, y: 380, w: 30, h: 100, once: true, delay: 0.1,
        actions: [ { do: 'reveal', target: 'hiddenSpike5' }, { do: 'shake' } ] },
      { id: 'hiddenSpike6', type: 'hazard', variant: 'spikes', dir: 'up', x: 900, y: 460, w: 20, h: 20, hidden: true },
      { type: 'trigger', x: 860, y: 380, w: 20, h: 100, once: true, delay: 0.1,
        actions: [ { do: 'reveal', target: 'hiddenSpike6' }, { do: 'shake' } ] },
      { type: 'trigger', x: 880, y: 380, w: 20, h: 100, once: true, delay: 0,
        actions: [ { do: 'dark', radius: 90 }, { do: 'msg', text: 'The lights dim.' } ] },
      // night dressing (non-colliding)
      { id: 'rocks1', type: 'decor', variant: 'rocks', x: 60, y: 450, w: 20, h: 30 },
      { id: 'crystal1', type: 'decor', variant: 'crystal', x: 770, y: 450, w: 15, h: 20 }
    ]
  }

];
