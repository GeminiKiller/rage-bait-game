// js/levels_b.js — Levels 11-22 ("Complexity" -> "Mastery" -> "Victory Lap" -> "Finale")
// Plain script, no modules. Defines window.LEVELS_B per SPEC.md level format.
// Played after levels_a.js (1-10), which already taught: fake floors (hide),
// spike pop-ups (reveal), runaway exits (move exit), invisible blocks over
// pits (reveal solid), crushers (startOnTrigger fast platform), wall arrows
// (shoot). These levels chain and betray those known mechanics.
//
// Geometry conventions (matching levels_a.js):
//   - Ground floors: y=480, h=60 (top surface at y=480).
//   - Standing player: top-left y = 440 (feet at 480).
//   - Exit door: 30w x 50h, y=430 sits flush on a y=480 floor.
//   - Jump metrics (per SPEC.md): step-up <=100px, flat gap <=170px,
//     moving-platform-adjacent gap <=150px. Checked in each SOLUTION comment.

window.LEVELS_B = [

  // ================= LEVEL 11 =================
  // SOLUTION: FloorA[0,260]. Board plat1 at its start x=280 (20px gap, no
  //   wait needed) and ride right. Crossing x=430-470 fires a trigger that
  //   hides plat1 AND reveals safe1[520,650] in the same instant — jump
  //   forward (~50px, trivial) the moment it happens to land on safe1,
  //   then walk to floorB[650,960], hop spike1(750-780), exit@880.
  //   First ride: don't just stand there when it vanishes — jump!
  {
    name: "Platform Ghosting",
    deathMsgs: [
      "It ghosted you mid-ride.",
      "New phone, who dis?",
      "The platform said 'it's not you, it's me.'"
    ],
    spawn: { x: 40, y: 440 },
    exit: { x: 880, y: 430 },
    objects: [
      { id: 'floorA', type: 'solid', x: 0, y: 480, w: 260, h: 60 },
      { id: 'plat1', type: 'platform', x: 280, y: 480, w: 90, h: 20,
        path: [{ x: 500, y: 480 }], speed: 140, mode: 'pingpong' },
      { id: 'safe1', type: 'solid', x: 520, y: 480, w: 130, h: 60, hidden: true },
      { id: 'floorB', type: 'solid', x: 650, y: 480, w: 310, h: 60 },
      { id: 'spike1', type: 'hazard', variant: 'spikes', dir: 'up', x: 750, y: 460, w: 30, h: 20 },
      { type: 'trigger', x: 430, y: 380, w: 40, h: 100, once: true, delay: 0,
        actions: [
          { do: 'msg', text: "Wait, where'd it—" },
          { do: 'hide', target: 'plat1' },
          { do: 'reveal', target: 'safe1' }
        ] }
    ]
  },

  // ================= LEVEL 12 =================
  // SOLUTION: Single floor[0,960]. Hop spike1(250-280, trivial). Two
  //   sequential wall-arrow triggers at x=420 and x=620 (each gives well
  //   over 1s of lead before the arrow arrives) — walk up, then hop each
  //   arrow at y450 as it reaches you (same dodge taught in L10, done
  //   twice back to back). Clear floor the rest of the way to exit@880.
  {
    name: "Arrow Alley",
    deathMsgs: [
      "Death by a thousand... well, two arrows.",
      "You had a whole second to react.",
      "Dodgeball champion you are not."
    ],
    spawn: { x: 40, y: 440 },
    exit: { x: 880, y: 430 },
    objects: [
      { id: 'floor', type: 'solid', x: 0, y: 480, w: 960, h: 60 },
      { id: 'spike1', type: 'hazard', variant: 'spikes', dir: 'up', x: 250, y: 460, w: 30, h: 20 },
      { type: 'trigger', x: 420, y: 380, w: 40, h: 150, once: true, delay: 0.25,
        actions: [
          { do: 'msg', text: 'Incoming!' },
          { do: 'shoot', from: { x: 960, y: 450 }, dir: { x: -1, y: 0 }, speed: 420 }
        ] },
      { type: 'trigger', x: 620, y: 380, w: 40, h: 150, once: true, delay: 0.25,
        actions: [
          { do: 'shoot', from: { x: 960, y: 450 }, dir: { x: -1, y: 0 }, speed: 450 }
        ] }
    ]
  },

  // ================= LEVEL 13 =================
  // SOLUTION: Floor[0,960]. Jump the 80px fake1 gap (250-330) without
  //   touching it — a trigger would hide it underfoot otherwise. Approach
  //   x=480: crusher arms (msg+shake), corridor at 550-630; wait for it to
  //   retract then dash through (80px/0.27s, same pattern as L10). At
  //   x=650 a hidden spike reveals 80px ahead at x=790 (0.2s delay, ~80px/
  //   0.27s lead) — hop it, then walk to exit@880.
  {
    name: "Three-Course Betrayal",
    deathMsgs: [
      "Appetizer, entree, and your funeral.",
      "The crusher sends its regards.",
      "Three traps. Zero survivors."
    ],
    spawn: { x: 40, y: 440 },
    exit: { x: 880, y: 430 },
    objects: [
      { id: 'floor', type: 'solid', x: 0, y: 480, w: 960, h: 60 },
      { id: 'fake1', type: 'solid', x: 250, y: 480, w: 80, h: 60 },
      { id: 'crusher', type: 'platform', x: 550, y: 80, w: 80, h: 40,
        path: [{ x: 550, y: 440 }], speed: 560, mode: 'pingpong', startOnTrigger: true },
      { id: 'spikepop', type: 'hazard', variant: 'spikes', dir: 'up', x: 790, y: 460, w: 30, h: 20, hidden: true },
      { type: 'trigger', x: 250, y: 440, w: 80, h: 40, once: true, delay: 0.25,
        actions: [ { do: 'msg', text: 'uh oh...' }, { do: 'hide', target: 'fake1' } ] },
      { type: 'trigger', x: 480, y: 380, w: 50, h: 100, once: true, delay: 0,
        actions: [ { do: 'msg', text: 'Wait for it...' }, { do: 'shake' }, { do: 'start', target: 'crusher' } ] },
      { type: 'trigger', x: 650, y: 380, w: 40, h: 100, once: true, delay: 0.2,
        actions: [ { do: 'reveal', target: 'spikepop' }, { do: 'shake' } ] }
    ]
  },

  // ================= LEVEL 14 =================
  // SOLUTION: FloorA[0,260]. Board plat1 at x=280 (20px gap) and ride to
  //   its far reach (~x=520-610). Around x=470-530 a spike reveals right
  //   at FloorB's edge (650-680, ~120px/0.4s lead) — instead of stepping
  //   off at the obvious spot, jump PAST it, landing on FloorB past x=680
  //   (70px hop, well under 170). Continue to exit@880.
  {
    name: "Stick the Landing",
    deathMsgs: [
      "10/10 for style, 0/10 for survival.",
      "The welcome mat had a catch.",
      "You landed. On spikes. Great job."
    ],
    spawn: { x: 40, y: 440 },
    exit: { x: 880, y: 430 },
    objects: [
      { id: 'floorA', type: 'solid', x: 0, y: 480, w: 260, h: 60 },
      { id: 'plat1', type: 'platform', x: 280, y: 480, w: 90, h: 20,
        path: [{ x: 520, y: 480 }], speed: 150, mode: 'pingpong' },
      { id: 'floorB', type: 'solid', x: 650, y: 480, w: 310, h: 60 },
      { id: 'spikepop', type: 'hazard', variant: 'spikes', dir: 'up', x: 650, y: 460, w: 30, h: 20, hidden: true },
      { type: 'trigger', x: 470, y: 380, w: 40, h: 100, once: true, delay: 0.2,
        actions: [ { do: 'msg', text: 'Nope.' }, { do: 'reveal', target: 'spikepop' }, { do: 'shake' } ] }
    ]
  },

  // ================= LEVEL 15 =================
  // SOLUTION: FloorA[0,200]; jump the 80px fake1 gap (200-280) without
  //   touching it. Continue on floorB; at x=560 the crusher arms (corridor
  //   650-730) — wait for it to retract, dash through (80px/0.27s). At
  //   x=760 a wall arrow fires with ~0.3s+ lead; hop it, then walk the
  //   last stretch to exit@880.
  {
    name: "Everything Bagel",
    deathMsgs: [
      "You ordered the combo. It ordered you.",
      "Floor, crusher, arrow. Pick your poison.",
      "That's a lot of ways to die in one hallway."
    ],
    spawn: { x: 40, y: 440 },
    exit: { x: 880, y: 430 },
    objects: [
      { id: 'floorA', type: 'solid', x: 0, y: 480, w: 200, h: 60 },
      { id: 'fake1', type: 'solid', x: 200, y: 480, w: 80, h: 60 },
      { id: 'floorB', type: 'solid', x: 280, y: 480, w: 680, h: 60 },
      { id: 'crusher', type: 'platform', x: 650, y: 80, w: 80, h: 40,
        path: [{ x: 650, y: 440 }], speed: 580, mode: 'pingpong', startOnTrigger: true },
      { type: 'trigger', x: 200, y: 440, w: 80, h: 40, once: true, delay: 0.25,
        actions: [ { do: 'msg', text: 'uh oh...' }, { do: 'hide', target: 'fake1' } ] },
      { type: 'trigger', x: 560, y: 380, w: 50, h: 100, once: true, delay: 0,
        actions: [ { do: 'msg', text: 'Wait for it...' }, { do: 'shake' }, { do: 'start', target: 'crusher' } ] },
      { type: 'trigger', x: 760, y: 380, w: 40, h: 150, once: true, delay: 0.2,
        actions: [ { do: 'shoot', from: { x: 960, y: 450 }, dir: { x: -1, y: 0 }, speed: 450 } ] }
    ]
  },

  // ================= LEVEL 16 =================
  // SOLUTION: Long flat floor[0,960] — looks trivial. Crossing x=150 seals
  //   a lava wall in behind you (starts 60px back, chases right at
  //   150px/s, well under your 300px/s) — just keep moving right, don't
  //   stop for more than ~0.25s. Hop spike1(500-530) without breaking
  //   stride, continue straight to exit@900. Stopping to admire the view
  //   kills you.
  {
    name: "The Point of No Return",
    deathMsgs: [
      "Should've kept running.",
      "The wall wanted a word.",
      "This is why we don't sightsee."
    ],
    spawn: { x: 40, y: 440 },
    exit: { x: 900, y: 430 },
    objects: [
      { id: 'floor', type: 'solid', x: 0, y: 480, w: 960, h: 60 },
      { id: 'spike1', type: 'hazard', variant: 'spikes', dir: 'up', x: 500, y: 460, w: 30, h: 20 },
      { id: 'chaser', type: 'hazard', variant: 'lava', dir: 'right', x: 90, y: 0, w: 40, h: 540, hidden: true },
      { type: 'trigger', x: 150, y: 380, w: 20, h: 150, once: true, delay: 0,
        actions: [
          { do: 'msg', text: 'RUN!' },
          { do: 'shake' },
          { do: 'reveal', target: 'chaser' },
          { do: 'move', target: 'chaser', to: { x: 960, y: 0 }, speed: 150 }
        ] }
    ]
  },

  // ================= LEVEL 17 =================
  // SOLUTION: The clean, elevated up1/upFake/up2 platform (reached via a
  //   90px step-up at x=300-340) LOOKS like the intended route but hides a
  //   trap: walking it triggers hide(upFake)+reveal(spikeDrop) at x=520-
  //   600, dropping you onto now-spiked ground = death. The scary-looking
  //   narrow lowerBridge[300,700] at ground level has zero traps — just
  //   walk straight across it at y=480 to floorB and exit@880. Ignore the
  //   "safe" platform entirely.
  {
    name: "The Devil You Know",
    deathMsgs: [
      "The pretty path lied.",
      "Looked safe. Wasn't.",
      "Should've trusted the scary bridge."
    ],
    spawn: { x: 40, y: 440 },
    exit: { x: 880, y: 430 },
    objects: [
      { id: 'floorA', type: 'solid', x: 0, y: 480, w: 300, h: 60 },
      { id: 'lowerBridge', type: 'solid', x: 300, y: 480, w: 400, h: 60 },
      { id: 'floorB', type: 'solid', x: 700, y: 480, w: 260, h: 60 },
      { id: 'up1', type: 'solid', x: 340, y: 390, w: 180, h: 20 },
      { id: 'upFake', type: 'solid', x: 520, y: 390, w: 80, h: 20 },
      { id: 'up2', type: 'solid', x: 600, y: 390, w: 100, h: 20 },
      { id: 'spikeDrop', type: 'hazard', variant: 'spikes', dir: 'up', x: 520, y: 460, w: 80, h: 20, hidden: true },
      { type: 'trigger', x: 290, y: 380, w: 20, h: 150, once: true, delay: 0,
        actions: [ { do: 'msg', text: 'Choose wisely.' } ] },
      { type: 'trigger', x: 470, y: 300, w: 40, h: 100, once: true, delay: 0.25,
        actions: [ { do: 'msg', text: 'This seemed too easy.' }, { do: 'hide', target: 'upFake' }, { do: 'reveal', target: 'spikeDrop' } ] }
    ]
  },

  // ================= LEVEL 18 =================
  // SOLUTION: FloorA[0,300]; board plat1 at x=320 (20px gap) and ride to
  //   floorB[580,960] (20px hop off). Crossing x=620 makes the visible
  //   exit(700) flee to x=800. Hop spike1(750-780). Crossing x=800 (right
  //   where it landed) makes it flee AGAIN to its true final spot x=900 —
  //   walk the last few px in and it's done. Two moves, then it stays put.
  {
    name: "Two-Timer",
    deathMsgs: [
      "It's not you, it's commitment.",
      "The door has trust issues.",
      "Two-timed. Literally."
    ],
    spawn: { x: 40, y: 440 },
    exit: { x: 700, y: 430 },
    objects: [
      { id: 'floorA', type: 'solid', x: 0, y: 480, w: 300, h: 60 },
      { id: 'plat1', type: 'platform', x: 320, y: 480, w: 90, h: 20,
        path: [{ x: 470, y: 480 }], speed: 140, mode: 'pingpong' },
      { id: 'floorB', type: 'solid', x: 580, y: 480, w: 380, h: 60 },
      { id: 'spike1', type: 'hazard', variant: 'spikes', dir: 'up', x: 750, y: 460, w: 30, h: 20 },
      { type: 'trigger', x: 620, y: 380, w: 40, h: 100, once: true, delay: 0,
        actions: [ { do: 'msg', text: 'Nice try.' }, { do: 'shake' }, { do: 'move', target: 'exit', to: { x: 800, y: 430 }, speed: 500 } ] },
      { type: 'trigger', x: 800, y: 380, w: 40, h: 100, once: true, delay: 0,
        actions: [ { do: 'msg', text: 'AGAIN?!' }, { do: 'shake' }, { do: 'move', target: 'exit', to: { x: 900, y: 430 }, speed: 500 } ] }
    ]
  },

  // ================= LEVEL 19 =================
  // SOLUTION: FloorB[250,960] the whole way. x=260 arms crusher1 (corridor
  //   320-400) — wait, dash through (80px/0.27s). x=430 fires a wall arrow
  //   with 1s+ lead; hop it. x=590 arms crusher2 (corridor 650-730) — same
  //   wait-and-dash. x=750 reveals a spike 80px ahead at x=860 (0.1s delay,
  //   ~0.27s lead) — hop it, then walk the last 30px to exit@920. No step
  //   skips a beat, no room for hesitation.
  {
    name: "The Corridor of Consequences",
    deathMsgs: [
      "Consequences, indeed.",
      "That's four traps too many.",
      "The corridor remembers."
    ],
    spawn: { x: 40, y: 440 },
    exit: { x: 920, y: 430 },
    objects: [
      { id: 'floorA', type: 'solid', x: 0, y: 480, w: 250, h: 60 },
      { id: 'floorB', type: 'solid', x: 250, y: 480, w: 710, h: 60 },
      { id: 'crusher1', type: 'platform', x: 320, y: 80, w: 80, h: 40,
        path: [{ x: 320, y: 440 }], speed: 580, mode: 'pingpong', startOnTrigger: true },
      { id: 'crusher2', type: 'platform', x: 650, y: 80, w: 80, h: 40,
        path: [{ x: 650, y: 440 }], speed: 580, mode: 'pingpong', startOnTrigger: true },
      { id: 'spikepop2', type: 'hazard', variant: 'spikes', dir: 'up', x: 860, y: 460, w: 30, h: 20, hidden: true },
      { type: 'trigger', x: 260, y: 380, w: 50, h: 100, once: true, delay: 0,
        actions: [ { do: 'msg', text: 'Wait for it...' }, { do: 'shake' }, { do: 'start', target: 'crusher1' } ] },
      { type: 'trigger', x: 430, y: 380, w: 40, h: 150, once: true, delay: 0.25,
        actions: [ { do: 'shoot', from: { x: 960, y: 450 }, dir: { x: -1, y: 0 }, speed: 450 } ] },
      { type: 'trigger', x: 590, y: 380, w: 50, h: 100, once: true, delay: 0,
        actions: [ { do: 'msg', text: 'Again?!' }, { do: 'shake' }, { do: 'start', target: 'crusher2' } ] },
      { type: 'trigger', x: 750, y: 380, w: 40, h: 100, once: true, delay: 0.1,
        actions: [ { do: 'reveal', target: 'spikepop2' }, { do: 'shake' } ] }
    ]
  },

  // ================= LEVEL 20 =================
  // SOLUTION: FloorA[0,180]; jump the 70px fake1 gap without touching it.
  //   Cross floorB, board plat1 at x=540 (20px gap) and ride to its far
  //   reach; around x=600-660 a spike reveals ~100px ahead at x=760
  //   (~0.33s lead) — jump PAST it onto floorC[800,960] (past x=790).
  //   Landing arms the crusher (corridor 830-890, msg+shake) — wait, then
  //   dash through (60px/0.2s). Walk the last 30px to exit@920.
  {
    name: "The Kitchen Sink",
    deathMsgs: [
      "Everything but the kitchen sink. And that too.",
      "Four traps, one hallway, zero mercy.",
      "This is what mastery costs."
    ],
    spawn: { x: 40, y: 440 },
    exit: { x: 920, y: 430 },
    objects: [
      { id: 'floorA', type: 'solid', x: 0, y: 480, w: 180, h: 60 },
      { id: 'fake1', type: 'solid', x: 180, y: 480, w: 70, h: 60 },
      { id: 'floorB', type: 'solid', x: 250, y: 480, w: 270, h: 60 },
      { id: 'plat1', type: 'platform', x: 540, y: 480, w: 80, h: 20,
        path: [{ x: 680, y: 480 }], speed: 160, mode: 'pingpong' },
      { id: 'spikepop', type: 'hazard', variant: 'spikes', dir: 'up', x: 760, y: 460, w: 30, h: 20, hidden: true },
      { id: 'floorC', type: 'solid', x: 800, y: 480, w: 160, h: 60 },
      { id: 'crusher', type: 'platform', x: 830, y: 80, w: 60, h: 40,
        path: [{ x: 830, y: 440 }], speed: 580, mode: 'pingpong', startOnTrigger: true },
      { type: 'trigger', x: 180, y: 440, w: 70, h: 40, once: true, delay: 0.2,
        actions: [ { do: 'msg', text: 'uh oh...' }, { do: 'hide', target: 'fake1' } ] },
      { type: 'trigger', x: 600, y: 380, w: 40, h: 100, once: true, delay: 0.2,
        actions: [ { do: 'msg', text: 'Nope.' }, { do: 'reveal', target: 'spikepop' }, { do: 'shake' } ] },
      { type: 'trigger', x: 770, y: 380, w: 40, h: 100, once: true, delay: 0,
        actions: [ { do: 'msg', text: 'Wait for it...' }, { do: 'shake' }, { do: 'start', target: 'crusher' } ] }
    ]
  },

  // ================= LEVEL 21 =================
  // SOLUTION: Looks like a flat victory-lap jog — it isn't. FloorA[0,300]:
  //   hop fakeA's 80px gap (300-380) without touching it. Hop fakeB's 50px
  //   gap (550-600) too. Crossing x=620 sends the visible exit(700) fleeing
  //   to x=900. At x=660 a hidden block reveals 50px ahead at x=800-900
  //   (~80px/0.27s lead) — jump onto it to bridge the gap, then walk onto
  //   floorE and into the exit@900. Four "just relax" traps in one hallway.
  {
    name: "Don't Get Comfortable",
    deathMsgs: [
      "Comfortable? Not anymore.",
      "The victory lap lied to your face.",
      "Almost. ALMOST."
    ],
    spawn: { x: 40, y: 440 },
    exit: { x: 700, y: 430 },
    objects: [
      { id: 'floorA', type: 'solid', x: 0, y: 480, w: 300, h: 60 },
      { id: 'fakeA', type: 'solid', x: 300, y: 480, w: 80, h: 60 },
      { id: 'floorB', type: 'solid', x: 380, y: 480, w: 170, h: 60 },
      { id: 'fakeB', type: 'solid', x: 550, y: 480, w: 50, h: 60 },
      { id: 'floorC', type: 'solid', x: 600, y: 480, w: 150, h: 60 },
      { id: 'finalBlock', type: 'solid', x: 800, y: 480, w: 100, h: 60, hidden: true },
      { id: 'floorE', type: 'solid', x: 900, y: 480, w: 60, h: 60 },
      { type: 'trigger', x: 300, y: 440, w: 80, h: 40, once: true, delay: 0.25,
        actions: [ { do: 'msg', text: 'This seems too easy.' }, { do: 'hide', target: 'fakeA' } ] },
      { type: 'trigger', x: 550, y: 440, w: 50, h: 40, once: true, delay: 0.2,
        actions: [ { do: 'hide', target: 'fakeB' } ] },
      { type: 'trigger', x: 620, y: 380, w: 30, h: 100, once: true, delay: 0,
        actions: [ { do: 'msg', text: 'Not so fast.' }, { do: 'shake' }, { do: 'move', target: 'exit', to: { x: 900, y: 430 }, speed: 500 } ] },
      { type: 'trigger', x: 660, y: 380, w: 50, h: 100, once: true, delay: 0.2,
        actions: [ { do: 'msg', text: 'One more thing.' }, { do: 'reveal', target: 'finalBlock' }, { do: 'shake' } ] }
    ]
  },

  // ================= LEVEL 22 =================
  // SOLUTION: FloorA[0,150]; hop fake1's 80px gap (150-230) untouched. On
  //   floorB a spike reveals 80px ahead near x=380 (0.27s lead) — hop it.
  //   Board plat1 at x=440 (20px gap), ride to floorC[670,760]; crusher
  //   arms at x=670 (corridor 700-760) — wait, dash through (60px/0.2s).
  //   On floorD a wall arrow fires (~0.28s lead, hop it) and the exit(850)
  //   flees once more to its true spot x=920 — walk in and it's finally over.
  {
    name: "The Gauntlet",
    deathMsgs: [
      "The greatest hits, remixed to kill you.",
      "You made it 21 levels for THIS?",
      "This is the last one. Don't blow it."
    ],
    spawn: { x: 40, y: 440 },
    exit: { x: 850, y: 430 },
    objects: [
      { id: 'floorA', type: 'solid', x: 0, y: 480, w: 150, h: 60 },
      { id: 'fake1', type: 'solid', x: 150, y: 480, w: 80, h: 60 },
      { id: 'floorB', type: 'solid', x: 230, y: 480, w: 190, h: 60 },
      { id: 'spikepop1', type: 'hazard', variant: 'spikes', dir: 'up', x: 380, y: 460, w: 30, h: 20, hidden: true },
      { id: 'plat1', type: 'platform', x: 440, y: 480, w: 90, h: 20,
        path: [{ x: 560, y: 480 }], speed: 150, mode: 'pingpong' },
      { id: 'floorC', type: 'solid', x: 670, y: 480, w: 90, h: 60 },
      { id: 'crusher', type: 'platform', x: 700, y: 80, w: 60, h: 40,
        path: [{ x: 700, y: 440 }], speed: 580, mode: 'pingpong', startOnTrigger: true },
      { id: 'floorD', type: 'solid', x: 760, y: 480, w: 200, h: 60 },
      { type: 'trigger', x: 150, y: 440, w: 80, h: 40, once: true, delay: 0.2,
        actions: [ { do: 'msg', text: 'Deja vu.' }, { do: 'hide', target: 'fake1' } ] },
      { type: 'trigger', x: 240, y: 380, w: 40, h: 100, once: true, delay: 0.2,
        actions: [ { do: 'reveal', target: 'spikepop1' }, { do: 'shake' } ] },
      { type: 'trigger', x: 670, y: 380, w: 30, h: 100, once: true, delay: 0,
        actions: [ { do: 'msg', text: 'Wait for it...' }, { do: 'shake' }, { do: 'start', target: 'crusher' } ] },
      { type: 'trigger', x: 790, y: 380, w: 30, h: 150, once: true, delay: 0.15,
        actions: [ { do: 'shoot', from: { x: 960, y: 450 }, dir: { x: -1, y: 0 }, speed: 450 } ] },
      { type: 'trigger', x: 820, y: 380, w: 30, h: 100, once: true, delay: 0,
        actions: [ { do: 'msg', text: "One more for old times' sake." }, { do: 'shake' }, { do: 'move', target: 'exit', to: { x: 920, y: 430 }, speed: 500 } ] }
    ]
  }

];
