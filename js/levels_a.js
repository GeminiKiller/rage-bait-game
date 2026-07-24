// js/levels_a.js — Levels 1-10 ("Teaching" -> "Combination" -> "Betrayal")
// Plain script, no modules. Defines window.LEVELS_A per SPEC.md v2 level format.
// v2 remix pass: denser trap chains, verticality, decoy door (L4), one
// falling-ceiling-spike corridor (L7), one true pin-crusher (L10), one
// invert use (L5, 2.5s, generous buffer). Designed to SPEC.md, not old engine.
//
// Geometry conventions used throughout this file:
//   - Ground floors: y=480, h=60 (top surface at y=480).
//   - Standing player: top-left y = 440 (feet at 480).
//   - Exit door: 30w x 50h; y = (floor top) - 50 so it sits flush.
//   - Jump metrics (per SPEC.md): step-up <=100px, flat gap <=170px,
//     platform-adjacent hop <=150px. Checked in each SOLUTION comment.

window.LEVELS_A = [

  // ================= LEVEL 1 =================
  // SOLUTION: floorA[0,260]->gap1(80,<=170)->floorB[340,700], hop visible
  //   spike1(500-530), gap2(60)->floorC[760,960]. Landing trigger(760-800)
  //   reveals hidden spike2(830-860) with ~70px/0.23s lead - a last-second
  //   surprise right before the door. Known: hop it, walk to exit(880).
  //   NEW: icicleHang1 hangs 67px above head over gap1 - only a full jump
  //   into the ceiling for no reason clips it; the honest hop clears it.
  {
    name: "The Overconfidence Pit",
    deathMsgs: [
      "Really? The first level?",
      "The floor was RIGHT there.",
      "The door was NOT worth dying for.",
      "It was just hanging there. You walked into it."
    ],
    spawn: { x: 40, y: 440 },
    exit: { x: 880, y: 430 },
    objects: [
      { id: 'floorA', type: 'solid', x: 0, y: 480, w: 260, h: 60 },
      { id: 'floorB', type: 'solid', x: 340, y: 480, w: 360, h: 60 },
      { id: 'floorC', type: 'solid', x: 760, y: 480, w: 200, h: 60 },
      { id: 'spike1', type: 'hazard', variant: 'spikes', dir: 'up', x: 500, y: 460, w: 30, h: 20 },
      { id: 'spike2', type: 'hazard', variant: 'spikes', dir: 'up', x: 840, y: 460, w: 30, h: 20, hidden: true },
      { id: 'icicleHang1', type: 'hazard', variant: 'ice', dir: 'down', x: 260, y: 200, w: 80, h: 40 },
      { type: 'trigger', x: 760, y: 380, w: 40, h: 100, once: true, delay: 0,
        actions: [ { do: 'reveal', target: 'spike2' }, { do: 'shake' } ] }
    ]
  },

  // ================= LEVEL 2 =================
  // SOLUTION: floorA[0,300], board plat1(350<->520,pingpong) at its left
  //   swing, ride to floorB[600,960] (0px gap at full extension). Landing
  //   trigger(600-640) reveals hidden spike2(700-730) with ~60px/0.2s lead.
  //   Hop it, hop visible spike1(830-860), exit(880).
  //   NEW: icicleHang2 hangs over the whole plat1 ride path - riding stays
  //   60px clear, but jumping while aboard clips it. Ride it, don't hop it.
  {
    name: "Ride or Die",
    deathMsgs: [
      "Patience. The bus comes back.",
      "You jumped into the pit. Impressive.",
      "Two spikes in one commute. Rough.",
      "Why would you jump on the bus?"
    ],
    spawn: { x: 40, y: 440 },
    exit: { x: 880, y: 430 },
    objects: [
      { id: 'floorA', type: 'solid', x: 0, y: 480, w: 300, h: 60 },
      { id: 'floorB', type: 'solid', x: 600, y: 480, w: 360, h: 60 },
      { id: 'plat1', type: 'platform', x: 350, y: 480, w: 80, h: 20,
        path: [{ x: 520, y: 480 }], speed: 120, mode: 'pingpong' },
      { id: 'icicleHang2', type: 'hazard', variant: 'ice', dir: 'down', x: 350, y: 340, w: 170, h: 40 },
      { id: 'spike2', type: 'hazard', variant: 'spikes', dir: 'up', x: 700, y: 460, w: 30, h: 20, hidden: true },
      { id: 'spike1', type: 'hazard', variant: 'spikes', dir: 'up', x: 830, y: 460, w: 30, h: 20 },
      { type: 'trigger', x: 600, y: 380, w: 40, h: 100, once: true, delay: 0,
        actions: [ { do: 'reveal', target: 'spike2' }, { do: 'shake' } ] }
    ]
  },

  // ================= LEVEL 3 =================
  // SOLUTION: hop visible spike0(100-130). Trigger(150-230) reveals
  //   ledgeReal[340,460]+fakePlank[460,540], top=400 (90px gap/80px rise,
  //   <=100 step-up). Cross ledgeReal (icicleHang3 sits 40px above your
  //   head there - don't jump on it), JUMP the 80px span over fakePlank
  //   (never step on it - collapses 0.25s after contact) onto floorB
  //   [540,960] (80px drop). Landing trigger pops hidden spike4(660-690).
  //   Hop it; a second trigger(750) drops iceDrop1 ahead at x=800 (~1.05s
  //   fall) - keep walking, it lands well clear of your path. Exit(880).
  {
    name: "Trust Fall",
    deathMsgs: [
      "It literally told you to wait for it.",
      "The plank was clearly marked 'trust me'.",
      "You had one job: don't step on it.",
      "The ceiling doesn't trust you either."
    ],
    spawn: { x: 40, y: 440 },
    exit: { x: 880, y: 430 },
    objects: [
      { id: 'floorA', type: 'solid', x: 0, y: 480, w: 250, h: 60 },
      { id: 'spike0', type: 'hazard', variant: 'spikes', dir: 'up', x: 100, y: 460, w: 30, h: 20 },
      { id: 'ledgeReal', type: 'solid', x: 340, y: 400, w: 120, h: 140, hidden: true },
      { id: 'icicleHang3', type: 'hazard', variant: 'ice', dir: 'down', x: 340, y: 280, w: 120, h: 40, hidden: true },
      { id: 'fakePlank', type: 'solid', x: 460, y: 400, w: 80, h: 140, hidden: true },
      { id: 'floorB', type: 'solid', x: 540, y: 480, w: 420, h: 60 },
      { id: 'spike4', type: 'hazard', variant: 'spikes', dir: 'up', x: 660, y: 460, w: 30, h: 20, hidden: true },
      { id: 'iceDrop1', type: 'hazard', variant: 'ice', dir: 'down', x: 800, y: 0, w: 40, h: 40, hidden: true },
      { type: 'trigger', x: 150, y: 380, w: 80, h: 100, once: true, delay: 0,
        actions: [ { do: 'reveal', target: 'ledgeReal' }, { do: 'reveal', target: 'fakePlank' }, { do: 'reveal', target: 'icicleHang3' } ] },
      { type: 'trigger', x: 460, y: 360, w: 80, h: 40, once: true, delay: 0.25,
        actions: [ { do: 'hide', target: 'fakePlank' } ] },
      { type: 'trigger', x: 540, y: 380, w: 40, h: 100, once: true, delay: 0,
        actions: [ { do: 'reveal', target: 'spike4' }, { do: 'shake' } ] },
      { type: 'trigger', x: 750, y: 380, w: 40, h: 100, once: true, delay: 0,
        actions: [
          { do: 'reveal', target: 'iceDrop1' }, { do: 'shake' },
          { do: 'move', target: 'iceDrop1', to: { x: 800, y: 440 }, speed: 420 }
        ] }
    ]
  },

  // ================= LEVEL 4 =================
  // SOLUTION: hop spike1(100-130). Ride plat2(230<->400,pingpong) to
  //   floorB[470,850] (0px landing gap). Landing trigger pops hidden
  //   spike_mid(590-620). The obvious door at (680,430) is a DECOY: its
  //   trigger warps you to spawn + opens wall1(770-800). Redo the run
  //   (wall now open); hop spike2(870-900) on the raised exitStep
  //   (step-up 90); icicleHang4 hangs 80px above the step (only a
  //   pointless full jump up there clips it - just walk to the real
  //   exit(920,340)).
  {
    name: "Double Trouble",
    deathMsgs: [
      "One trap wasn't enough for you?",
      "That door lied to your face.",
      "Two spikes AND a fake exit. Ouch.",
      "Icicles now. Great."
    ],
    spawn: { x: 40, y: 440 },
    exit: { x: 920, y: 340 },
    objects: [
      { id: 'floorA', type: 'solid', x: 0, y: 480, w: 200, h: 60 },
      { id: 'spike1', type: 'hazard', variant: 'spikes', dir: 'up', x: 100, y: 460, w: 30, h: 20 },
      { id: 'plat2', type: 'platform', x: 230, y: 480, w: 70, h: 20,
        path: [{ x: 400, y: 480 }], speed: 140, mode: 'pingpong' },
      { id: 'floorB', type: 'solid', x: 470, y: 480, w: 380, h: 60 },
      { id: 'spike_mid', type: 'hazard', variant: 'spikes', dir: 'up', x: 590, y: 460, w: 30, h: 20, hidden: true },
      { id: 'decoy1', type: 'decoy', x: 680, y: 430, w: 30, h: 50 },
      { id: 'wall1', type: 'solid', x: 770, y: 200, w: 30, h: 340 },
      { id: 'exitStep', type: 'solid', x: 850, y: 390, w: 110, h: 150 },
      { id: 'spike2', type: 'hazard', variant: 'spikes', dir: 'up', x: 870, y: 370, w: 30, h: 20 },
      { id: 'icicleHang4', type: 'hazard', variant: 'ice', dir: 'down', x: 850, y: 230, w: 110, h: 40 },
      { type: 'trigger', x: 470, y: 380, w: 40, h: 100, once: true, delay: 0,
        actions: [ { do: 'reveal', target: 'spike_mid' }, { do: 'shake' } ] },
      { type: 'trigger', x: 675, y: 425, w: 40, h: 60, once: true, delay: 0,
        actions: [
          { do: 'warp', to: { x: 40, y: 440 } },
          { do: 'hide', target: 'wall1' },
          { do: 'msg', text: 'Try the other one.' }
        ] }
    ]
  },

  // ================= LEVEL 5 =================
  // SOLUTION: jump the 80px fake1 gap (400-480, never touch it - it hides
  //   0.25s after contact). Landing trigger pops hidden spike_a(600-630).
  //   Trigger at 680 inverts controls 2.5s (just stand still, the pit is
  //   200px behind, totally safe to wait it out). Trigger(710) drops
  //   iceDrop2 ahead at x=750 (~1.05s fall, controls still inverted for
  //   part of it - keep walking forward, it lands well past you). Step up
  //   90px onto ledgeExit(800); hidden spike_b(880-910) pops on arrival.
  //   Exit(925,340).
  {
    name: "False Advertising",
    deathMsgs: [
      "The floor lied. Floors do that now.",
      "Left is right now. Good luck.",
      "It looked so solid, didn't it?",
      "The sky lied too, apparently."
    ],
    spawn: { x: 40, y: 440 },
    exit: { x: 925, y: 340 },
    objects: [
      { id: 'floorA', type: 'solid', x: 0, y: 480, w: 400, h: 60 },
      { id: 'fake1', type: 'solid', x: 400, y: 480, w: 80, h: 60 },
      { id: 'floorB', type: 'solid', x: 480, y: 480, w: 320, h: 60 },
      { id: 'spike_a', type: 'hazard', variant: 'spikes', dir: 'up', x: 600, y: 460, w: 30, h: 20, hidden: true },
      { id: 'iceDrop2', type: 'hazard', variant: 'ice', dir: 'down', x: 750, y: 0, w: 40, h: 40, hidden: true },
      { id: 'ledgeExit', type: 'solid', x: 800, y: 390, w: 160, h: 150 },
      { id: 'spike_b', type: 'hazard', variant: 'spikes', dir: 'up', x: 880, y: 370, w: 30, h: 20, hidden: true },
      { type: 'trigger', x: 400, y: 440, w: 80, h: 40, once: true, delay: 0.25,
        actions: [ { do: 'hide', target: 'fake1' } ] },
      { type: 'trigger', x: 480, y: 380, w: 40, h: 100, once: true, delay: 0,
        actions: [ { do: 'reveal', target: 'spike_a' }, { do: 'shake' } ] },
      { type: 'trigger', x: 680, y: 380, w: 30, h: 100, once: true, delay: 0,
        actions: [ { do: 'invert', duration: 2.5 } ] },
      { type: 'trigger', x: 710, y: 380, w: 30, h: 100, once: true, delay: 0,
        actions: [
          { do: 'reveal', target: 'iceDrop2' }, { do: 'shake' },
          { do: 'move', target: 'iceDrop2', to: { x: 750, y: 440 }, speed: 420 }
        ] },
      { type: 'trigger', x: 800, y: 340, w: 40, h: 100, once: true, delay: 0,
        actions: [ { do: 'reveal', target: 'spike_b' }, { do: 'shake' } ] }
    ]
  },

  // ================= LEVEL 6 =================
  // SOLUTION: single floor. Trigger(250) reveals spikeA(380-420); hop it.
  //   A "wrong answer" trigger(470) warps you back before spikeA to redo
  //   it (harmless 2nd time - it's already revealed). Same pattern again
  //   with spikeB(720-760). Trigger(790) fires the first icicle volley
  //   shot; stop, watch it, hop it. Trigger(850) fires a second icicle
  //   right after - a real volley now, hop that one too. Exit(900).
  {
    name: "Pop Quiz",
    deathMsgs: [
      "Ground shouldn't do that. And yet.",
      "Pop quiz: you failed.",
      "Wrong answer. Try again.",
      "Extra credit question: dodge twice."
    ],
    spawn: { x: 40, y: 440 },
    exit: { x: 900, y: 430 },
    objects: [
      { id: 'floor', type: 'solid', x: 0, y: 480, w: 960, h: 60 },
      { id: 'spikeA', type: 'hazard', variant: 'spikes', dir: 'up', x: 330, y: 460, w: 40, h: 20, hidden: true },
      { id: 'spikeB', type: 'hazard', variant: 'spikes', dir: 'up', x: 630, y: 460, w: 40, h: 20, hidden: true },
      { type: 'trigger', x: 200, y: 380, w: 40, h: 100, once: true, delay: 0,
        actions: [ { do: 'reveal', target: 'spikeA' }, { do: 'shake' } ] },
      { type: 'trigger', x: 410, y: 380, w: 40, h: 100, once: true, delay: 0,
        actions: [ { do: 'warp', to: { x: 190, y: 440 } }, { do: 'msg', text: 'Wrong answer!' } ] },
      { type: 'trigger', x: 500, y: 380, w: 40, h: 100, once: true, delay: 0,
        actions: [ { do: 'reveal', target: 'spikeB' }, { do: 'shake' } ] },
      { type: 'trigger', x: 710, y: 380, w: 40, h: 100, once: true, delay: 0,
        actions: [ { do: 'warp', to: { x: 480, y: 440 } }, { do: 'msg', text: 'Wrong answer again?!' } ] },
      { type: 'trigger', x: 790, y: 380, w: 40, h: 100, once: true, delay: 0.3,
        actions: [ { do: 'shoot', from: { x: 960, y: 450 }, dir: { x: -1, y: 0 }, speed: 480 } ] },
      { type: 'trigger', x: 850, y: 380, w: 40, h: 100, once: true, delay: 0.3,
        actions: [ { do: 'shoot', from: { x: 960, y: 450 }, dir: { x: -1, y: 0 }, speed: 480 } ] }
    ]
  },

  // ================= LEVEL 7 =================
  // SOLUTION: hop spike1(390-420). Enter corridor(480); ceilSpike (now an
  //   icicle cluster) reveals AND slams down (0-440 @450px/s, ~1s) - keep
  //   RUNNING, corridor is only 100px/0.33s wide so a moving player clears
  //   it long before it lands. Trigger(620) pops spikePS(750-790); hop it
  //   and DON'T celebrate-jump - icicleHang7 sits well clear of normal
  //   standing height but a full jump clips it. Trigger(830) makes the exit bolt from
  //   (865,430) up to (925,340) on exitLedge (step-up 90); the same
  //   trigger drops iceDrop3 into the corridor behind you (~1.05s fall) -
  //   you're already past it chasing the door, so just keep going.
  //   NEW: trigger(420, before the ceiling corridor) also pops hidden
  //   spikeMid7(440-465); hop it, then continue into the corridor.
  {
    name: "Commitment Issues",
    deathMsgs: [
      "It's not going to just stand there.",
      "The ceiling has trust issues too.",
      "Relationships take effort.",
      "The ceiling is falling for you. Twice."
    ],
    spawn: { x: 40, y: 440 },
    exit: { x: 865, y: 430 },
    objects: [
      { id: 'floorA', type: 'solid', x: 0, y: 480, w: 250, h: 60 },
      { id: 'floorB', type: 'solid', x: 340, y: 480, w: 560, h: 60 },
      { id: 'spike1', type: 'hazard', variant: 'spikes', dir: 'up', x: 390, y: 460, w: 30, h: 20 },
      { id: 'ceilSpike', type: 'hazard', variant: 'ice', dir: 'down', x: 480, y: 0, w: 100, h: 40, hidden: true },
      { id: 'spikePS', type: 'hazard', variant: 'spikes', dir: 'up', x: 750, y: 460, w: 40, h: 20, hidden: true },
      { id: 'icicleHang7', type: 'hazard', variant: 'ice', dir: 'down', x: 750, y: 280, w: 40, h: 40 },
      { id: 'exitLedge', type: 'solid', x: 900, y: 390, w: 60, h: 150 },
      { id: 'iceDrop3', type: 'hazard', variant: 'ice', dir: 'down', x: 860, y: 0, w: 40, h: 40, hidden: true },
      { id: 'spikeMid7', type: 'hazard', variant: 'spikes', dir: 'up', x: 440, y: 460, w: 25, h: 20, hidden: true },
      { type: 'trigger', x: 420, y: 380, w: 30, h: 100, once: true, delay: 0,
        actions: [ { do: 'reveal', target: 'spikeMid7' }, { do: 'shake' } ] },
      { type: 'trigger', x: 480, y: 380, w: 40, h: 160, once: true, delay: 0,
        actions: [
          { do: 'reveal', target: 'ceilSpike' }, { do: 'shake' },
          { do: 'move', target: 'ceilSpike', to: { x: 480, y: 440 }, speed: 450 }
        ] },
      { type: 'trigger', x: 620, y: 380, w: 40, h: 100, once: true, delay: 0,
        actions: [ { do: 'reveal', target: 'spikePS' }, { do: 'shake' } ] },
      { type: 'trigger', x: 830, y: 380, w: 30, h: 100, once: true, delay: 0,
        actions: [
          { do: 'msg', text: 'Commitment issues, huh?' }, { do: 'shake' },
          { do: 'move', target: 'exit', to: { x: 925, y: 340 }, speed: 500 },
          { do: 'reveal', target: 'iceDrop3' },
          { do: 'move', target: 'iceDrop3', to: { x: 860, y: 440 }, speed: 420 }
        ] }
    ]
  },

  // ================= LEVEL 8 =================
  // SOLUTION: hop spike0(150-180). Mid-air trigger(260) reveals blk2a
  //   [350,460] (90px gap, top=400, 80px rise <=100 OK). Mid-air trigger
  //   (460) reveals blk2b[550,680] (flat 90px gap); icicleHang8 hangs
  //   well clear of blk2b's surface (120px) - land and walk, a full jump
  //   there clips it. Landing trigger pops spikeF(640-670); hop it. Step down
  //   80px onto floorB[680,960]. Trigger(720) fires the first icicle;
  //   stop, watch it, hop it. Trigger(760) fires a second right after -
  //   a volley now. Trigger(800) pops one last hidden spikeExit(850-880);
  //   hop it, exit(880 -> stand just past it).
  {
    name: "Leap of Faith",
    deathMsgs: [
      "Some assembly required. Mid-air.",
      "It WAS there. Eventually.",
      "Faith, footing, and now archery.",
      "One more leap. There's always one more."
    ],
    spawn: { x: 40, y: 440 },
    exit: { x: 900, y: 430 },
    objects: [
      { id: 'floorA', type: 'solid', x: 0, y: 480, w: 260, h: 60 },
      { id: 'spike0', type: 'hazard', variant: 'spikes', dir: 'up', x: 150, y: 460, w: 30, h: 20 },
      { id: 'blk2a', type: 'solid', x: 350, y: 400, w: 110, h: 140, hidden: true },
      { id: 'blk2b', type: 'solid', x: 550, y: 400, w: 130, h: 140, hidden: true },
      { id: 'icicleHang8', type: 'hazard', variant: 'ice', dir: 'down', x: 550, y: 200, w: 130, h: 40, hidden: true },
      { id: 'spikeF', type: 'hazard', variant: 'spikes', dir: 'up', x: 640, y: 380, w: 30, h: 20, hidden: true },
      { id: 'floorB', type: 'solid', x: 680, y: 480, w: 280, h: 60 },
      { id: 'spikeExit', type: 'hazard', variant: 'spikes', dir: 'up', x: 850, y: 460, w: 30, h: 20, hidden: true },
      { type: 'trigger', x: 260, y: 340, w: 90, h: 140, once: true, delay: 0.1,
        actions: [ { do: 'reveal', target: 'blk2a' }, { do: 'shake' } ] },
      { type: 'trigger', x: 460, y: 260, w: 90, h: 140, once: true, delay: 0.1,
        actions: [ { do: 'reveal', target: 'blk2b' }, { do: 'reveal', target: 'icicleHang8' }, { do: 'shake' } ] },
      { type: 'trigger', x: 550, y: 340, w: 40, h: 100, once: true, delay: 0,
        actions: [ { do: 'reveal', target: 'spikeF' }, { do: 'shake' } ] },
      { type: 'trigger', x: 720, y: 380, w: 40, h: 150, once: true, delay: 0.3,
        actions: [ { do: 'shoot', from: { x: 960, y: 450 }, dir: { x: -1, y: 0 }, speed: 480 } ] },
      { type: 'trigger', x: 760, y: 380, w: 40, h: 150, once: true, delay: 0.3,
        actions: [ { do: 'shoot', from: { x: 960, y: 450 }, dir: { x: -1, y: 0 }, speed: 480 } ] },
      { type: 'trigger', x: 800, y: 380, w: 40, h: 100, once: true, delay: 0,
        actions: [ { do: 'reveal', target: 'spikeExit' }, { do: 'shake' } ] }
    ]
  },

  // ================= LEVEL 9 =================
  // SOLUTION: trigger(80) pops spike0(170-200); hop it. Trigger(230) warps
  //   you back before it to redo the hop. icicleHang9 hangs over the
  //   whole bridge (100px clearance while standing/running) - the bridge
  //   b1-b3[300,700] (400px) collapses 1.8s after the "RUN!" msg - cross
  //   in 1.33s, 0.47s margin, and don't jump on the way (icicles). Landing
  //   trigger(700) pops spikeQ(800-830); hop it. Trigger(835) drops
  //   iceDrop4 ahead at x=845 (~1.05s fall) - keep walking, it lands
  //   behind you. Trigger(870) shoots an arrow - stop, watch, hop. Exit(900).
  {
    name: "Floor It",
    deathMsgs: [
      "The floor said its goodbyes.",
      "Should've floored it sooner.",
      "Walking leisurely: a fatal hobby.",
      "Icy AND collapsing. Efficient."
    ],
    spawn: { x: 40, y: 440 },
    exit: { x: 900, y: 430 },
    objects: [
      { id: 'floorA', type: 'solid', x: 0, y: 480, w: 300, h: 60 },
      { id: 'spike0', type: 'hazard', variant: 'spikes', dir: 'up', x: 170, y: 460, w: 30, h: 20, hidden: true },
      { id: 'b1', type: 'solid', x: 300, y: 480, w: 100, h: 60 },
      { id: 'b2', type: 'solid', x: 400, y: 480, w: 100, h: 60 },
      { id: 'b3', type: 'solid', x: 500, y: 480, w: 200, h: 60 },
      { id: 'icicleHang9', type: 'hazard', variant: 'ice', dir: 'down', x: 300, y: 300, w: 400, h: 40 },
      { id: 'floorB', type: 'solid', x: 700, y: 480, w: 260, h: 60 },
      { id: 'spikeQ', type: 'hazard', variant: 'spikes', dir: 'up', x: 800, y: 460, w: 30, h: 20, hidden: true },
      { id: 'iceDrop4', type: 'hazard', variant: 'ice', dir: 'down', x: 845, y: 0, w: 30, h: 40, hidden: true },
      { type: 'trigger', x: 80, y: 380, w: 30, h: 100, once: true, delay: 0,
        actions: [ { do: 'reveal', target: 'spike0' }, { do: 'shake' } ] },
      { type: 'trigger', x: 230, y: 380, w: 30, h: 100, once: true, delay: 0,
        actions: [ { do: 'warp', to: { x: 60, y: 440 } }, { do: 'msg', text: 'Back to the starting line.' } ] },
      { type: 'trigger', x: 300, y: 440, w: 20, h: 40, once: true, delay: 0,
        actions: [ { do: 'msg', text: 'RUN!' } ] },
      { type: 'trigger', x: 300, y: 440, w: 20, h: 40, once: true, delay: 1.8,
        actions: [ { do: 'shake' }, { do: 'hide', target: 'b1' }, { do: 'hide', target: 'b2' }, { do: 'hide', target: 'b3' } ] },
      { type: 'trigger', x: 700, y: 380, w: 30, h: 100, once: true, delay: 0,
        actions: [ { do: 'reveal', target: 'spikeQ' }, { do: 'shake' } ] },
      { type: 'trigger', x: 835, y: 380, w: 30, h: 100, once: true, delay: 0,
        actions: [
          { do: 'reveal', target: 'iceDrop4' }, { do: 'shake' },
          { do: 'move', target: 'iceDrop4', to: { x: 845, y: 440 }, speed: 420 }
        ] },
      { type: 'trigger', x: 870, y: 380, w: 40, h: 110, once: true, delay: 0.3,
        actions: [ { do: 'shoot', from: { x: 960, y: 450 }, dir: { x: -1, y: 0 }, speed: 480 } ] }
    ]
  },

  // ================= LEVEL 10 =================
  // SOLUTION (finale, chains 7): jump 150px gap(<=170, tightest);
  //   icicleHang10 hangs above the gap with 67px clearance over the
  //   jump's apex - the necessary jump clears it easily. Landing trigger
  //   pops spike1
  //   (490-520); hop it. Trigger(520) starts crusher (600-680 corridor,
  //   80px @550px/s, true pin vs floor) - wait for it to retract, dash
  //   through (0.27s, far under its ~1.16s safe window). Trigger(700)
  //   pops spike3(790-820); hop it. Trigger(820) fires the first icicle -
  //   stop, watch, hop. Trigger(850) fires a second right after (a
  //   volley, same spot, same rules) - both still on floorB, before the
  //   step-up jump. Step up 80px; trigger drops a falling ceiling icicle
  //   toward the final step (keep moving, it's a 0.75s fall vs your
  //   0.13s crossing). Exit(920,350).
  {
    name: "No More Mr. Nice Level",
    deathMsgs: [
      "This is the tutorial's revenge.",
      "Should've brought a shield.",
      "The gauntlet does not negotiate.",
      "Squeezed. Like a lemon.",
      "The ice never even had to warn you."
    ],
    spawn: { x: 40, y: 440 },
    exit: { x: 920, y: 350 },
    objects: [
      { id: 'floorA', type: 'solid', x: 0, y: 480, w: 250, h: 60 },
      { id: 'floorB', type: 'solid', x: 400, y: 480, w: 480, h: 60 },
      { id: 'icicleHang10', type: 'hazard', variant: 'ice', dir: 'down', x: 250, y: 200, w: 150, h: 40 },
      { id: 'spike1', type: 'hazard', variant: 'spikes', dir: 'up', x: 490, y: 460, w: 30, h: 20, hidden: true },
      { id: 'crusher', type: 'platform', x: 600, y: 80, w: 80, h: 40,
        path: [{ x: 600, y: 440 }], speed: 550, mode: 'pingpong', startOnTrigger: true, hidden: true },
      { id: 'spike3', type: 'hazard', variant: 'spikes', dir: 'up', x: 790, y: 460, w: 30, h: 20, hidden: true },
      { id: 'finalStep', type: 'solid', x: 880, y: 400, w: 80, h: 140 },
      { id: 'ceilFinal', type: 'hazard', variant: 'ice', dir: 'down', x: 890, y: 0, w: 50, h: 40, hidden: true },
      { type: 'trigger', x: 400, y: 380, w: 40, h: 100, once: true, delay: 0,
        actions: [ { do: 'reveal', target: 'spike1' }, { do: 'shake' } ] },
      { type: 'trigger', x: 520, y: 380, w: 40, h: 100, once: true, delay: 0,
        actions: [ { do: 'reveal', target: 'crusher' }, { do: 'start', target: 'crusher' }, { do: 'shake' } ] },
      { type: 'trigger', x: 700, y: 380, w: 40, h: 100, once: true, delay: 0,
        actions: [ { do: 'reveal', target: 'spike3' }, { do: 'shake' } ] },
      { type: 'trigger', x: 820, y: 380, w: 30, h: 100, once: true, delay: 0.3,
        actions: [ { do: 'shoot', from: { x: 960, y: 450 }, dir: { x: -1, y: 0 }, speed: 500 } ] },
      { type: 'trigger', x: 850, y: 380, w: 30, h: 100, once: true, delay: 0.3,
        actions: [ { do: 'shoot', from: { x: 960, y: 450 }, dir: { x: -1, y: 0 }, speed: 500 } ] },
      { type: 'trigger', x: 880, y: 260, w: 30, h: 180, once: true, delay: 0,
        actions: [
          { do: 'reveal', target: 'ceilFinal' }, { do: 'shake' },
          { do: 'move', target: 'ceilFinal', to: { x: 890, y: 360 }, speed: 480 }
        ] }
    ]
  }

];
