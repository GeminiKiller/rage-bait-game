// js/levels_a.js — Levels 1-10 ("Teaching" -> "Combination" -> "Betrayal")
// Plain script, no modules. Defines window.LEVELS_A per SPEC.md level format.
//
// Geometry conventions used throughout this file:
//   - Ground floors: y=480, h=60 (top surface at y=480).
//   - Standing player: top-left y = 440 (feet at 480).
//   - Exit door: 30w x 50h, y=430 sits flush on a y=480 floor.
//   - Jump metrics (per SPEC.md): step-up <=100px, flat gap <=170px,
//     moving-platform-adjacent gap <=150px. Every gap below is checked
//     against these numbers in the SOLUTION comment above each level.

window.LEVELS_A = [

  // ================= LEVEL 1 =================
  // SOLUTION: Spawn (40,440) on Floor A [0,260]. Walk to x=260, jump the
  //   80px gap (Gap1: 260-340, <=170 OK) landing on Floor B [340,700] at
  //   x=340+. Walk to x=500, hop the 30px-wide spike bump (500-530,
  //   trivial clearance, well under 133px max jump height). Continue to
  //   x=700 (Floor B edge) and jump the 60px surprise gap (Gap2: 700-760,
  //   <=170 OK) landing on Floor C [760,960] at x=760+. Walk to exit at
  //   x=880 (880+30=910 < 960, on Floor C). Total ~950px horizontal at
  //   300px/s plus two small jumps: well under 30s.
  //   The "cheeky surprise": after a long, easy, uneventful stretch on
  //   Floor B, Gap2 arrives right before the exit with no warning — a
  //   naive player relaxes and walks straight into it once. With
  //   knowledge, it's just another easy 60px hop.
  {
    name: "The Overconfidence Pit",
    deathMsgs: [
      "Really? The first level?",
      "The floor was RIGHT there.",
      "Look down once in a while."
    ],
    spawn: { x: 40, y: 440 },
    exit: { x: 880, y: 430 },
    objects: [
      { id: 'floorA', type: 'solid', x: 0, y: 480, w: 260, h: 60 },
      { id: 'floorB', type: 'solid', x: 340, y: 480, w: 360, h: 60 },
      { id: 'floorC', type: 'solid', x: 760, y: 480, w: 200, h: 60 },
      { id: 'spike1', type: 'hazard', variant: 'spikes', dir: 'up', x: 500, y: 460, w: 30, h: 20 }
    ]
  },

  // ================= LEVEL 2 =================
  // SOLUTION: Spawn (40,440) on Floor A [0,300]. Walk to x=300 (edge).
  //   Moving platform 'plat1' (80w) starts at x=350,y=480 and oscillates
  //   to x=520 and back (pingpong, speed 120). Wait until it swings to
  //   its leftmost position (x=350) — gap from Floor A edge (300) to
  //   platform left edge (350) = 50px, well under 170. Jump on, ride it
  //   right. When it reaches its rightmost extent its right edge is at
  //   520+80=600, flush with Floor B's edge (600) — step off onto Floor B
  //   [600,960] with 0px gap. Walk to x=750, hop the obvious 30px spike
  //   bump (750-780). Continue to exit at x=880.
  {
    name: "Ride or Die",
    deathMsgs: [
      "Patience. The bus comes back.",
      "You jumped into the pit. Impressive.",
      "Timing is a skill issue."
    ],
    spawn: { x: 40, y: 440 },
    exit: { x: 880, y: 430 },
    objects: [
      { id: 'floorA', type: 'solid', x: 0, y: 480, w: 300, h: 60 },
      { id: 'floorB', type: 'solid', x: 600, y: 480, w: 360, h: 60 },
      { id: 'plat1', type: 'platform', x: 350, y: 480, w: 80, h: 20,
        path: [{ x: 520, y: 480 }], speed: 120, mode: 'pingpong' },
      { id: 'spike1', type: 'hazard', variant: 'spikes', dir: 'up', x: 750, y: 460, w: 30, h: 20 }
    ]
  },

  // ================= LEVEL 3 =================
  // SOLUTION: Spawn (40,440) on Floor A [0,300]. Walking through the
  //   trigger zone (x150-230, full height) fires immediately (delay 0):
  //   msg "Watch closely..." then reveal of hidden block 'blk1'
  //   (x390-470, y=480, matching floor height) — this happens well
  //   before the player reaches the gap, so it is fully telegraphed,
  //   not a surprise. Continue to Floor A edge (x=300) and jump 90px
  //   (300->390, <=170 OK) onto the now-visible block. Walk across it,
  //   then jump 80px (470->550, <=170 OK) onto Floor B [550,960]. Walk
  //   to exit at x=880.
  {
    name: "Trust Fall",
    deathMsgs: [
      "It literally told you to wait for it.",
      "Reading comprehension: 0.",
      "The block was clearly marked 'trust me'."
    ],
    spawn: { x: 40, y: 440 },
    exit: { x: 880, y: 430 },
    objects: [
      { id: 'floorA', type: 'solid', x: 0, y: 480, w: 300, h: 60 },
      { id: 'floorB', type: 'solid', x: 550, y: 480, w: 410, h: 60 },
      { id: 'blk1', type: 'solid', x: 390, y: 480, w: 80, h: 60, hidden: true },
      { type: 'trigger', x: 150, y: 380, w: 80, h: 100, once: true, delay: 0,
        actions: [
          { do: 'msg', text: 'Watch closely...' },
          { do: 'reveal', target: 'blk1' }
        ] }
    ]
  },

  // ================= LEVEL 4 =================
  // SOLUTION: Spawn (40,440) on Floor A [0,250]. Hop spike1 (150-180).
  //   At x=250 (Floor A edge), moving platform 'plat2' (70w) oscillates
  //   between x=300 and x=480 (pingpong, speed 140). Gap from Floor A
  //   edge (250) to platform left edge (300) = 50px (<=170). Ride it
  //   right; at full extension its right edge is 480+70=550, flush with
  //   Floor B's edge (550) — 0px gap onto Floor B [550,750]. Hop spike2
  //   (650-680). At x=750 (Floor B edge) jump the direct 100px gap
  //   (750->850, <=170 OK) onto Floor C [850,960]. Walk to exit at x=880
  //   (910 < 960, fits).
  {
    name: "Double Trouble",
    deathMsgs: [
      "One trap wasn't enough for you?",
      "Two spikes, zero brain cells.",
      "The platform isn't a taxi service."
    ],
    spawn: { x: 40, y: 440 },
    exit: { x: 880, y: 430 },
    objects: [
      { id: 'floorA', type: 'solid', x: 0, y: 480, w: 250, h: 60 },
      { id: 'floorB', type: 'solid', x: 550, y: 480, w: 200, h: 60 },
      { id: 'floorC', type: 'solid', x: 850, y: 480, w: 110, h: 60 },
      { id: 'spike1', type: 'hazard', variant: 'spikes', dir: 'up', x: 150, y: 460, w: 30, h: 20 },
      { id: 'spike2', type: 'hazard', variant: 'spikes', dir: 'up', x: 650, y: 460, w: 30, h: 20 },
      { id: 'plat2', type: 'platform', x: 300, y: 480, w: 70, h: 20,
        path: [{ x: 480, y: 480 }], speed: 140, mode: 'pingpong' }
    ]
  },

  // ================= LEVEL 5 =================
  // SOLUTION: Spawn (40,440) on Floor A [0,400]. 'fake1' (x400-480, y=480)
  //   LOOKS like ordinary floor connecting to Floor B [480,960]. Walking
  //   onto it fires a trigger (delay 0.25s) that hides it, dropping
  //   anyone still standing there — a fair one-time surprise (rule #1).
  //   With knowledge, treat x=400 to x=480 as an ordinary 80px pit
  //   (<=170 OK) and jump clean over fake1 without ever touching it,
  //   landing directly on Floor B at x=480+. Walk to exit at x=880.
  {
    name: "False Advertising",
    deathMsgs: [
      "The floor lied. Floors do that now.",
      "False advertising, false footing.",
      "It looked so solid, didn't it?"
    ],
    spawn: { x: 40, y: 440 },
    exit: { x: 880, y: 430 },
    objects: [
      { id: 'floorA', type: 'solid', x: 0, y: 480, w: 400, h: 60 },
      { id: 'floorB', type: 'solid', x: 480, y: 480, w: 480, h: 60 },
      { id: 'fake1', type: 'solid', x: 400, y: 480, w: 80, h: 60 },
      { type: 'trigger', x: 400, y: 440, w: 80, h: 40, once: true, delay: 0.25,
        actions: [
          { do: 'msg', text: 'uh oh...' },
          { do: 'hide', target: 'fake1' }
        ] }
    ]
  },

  // ================= LEVEL 6 =================
  // SOLUTION: Spawn (40,440) on one continuous floor [0,960]. Crossing
  //   x=480-520 fires trigger1 (delay 0): msg "uh oh...". Crossing
  //   x=560-600 fires trigger2 (delay 0.2s): reveal hidden spike
  //   'spikepop' at x=700-740 plus a screen shake. At 300px/s the player
  //   is only at ~x=620 when the spike appears at x=700 (80px / ~0.27s
  //   of lead time) — a fair first-time surprise pop, easily jumped once
  //   known (spike is a 40px-wide, 20px-tall bump, trivial hop). Continue
  //   to exit at x=880.
  {
    name: "Pop Quiz",
    deathMsgs: [
      "Ground shouldn't do that. And yet.",
      "Pop quiz: you failed.",
      "Spikes: 1, Reflexes: 0."
    ],
    spawn: { x: 40, y: 440 },
    exit: { x: 880, y: 430 },
    objects: [
      { id: 'floor', type: 'solid', x: 0, y: 480, w: 960, h: 60 },
      { id: 'spikepop', type: 'hazard', variant: 'spikes', dir: 'up', x: 700, y: 460, w: 40, h: 20, hidden: true },
      { type: 'trigger', x: 480, y: 380, w: 40, h: 100, once: true, delay: 0,
        actions: [ { do: 'msg', text: 'uh oh...' } ] },
      { type: 'trigger', x: 560, y: 380, w: 40, h: 100, once: true, delay: 0.2,
        actions: [ { do: 'reveal', target: 'spikepop' }, { do: 'shake' } ] }
    ]
  },

  // ================= LEVEL 7 =================
  // SOLUTION: Spawn (40,440) on Floor A [0,250]. Jump the 80px gap
  //   (250->330, <=170 OK) onto Floor B [330,960]. The exit is initially
  //   visible at x=550. Crossing x=450-510 fires a trigger (delay 0):
  //   msg "Nice try." + shake + move 'exit' from (550,430) to (900,430)
  //   at speed 500 (350px in 0.7s). Keep walking past the now-empty
  //   original spot; hop the obvious spike bump at x=700-730; continue
  //   to the exit's final resting spot at x=900 (900+30=930 < 960, fits
  //   on Floor B). The exit only moves once per life, so it is always
  //   findable at (900,430) by the time the player arrives.
  {
    name: "Commitment Issues",
    deathMsgs: [
      "It's not going to just stand there.",
      "Relationships take effort.",
      "Chase it. Don't just stand there sulking."
    ],
    spawn: { x: 40, y: 440 },
    exit: { x: 550, y: 430 },
    objects: [
      { id: 'floorA', type: 'solid', x: 0, y: 480, w: 250, h: 60 },
      { id: 'floorB', type: 'solid', x: 330, y: 480, w: 630, h: 60 },
      { id: 'spike1', type: 'hazard', variant: 'spikes', dir: 'up', x: 700, y: 460, w: 30, h: 20 },
      { type: 'trigger', x: 450, y: 380, w: 60, h: 100, once: true, delay: 0,
        actions: [
          { do: 'msg', text: 'Nice try.' },
          { do: 'shake' },
          { do: 'move', target: 'exit', to: { x: 900, y: 430 }, speed: 500 }
        ] }
    ]
  },

  // ================= LEVEL 8 =================
  // SOLUTION: Spawn (40,440) on Floor A [0,300]. The gap to Floor B
  //   [550,960] is 250px total — too wide to clear in one jump (>170),
  //   so it can only be crossed via a hidden block. The trigger zone
  //   (x300-390, y340-480) sits entirely over open air past the floor
  //   edge, so it can only be entered by a player already airborne —
  //   it fires (delay 0.1s) a reveal of hidden block 'blk2' (x390-470,
  //   y=480) plus a shake, popping a solid stepping-stone into existence
  //   mid-jump. The first attempt is a fair surprise (nothing is visible
  //   to jump toward). With knowledge, the correct approach is identical
  //   to Level 3's known-safe pattern: a 90px hop (300->390, <=170) onto
  //   the block, walk across, then an 80px hop (470->550, <=170) onto
  //   Floor B. Walk to exit at x=880.
  {
    name: "Leap of Faith",
    deathMsgs: [
      "Some assembly required. Mid-air.",
      "It WAS there. Eventually.",
      "Faith without sight is hard, huh?"
    ],
    spawn: { x: 40, y: 440 },
    exit: { x: 880, y: 430 },
    objects: [
      { id: 'floorA', type: 'solid', x: 0, y: 480, w: 300, h: 60 },
      { id: 'floorB', type: 'solid', x: 550, y: 480, w: 410, h: 60 },
      { id: 'blk2', type: 'solid', x: 390, y: 480, w: 80, h: 60, hidden: true },
      { type: 'trigger', x: 300, y: 340, w: 90, h: 140, once: true, delay: 0.1,
        actions: [ { do: 'reveal', target: 'blk2' }, { do: 'shake' } ] }
    ]
  },

  // ================= LEVEL 9 =================
  // SOLUTION: Spawn (40,440) on Floor A [0,300]. Bridge tiles b1[300,400],
  //   b2[400,500], b3[500,700] sit flush against each other and against
  //   Floor A/B (0px gaps throughout) so a knowing player never needs to
  //   jump at all — just run straight across. Stepping onto b1 (trigger
  //   zone x300-320) fires two triggers at the same instant: one
  //   (delay 0) shows msg "RUN!"; the other (delay 1.8s) shakes the
  //   screen and hides b1, b2 and b3 simultaneously. Minimum honest
  //   crossing time at 300px/s over the 400px bridge (x=300 to x=700) is
  //   400/300 = 1.33s, leaving a 0.47s safety margin against the 1.8s
  //   collapse timer — comfortably beatable without stopping, but
  //   punishing any hesitation. Continue onto Floor B [700,960] to the
  //   exit at x=880.
  {
    name: "Floor It",
    deathMsgs: [
      "The floor said its goodbyes.",
      "Should've floored it sooner.",
      "Walking leisurely: a fatal hobby."
    ],
    spawn: { x: 40, y: 440 },
    exit: { x: 880, y: 430 },
    objects: [
      { id: 'floorA', type: 'solid', x: 0, y: 480, w: 300, h: 60 },
      { id: 'b1', type: 'solid', x: 300, y: 480, w: 100, h: 60 },
      { id: 'b2', type: 'solid', x: 400, y: 480, w: 100, h: 60 },
      { id: 'b3', type: 'solid', x: 500, y: 480, w: 200, h: 60 },
      { id: 'floorB', type: 'solid', x: 700, y: 480, w: 260, h: 60 },
      { type: 'trigger', x: 300, y: 440, w: 20, h: 40, once: true, delay: 0,
        actions: [ { do: 'msg', text: 'RUN!' } ] },
      { type: 'trigger', x: 300, y: 440, w: 20, h: 40, once: true, delay: 1.8,
        actions: [
          { do: 'shake' },
          { do: 'hide', target: 'b1' },
          { do: 'hide', target: 'b2' },
          { do: 'hide', target: 'b3' }
        ] }
    ]
  },

  // ================= LEVEL 10 =================
  // SOLUTION: Spawn (40,440) on Floor A [0,250]. Jump the 150px gap
  //   (250->400, <=170 OK, the tightest jump in the level — this is the
  //   finale) onto Floor B [400,960]. Crossing x400-450 fires a trigger
  //   (delay 0): msg "Wait for it..." + shake + start the crusher
  //   'crusher'. The crusher (x=500,y=80,w=80,h=40, startOnTrigger)
  //   oscillates between y=80 (idle, harmless) and y=440 (bottom edge at
  //   480, flush with the floor — fully blocks the 500-580 corridor) at
  //   speed 800px/s: each 360px leg takes 360/800=0.45s, so the full
  //   down-up cycle is 0.9s. Standing anywhere with x<480 is always safe
  //   regardless of crusher height. Knowing player waits, watches it
  //   slam down once (0.45s) and start retracting, then dashes through
  //   the 80px corridor (500->580, 80/300=0.27s) — far shorter than the
  //   0.45s+ window before the next descent, no pixel-perfect timing
  //   needed. Continue to x=650; crossing x650-690 fires a trigger
  //   (delay 0.3s) that shoots an arrow from the right wall (960,450)
  //   heading left at 500px/s. The safe play is to stop moving right
  //   after triggering it and simply wait for the arrow to visibly pass
  //   (well under 1s), then continue. Walk on to the exit at x=880
  //   (910 < 960).
  {
    name: "No More Mr. Nice Level",
    deathMsgs: [
      "This is the tutorial's revenge.",
      "Should've brought a shield.",
      "The gauntlet does not negotiate."
    ],
    spawn: { x: 40, y: 440 },
    exit: { x: 880, y: 430 },
    objects: [
      { id: 'floorA', type: 'solid', x: 0, y: 480, w: 250, h: 60 },
      { id: 'floorB', type: 'solid', x: 400, y: 480, w: 560, h: 60 },
      { id: 'crusher', type: 'platform', x: 500, y: 80, w: 80, h: 40,
        path: [{ x: 500, y: 440 }], speed: 800, mode: 'pingpong', startOnTrigger: true },
      { type: 'trigger', x: 400, y: 380, w: 50, h: 100, once: true, delay: 0,
        actions: [
          { do: 'msg', text: 'Wait for it...' },
          { do: 'shake' },
          { do: 'start', target: 'crusher' }
        ] },
      { type: 'trigger', x: 650, y: 380, w: 40, h: 150, once: true, delay: 0.3,
        actions: [
          { do: 'shoot', from: { x: 960, y: 450 }, dir: { x: -1, y: 0 }, speed: 500 }
        ] }
    ]
  }

];
