// js/levels_d.js — Levels 31-40 (chapter 7: sky theme, one-way + wind debut;
// chapter 8: temple theme, buttons/doors/keys + fakeclear debut). Plain
// script, no modules. Defines window.LEVELS_D per SPEC.md v3 level format.
//
// New-mechanic semantics used throughout this file (agreed with engine,
// identical to the engine's own implementation — see SPEC.md wave-2 section):
//   - oneway {x,y,w,h~12}: solid ONLY when the player lands on it from above
//     (falling onto its top surface); passes through freely from below/sides.
//     Down+Jump while standing on one drops the player through it. Practical
//     effect: jumping UP into a oneway platform below your apex just clips
//     through harmlessly, then you fall back down and land on it naturally —
//     so any rise well under the ~133px max apex (we use 90px) is always
//     catchable, giving close to the FULL ~0.5-0.6s+ of airtime to drift
//     sideways (we keep horizontal shifts <=140px, comfortably inside that).
//   - wind {x,y,w,h,fx,fy?}: constant acceleration while overlapping; ALWAYS
//     applies in the air, only applies on the ground if |fx|>400. The
//     wind's own contribution to vx saturates at +-250px/s (added on top of
//     the player's own 300px/s input-driven vx). Because the accumulated
//     push ramps up over time (dv=fx*dt) rather than snapping instantly,
//     SHORT gaps (<=120px) are barely slowed even under a full headwind
//     (worst-case still crossable in well under normal jump airtime), while
//     LONGER pushes compound — so every wind level here keeps pit widths
//     modest (<=120px) regardless of wind direction, and reserves the
//     "shifts jump arcs" teaching moment for tailwind OVERSHOOT (extra
//     horizontal distance = safety margin problem, not a hard-fail one) and
//     for genuinely-grounded gusts (|fx|>=500, which DO shove you even while
//     walking — the "hidden hardware" surprise). All wind traps keep >=30px
//     clearance and >=0.25s reveal-to-danger lead per the fairness rules.
//   - button {id,x,y,w:30,h:10,once?,actions}: press-edge fire (stand/touch);
//     re-arms when left unless once:true.
//   - door {id,x,y,w,h}: solid gate. action {do:'open',target,duration}
//     hides it for `duration` seconds then it SLAMS back solid — if the
//     player is still inside its rect, that's a crush death. Every timed
//     door here keeps the REQUIRED crossing time to well under 60% of its
//     duration (SPEC: 3s door @300px/s crosses 900px, so <=540px/<=1.8s of
//     actual need), leaving generous learn-it-once slack.
//   - key {id,x,y,w:24,h:24}: collected on touch, per-life (resets on
//     death). lock {id,x,y,w,h}: solid; touching with a collected key
//     consumes the key and removes the lock.
//   - {do:'fakeclear'}: shows the real LEVEL CLEAR overlay pixel-identically
//     for ~1.2s then rips it away — level continues, control retained. Used
//     EXACTLY ONCE across this whole file, on the L39 decoy door, and only
//     ever fires the first time it's touched.
//
// Geometry conventions (same as levels_a/b/c): ground floors y=480,h=60
// (top surface y=480); standing player top-left y=440 (feet at 480); exit
// door 30w x 50h sits flush (door y = local floor/platform top - 50).
// Jump metrics per SPEC.md: step-up <=100px, flat gap <=170px, hop <=150px.

window.LEVELS_D = [

  // ================= LEVEL 31 =================
  // SOLUTION (oneway intro, vertical ascent): floor0[0,170], hop
  //   spikeGround0(90, hidden-reveal). Jump up onto p1 (rise 90<=100,
  //   trivial) - spikeLanding pops the instant you're airborne toward it
  //   (~90px/0.3s lead) - hop it on landing. Jump p1->p2 (rise90, shift
  //   +140, well inside a oneway's forgiving pass-through-then-catch
  //   window). Jump p2->p3 (rise90, shift -140), LAND near p3's LEFT edge
  //   (x150-230) - the instant you're standing there a wide icicle telegraphs
  //   (0.3s lead) and slams down covering that whole landing patch: press
  //   Down+Jump to drop THROUGH p3 back onto p2 (harmless 90px fall), then
  //   re-jump aiming for p3's clear RIGHT portion (x260-340, past the
  //   icicle) and continue. Jump p3->p4 (rise90, shift +60 from the clear
  //   zone). spikeTop pops on p4 (~50px/0.25s lead) - hop it, exit@440.
  {
    name: "One Way Up",
    theme: 'sky',
    deathMsgs: [
      "Down + Jump. Not just down.",
      "You forgot which way was through.",
      "Gravity remembered you."
    ],
    spawn: { x: 40, y: 440 },
    exit: { x: 440, y: 70 },
    objects: [
      { id: 'floor0', type: 'solid', x: 0, y: 480, w: 170, h: 60 },
      { id: 'spikeGround0', type: 'hazard', variant: 'spikes', dir: 'up', x: 90, y: 460, w: 30, h: 20, hidden: true },
      { type: 'trigger', x: 50, y: 380, w: 20, h: 100, once: true, delay: 0,
        actions: [ { do: 'reveal', target: 'spikeGround0' }, { do: 'shake' } ] },

      { id: 'p1', type: 'oneway', x: 140, y: 390, w: 160, h: 12 },
      { id: 'spikeLanding', type: 'hazard', variant: 'spikes', dir: 'up', x: 200, y: 370, w: 30, h: 20, hidden: true },
      { type: 'trigger', x: 150, y: 390, w: 40, h: 90, once: true, delay: 0,
        actions: [ { do: 'reveal', target: 'spikeLanding' }, { do: 'shake' } ] },

      { id: 'p2', type: 'oneway', x: 280, y: 300, w: 160, h: 12 },

      { id: 'p3', type: 'oneway', x: 140, y: 210, w: 200, h: 12 },
      { id: 'ceilDecorIce', type: 'decor', variant: 'ceiling', x: 150, y: 140, w: 90, h: 20 },
      { id: 'icicleDrop', type: 'hazard', variant: 'ice', dir: 'down', x: 150, y: 165, w: 80, h: 20, hidden: true },
      { type: 'trigger', x: 140, y: 170, w: 200, h: 40, once: true, delay: 0.3,
        actions: [ { do: 'reveal', target: 'icicleDrop' }, { do: 'move', target: 'icicleDrop', to: { x: 150, y: 190 }, speed: 600 }, { do: 'shake' } ] },

      { id: 'p4', type: 'oneway', x: 320, y: 120, w: 160, h: 12 },
      { id: 'spikeTop', type: 'hazard', variant: 'spikes', dir: 'up', x: 380, y: 100, w: 30, h: 20, hidden: true },
      { type: 'trigger', x: 260, y: 120, w: 100, h: 90, once: true, delay: 0,
        actions: [ { do: 'reveal', target: 'spikeTop' }, { do: 'shake' } ] },

      { id: 'rocks1', type: 'decor', variant: 'rocks', x: 40, y: 450, w: 20, h: 30 },
      { id: 'crystal1', type: 'decor', variant: 'crystal', x: 460, y: 100, w: 15, h: 20 }
    ]
  },

  // ================= LEVEL 32 =================
  // SOLUTION (wind intro): floor0[0,200], hop spike0(110, hidden-reveal).
  //   Jump pit1(200-300,100px) - windZone1 is a steady TAILWIND (fx+300,
  //   always visible) that carries you a bit further than a normal jump; a
  //   hidden spikeOvershoot sits just past the normal landing spot and pops
  //   mid-air (~90px/0.3s lead) - hop it on arrival. FloorC(580-720) LOOKS
  //   like a mild breeze (fx300, visible) but its back half hides a
  //   stronger fx500 gust (>=400 threshold = it shoves you even while
  //   GROUNDED) that reveals as you cross - on repeat, jump for pit3 the
  //   moment it kicks in instead of walking, using the shove to clear the
  //   small 80px gap; a hidden spike4 waits on the far floor (~50px/0.25s
  //   lead after landing) - hop it, exit@920.
  {
    name: "The Breeze Lied",
    theme: 'sky',
    deathMsgs: [
      "That was a gust, not a breeze.",
      "You should've braced.",
      "The wind had plans for you."
    ],
    spawn: { x: 40, y: 440 },
    exit: { x: 920, y: 430 },
    objects: [
      { id: 'floor0', type: 'solid', x: 0, y: 480, w: 200, h: 60 },
      { id: 'spike0', type: 'hazard', variant: 'spikes', dir: 'up', x: 110, y: 460, w: 30, h: 20, hidden: true },
      { type: 'trigger', x: 50, y: 380, w: 20, h: 100, once: true, delay: 0,
        actions: [ { do: 'reveal', target: 'spike0' }, { do: 'shake' } ] },

      // pit1 200-300 (100px). windZone1 tailwind assist over the jump.
      { id: 'windZone1', type: 'wind', x: 190, y: 300, w: 120, h: 180, fx: 300 },
      { id: 'floorB', type: 'solid', x: 300, y: 480, w: 200, h: 60 },
      { id: 'spikeOvershoot', type: 'hazard', variant: 'spikes', dir: 'up', x: 340, y: 460, w: 30, h: 20, hidden: true },
      { type: 'trigger', x: 210, y: 300, w: 100, h: 180, once: true, delay: 0,
        actions: [ { do: 'reveal', target: 'spikeOvershoot' }, { do: 'shake' } ] },

      { id: 'floorC', type: 'solid', x: 580, y: 480, w: 140, h: 60 },
      { id: 'windMild', type: 'wind', x: 580, y: 300, w: 70, h: 180, fx: 300 },
      { id: 'windGust', type: 'wind', x: 650, y: 300, w: 70, h: 180, fx: 500, hidden: true },
      { type: 'trigger', x: 650, y: 380, w: 20, h: 100, once: true, delay: 0,
        actions: [ { do: 'reveal', target: 'windGust' }, { do: 'shake' }, { do: 'msg', text: 'The breeze lied.' } ] },

      // pit3 720-800 (80px, small - the gust helps clear it once revealed).
      { id: 'floorD', type: 'solid', x: 800, y: 480, w: 160, h: 60 },
      { id: 'spike4', type: 'hazard', variant: 'spikes', dir: 'up', x: 850, y: 460, w: 30, h: 20, hidden: true },
      { type: 'trigger', x: 800, y: 380, w: 20, h: 100, once: true, delay: 0,
        actions: [ { do: 'reveal', target: 'spike4' }, { do: 'shake' } ] },

      { id: 'rocks1', type: 'decor', variant: 'rocks', x: 60, y: 450, w: 20, h: 30 },
      { id: 'crystal1', type: 'decor', variant: 'crystal', x: 900, y: 450, w: 15, h: 20 }
    ]
  },

  // ================= LEVEL 33 =================
  // SOLUTION (oneway + wind combo): floor0[0,180], hop spike0(100). Jump
  //   pit1(180-260,80px) under a HEADWIND (fx-300, visible) - hold right
  //   firmly, an 80px gap crosses in well under a normal jump even fighting
  //   it. spikeB pops mid-air (~40px/0.25s lead) on floorB - hop it. Jump
  //   pit2(460-560,100px) under a TAILWIND (fx+300) - it carries you
  //   further than expected; spikeC (overshoot) pops mid-air - hop it on
  //   floorC. Board a 3-rung oneway ladder INSIDE a persistent crosswind
  //   (fx+250, always visible): oneA(rise90,shift+60, wind assists),
  //   oneB(rise90,shift-150, wind now FIGHTS this leftward jump - hold left
  //   firmly), spikeOneB pops the instant you land on oneB (~40px/0.25s
  //   lead) - hop it. floorTop(rise90,shift-50): hiddenTop pops on arrival
  //   (~60px/0.25s lead) - hop it, exit@700.
  {
    name: "Crosswinds and Consequences",
    theme: 'sky',
    deathMsgs: [
      "The wind doesn't care which way you're jumping.",
      "You let go too soon.",
      "That gust had your name on it."
    ],
    spawn: { x: 40, y: 440 },
    exit: { x: 700, y: 160 },
    objects: [
      { id: 'floor0', type: 'solid', x: 0, y: 480, w: 180, h: 60 },
      { id: 'spike0', type: 'hazard', variant: 'spikes', dir: 'up', x: 100, y: 460, w: 30, h: 20, hidden: true },
      { type: 'trigger', x: 50, y: 380, w: 20, h: 100, once: true, delay: 0,
        actions: [ { do: 'reveal', target: 'spike0' }, { do: 'shake' } ] },

      // pit1 180-260 (80px) headwind fight.
      { id: 'windHead1', type: 'wind', x: 170, y: 300, w: 100, h: 180, fx: -300 },
      { id: 'floorB', type: 'solid', x: 260, y: 480, w: 200, h: 60 },
      { id: 'spikeB', type: 'hazard', variant: 'spikes', dir: 'up', x: 300, y: 460, w: 30, h: 20, hidden: true },
      { type: 'trigger', x: 190, y: 300, w: 100, h: 180, once: true, delay: 0,
        actions: [ { do: 'reveal', target: 'spikeB' }, { do: 'shake' } ] },

      // pit2 460-560 (100px) tailwind overshoot.
      { id: 'windTail1', type: 'wind', x: 450, y: 300, w: 120, h: 180, fx: 300 },
      { id: 'floorC', type: 'solid', x: 560, y: 480, w: 140, h: 60 },
      { id: 'spikeC', type: 'hazard', variant: 'spikes', dir: 'up', x: 610, y: 460, w: 30, h: 20, hidden: true },
      { type: 'trigger', x: 470, y: 300, w: 120, h: 180, once: true, delay: 0,
        actions: [ { do: 'reveal', target: 'spikeC' }, { do: 'shake' } ] },

      // oneway ladder in a persistent crosswind.
      { id: 'crosswindLadder', type: 'wind', x: 560, y: 180, w: 350, h: 300, fx: 250 },
      { id: 'oneA', type: 'oneway', x: 760, y: 390, w: 150, h: 12 },
      { id: 'oneB', type: 'oneway', x: 610, y: 300, w: 150, h: 12 },
      { id: 'spikeOneB', type: 'hazard', variant: 'spikes', dir: 'up', x: 660, y: 280, w: 30, h: 20, hidden: true },
      { type: 'trigger', x: 610, y: 280, w: 150, h: 40, once: true, delay: 0,
        actions: [ { do: 'reveal', target: 'spikeOneB' }, { do: 'shake' } ] },

      { id: 'floorTop', type: 'solid', x: 560, y: 210, w: 250, h: 60 },
      { id: 'spikeTop2', type: 'hazard', variant: 'spikes', dir: 'up', x: 650, y: 190, w: 30, h: 20, hidden: true },
      { type: 'trigger', x: 610, y: 210, w: 100, h: 90, once: true, delay: 0,
        actions: [ { do: 'reveal', target: 'spikeTop2' }, { do: 'shake' } ] },

      { id: 'rocks1', type: 'decor', variant: 'rocks', x: 60, y: 450, w: 20, h: 30 },
      { id: 'crystal1', type: 'decor', variant: 'crystal', x: 600, y: 180, w: 15, h: 20 }
    ]
  },

  // ================= LEVEL 34 =================
  // SOLUTION (wind + old kit): floor0[0,200], hop spikeD(110). Enter the
  //   corridor(200-500) under a steady tailwind (fx300, visible) - two
  //   icicle volleys fire from the right at ankle height (0.4s / 0.6s
  //   leads) - jump both. floor2[500,600]: hop spikeD2(520, hidden) before
  //   boarding spring1. Spring launches ~275px up (~0.48s to apex, ~0.96s
  //   total air) with the tailwind ADDING to your drift (up to +250px/s
  //   capped) - easily clears pit4(600-830,230px) but overshoots the
  //   "normal" landing; spikeOvershoot2 telegraphs mid-flight (~0.4s+ lead)
  //   - hop it on landing, exit@920.
  {
    name: "Tailwind, Meet Overshoot",
    theme: 'sky',
    deathMsgs: [
      "The wind carried you further than the spring did.",
      "Overshoot, much?",
      "Icicles don't care about tailwinds."
    ],
    spawn: { x: 40, y: 440 },
    exit: { x: 920, y: 430 },
    objects: [
      { id: 'floor0', type: 'solid', x: 0, y: 480, w: 200, h: 60 },
      { id: 'spikeD', type: 'hazard', variant: 'spikes', dir: 'up', x: 110, y: 460, w: 30, h: 20, hidden: true },
      { type: 'trigger', x: 50, y: 380, w: 20, h: 100, once: true, delay: 0,
        actions: [ { do: 'reveal', target: 'spikeD' }, { do: 'shake' } ] },

      { id: 'floor1', type: 'solid', x: 200, y: 480, w: 300, h: 60 },
      { id: 'windCorridor', type: 'wind', x: 200, y: 300, w: 300, h: 180, fx: 300 },
      { type: 'trigger', x: 220, y: 380, w: 20, h: 100, once: true, delay: 0.4,
        actions: [ { do: 'shoot', from: { x: 500, y: 460 }, dir: { x: -1, y: 0 }, speed: 300 }, { do: 'shake' } ] },
      { type: 'trigger', x: 350, y: 380, w: 20, h: 100, once: true, delay: 0.6,
        actions: [ { do: 'shoot', from: { x: 500, y: 460 }, dir: { x: -1, y: 0 }, speed: 300 }, { do: 'shake' } ] },

      { id: 'floor2', type: 'solid', x: 500, y: 480, w: 100, h: 60 },
      { id: 'spikeD2', type: 'hazard', variant: 'spikes', dir: 'up', x: 520, y: 460, w: 30, h: 20, hidden: true },
      { type: 'trigger', x: 480, y: 380, w: 20, h: 100, once: true, delay: 0,
        actions: [ { do: 'reveal', target: 'spikeD2' }, { do: 'shake' } ] },
      { id: 'spring1', type: 'spring', x: 560, y: 468, w: 40, h: 12 },

      // pit4 600-830 (230px, trivial for a spring launch even without wind).
      { id: 'windTail2', type: 'wind', x: 550, y: 100, w: 350, h: 380, fx: 300 },
      { id: 'floor3', type: 'solid', x: 830, y: 480, w: 130, h: 60 },
      { id: 'spikeOvershoot2', type: 'hazard', variant: 'spikes', dir: 'up', x: 880, y: 460, w: 30, h: 20, hidden: true },
      { type: 'trigger', x: 700, y: 100, w: 200, h: 380, once: true, delay: 0,
        actions: [ { do: 'reveal', target: 'spikeOvershoot2' }, { do: 'shake' } ] },

      { id: 'rocks1', type: 'decor', variant: 'rocks', x: 60, y: 450, w: 20, h: 30 },
      { id: 'crystal1', type: 'decor', variant: 'crystal', x: 900, y: 450, w: 15, h: 20 }
    ]
  },

  // ================= LEVEL 35 =================
  // SOLUTION (ch7 climax - gauntlet + chasing gust): floor0[0,200], hop
  //   spike0(110). Jump pit1(200-320,120px, tailwind fx300) - spikeLanding2
  //   pops mid-air on floor1 - hop it. Crossing x480 reveals a wide
  //   fx500 CHASING gust spanning the whole ascent ahead (>=400 threshold
  //   shoves you even grounded - no going back, only forward): race up the
  //   3-rung oneway ladder (each rise90). spikeOneB2 pops the instant you
  //   land on oneB2 (~0.25s lead) - hop it mid-race. Standing on oneC, a
  //   wide icicle telegraphs (0.3s lead) over the LEFT landing patch - drop
  //   through (Down+Jump) to oneB2, then relaunch for oneC's clear right
  //   portion. spikeTop3 pops on floorTop right before the door (~0.25s
  //   lead, "don't relax") - hop it, exit@600.
  {
    name: "Outrun the Wind",
    theme: 'sky',
    deathMsgs: [
      "It caught you.",
      "You can't outwalk a gust that fast.",
      "So close to the top, too."
    ],
    spawn: { x: 40, y: 440 },
    exit: { x: 600, y: 70 },
    objects: [
      { id: 'floor0', type: 'solid', x: 0, y: 480, w: 200, h: 60 },
      { id: 'spike0', type: 'hazard', variant: 'spikes', dir: 'up', x: 110, y: 460, w: 30, h: 20, hidden: true },
      { type: 'trigger', x: 50, y: 380, w: 20, h: 100, once: true, delay: 0,
        actions: [ { do: 'reveal', target: 'spike0' }, { do: 'shake' } ] },

      // pit1 200-320 (120px) mild tailwind.
      { id: 'windTail3', type: 'wind', x: 190, y: 300, w: 140, h: 180, fx: 300 },
      { id: 'floor1', type: 'solid', x: 320, y: 480, w: 200, h: 60 },
      { id: 'spikeLanding2', type: 'hazard', variant: 'spikes', dir: 'up', x: 360, y: 460, w: 30, h: 20, hidden: true },
      { type: 'trigger', x: 210, y: 300, w: 120, h: 180, once: true, delay: 0,
        actions: [ { do: 'reveal', target: 'spikeLanding2' }, { do: 'shake' } ] },

      // The chasing gust: hidden until you cross x480, then it covers the
      // WHOLE ascent ahead and shoves forward even on the ground (fx500).
      { id: 'chaseGust', type: 'wind', x: 480, y: 100, w: 480, h: 400, fx: 500, hidden: true },
      { type: 'trigger', x: 480, y: 380, w: 20, h: 100, once: true, delay: 0,
        actions: [ { do: 'reveal', target: 'chaseGust' }, { do: 'shake' }, { do: 'msg', text: 'Outrun it.' } ] },

      { id: 'oneA2', type: 'oneway', x: 560, y: 390, w: 150, h: 12 },
      { id: 'oneB2', type: 'oneway', x: 480, y: 300, w: 150, h: 12 },
      { id: 'spikeOneB2', type: 'hazard', variant: 'spikes', dir: 'up', x: 520, y: 280, w: 30, h: 20, hidden: true },
      { type: 'trigger', x: 480, y: 280, w: 150, h: 40, once: true, delay: 0,
        actions: [ { do: 'reveal', target: 'spikeOneB2' }, { do: 'shake' } ] },

      { id: 'oneC', type: 'oneway', x: 560, y: 210, w: 180, h: 12 },
      { id: 'ceilDecorC', type: 'decor', variant: 'ceiling', x: 570, y: 140, w: 100, h: 20 },
      { id: 'icicleC', type: 'hazard', variant: 'ice', dir: 'down', x: 570, y: 165, w: 90, h: 20, hidden: true },
      { type: 'trigger', x: 560, y: 170, w: 180, h: 40, once: true, delay: 0.3,
        actions: [ { do: 'reveal', target: 'icicleC' }, { do: 'move', target: 'icicleC', to: { x: 570, y: 190 }, speed: 600 }, { do: 'shake' } ] },

      { id: 'floorTop2', type: 'solid', x: 520, y: 120, w: 220, h: 60 },
      { id: 'spikeTop3', type: 'hazard', variant: 'spikes', dir: 'up', x: 560, y: 100, w: 30, h: 20, hidden: true },
      { type: 'trigger', x: 560, y: 120, w: 100, h: 90, once: true, delay: 0,
        actions: [ { do: 'reveal', target: 'spikeTop3' }, { do: 'shake' } ] },

      { id: 'rocks1', type: 'decor', variant: 'rocks', x: 60, y: 450, w: 20, h: 30 },
      { id: 'crystal1', type: 'decor', variant: 'crystal', x: 700, y: 120, w: 15, h: 20 }
    ]
  },

  // ================= LEVEL 36 =================
  // SOLUTION (button + timed door intro): floor is one continuous strip.
  //   Hop spikeStart(90). Press button1(180) - opens door1(420) for 3s.
  //   Hop spikeMid(300, ~120px/0.4s lead) en route - total crossing time
  //   well under 1s, door1's 3s budget allows up to 1.8s (60%), huge slack.
  //   Through the door, hop spikeAfter(480, immediate). Hop spikeEnd(700).
  //   Exit@900. NOTE: everything resets on death, including the button and
  //   door - if you don't make it through in time, walk back and press
  //   button1 again from scratch.
  {
    name: "Mind the Timer",
    theme: 'temple',
    deathMsgs: [
      "The door doesn't wait for you.",
      "Should've pressed it again.",
      "Timing is a skill. Acquire it."
    ],
    spawn: { x: 40, y: 440 },
    exit: { x: 900, y: 430 },
    objects: [
      { id: 'floor', type: 'solid', x: 0, y: 480, w: 960, h: 60 },
      { id: 'spikeStart', type: 'hazard', variant: 'spikes', dir: 'up', x: 90, y: 460, w: 30, h: 20, hidden: true },
      { type: 'trigger', x: 50, y: 380, w: 20, h: 100, once: true, delay: 0,
        actions: [ { do: 'reveal', target: 'spikeStart' }, { do: 'shake' } ] },

      { id: 'button1', type: 'button', x: 180, y: 470, w: 30, h: 10,
        actions: [ { do: 'open', target: 'door1', duration: 3 } ] },
      { id: 'spikeMid', type: 'hazard', variant: 'spikes', dir: 'up', x: 300, y: 460, w: 30, h: 20, hidden: true },
      { type: 'trigger', x: 260, y: 380, w: 20, h: 100, once: true, delay: 0,
        actions: [ { do: 'reveal', target: 'spikeMid' }, { do: 'shake' } ] },
      { id: 'door1', type: 'door', x: 420, y: 380, w: 20, h: 100 },

      { id: 'spikeAfter', type: 'hazard', variant: 'spikes', dir: 'up', x: 480, y: 460, w: 30, h: 20, hidden: true },
      { type: 'trigger', x: 440, y: 380, w: 20, h: 100, once: true, delay: 0,
        actions: [ { do: 'reveal', target: 'spikeAfter' }, { do: 'shake' } ] },
      { id: 'spikeEnd', type: 'hazard', variant: 'spikes', dir: 'up', x: 700, y: 460, w: 30, h: 20, hidden: true },
      { type: 'trigger', x: 650, y: 380, w: 20, h: 100, once: true, delay: 0,
        actions: [ { do: 'reveal', target: 'spikeEnd' }, { do: 'shake' } ] },

      { id: 'lintel1', type: 'decor', variant: 'ceiling', x: 405, y: 340, w: 50, h: 30 },
      { id: 'pillar1', type: 'decor', variant: 'rocks', x: 60, y: 450, w: 20, h: 30 },
      { id: 'pillar2', type: 'decor', variant: 'rocks', x: 820, y: 450, w: 20, h: 30 }
    ]
  },

  // ================= LEVEL 37 =================
  // SOLUTION (key + lock intro): floor is one continuous strip. Hop
  //   spikeStart(90). At x260-400 a keyPlat floats 60px above the floor
  //   (easy step-up) holding key1 - jump up, grab it. spikeOnKeyPlat pops
  //   the instant you land up there (~0.2s lead) - hop it. THE TRAP: skip
  //   the jump and just walk the ground under the platform instead and
  //   spikeShortcut pops (~0.3s lead, no key gained, pure punishment) -
  //   always take the detour up. Back on the ground, hop spikeBeforeLock
  //   (560). Touch lock1(600) with the key to open it. Hop spikeAfterLock
  //   (700, immediate - don't relax). Exit@900.
  {
    name: "The Shortcut Isn't",
    theme: 'temple',
    deathMsgs: [
      "The shortcut wasn't. It never is.",
      "No key, no door. Rookie mistake.",
      "That ledge was bait."
    ],
    spawn: { x: 40, y: 440 },
    exit: { x: 900, y: 430 },
    objects: [
      { id: 'floor', type: 'solid', x: 0, y: 480, w: 960, h: 60 },
      { id: 'spikeStart', type: 'hazard', variant: 'spikes', dir: 'up', x: 90, y: 460, w: 30, h: 20, hidden: true },
      { type: 'trigger', x: 50, y: 380, w: 20, h: 100, once: true, delay: 0,
        actions: [ { do: 'reveal', target: 'spikeStart' }, { do: 'shake' } ] },

      { id: 'keyPlat', type: 'solid', x: 280, y: 420, w: 120, h: 20 },
      { id: 'key1', type: 'key', x: 320, y: 396, w: 24, h: 24 },
      { id: 'spikeOnKeyPlat', type: 'hazard', variant: 'spikes', dir: 'up', x: 350, y: 400, w: 30, h: 20, hidden: true },
      { type: 'trigger', x: 280, y: 380, w: 120, h: 40, once: true, delay: 0,
        actions: [ { do: 'reveal', target: 'spikeOnKeyPlat' }, { do: 'shake' } ] },

      // the tempting flat "shortcut" directly beneath keyPlat - no key up
      // here, just a punishment for skipping the detour.
      { id: 'spikeShortcut', type: 'hazard', variant: 'spikes', dir: 'up', x: 320, y: 460, w: 40, h: 20, hidden: true },
      { type: 'trigger', x: 250, y: 380, w: 20, h: 100, once: true, delay: 0,
        actions: [ { do: 'reveal', target: 'spikeShortcut' }, { do: 'shake' } ] },

      { id: 'spikeBeforeLock', type: 'hazard', variant: 'spikes', dir: 'up', x: 560, y: 460, w: 30, h: 20, hidden: true },
      { type: 'trigger', x: 520, y: 380, w: 20, h: 100, once: true, delay: 0,
        actions: [ { do: 'reveal', target: 'spikeBeforeLock' }, { do: 'shake' } ] },
      { id: 'lock1', type: 'lock', x: 600, y: 380, w: 20, h: 100 },

      { id: 'spikeAfterLock', type: 'hazard', variant: 'spikes', dir: 'up', x: 700, y: 460, w: 30, h: 20, hidden: true },
      { type: 'trigger', x: 650, y: 380, w: 20, h: 100, once: true, delay: 0,
        actions: [ { do: 'reveal', target: 'spikeAfterLock' }, { do: 'shake' } ] },

      { id: 'lintel2', type: 'decor', variant: 'ceiling', x: 585, y: 340, w: 50, h: 30 },
      { id: 'pillar3', type: 'decor', variant: 'rocks', x: 60, y: 450, w: 20, h: 30 },
      { id: 'pillar4', type: 'decor', variant: 'rocks', x: 820, y: 450, w: 20, h: 30 }
    ]
  },

  // ================= LEVEL 38 =================
  // SOLUTION (two buttons/doors, tighter timings, crush troll): floor is
  //   one continuous strip. Hop spikeStart(90). Press button1(150) - opens
  //   door1(350) for 3s. Hop spikeA(250, ~100px/0.33s lead) en route -
  //   crossing takes well under 1s, huge slack on a 3s door. THE TROLL:
  //   button2 sits just past door1, INSIDE its old footprint (355-385
  //   overlaps door1's 350-370) - pressing it opens door2(650, 2.5s) but
  //   ALSO re-slams door1 in just 0.35s. First time, standing still after
  //   the press gets you crushed; known, just keep walking - even a small
  //   step clears door1's rect well within 0.35s. Hop spikeB(500, 0.28s
  //   lead) en route to door2 - crossing (355->650, ~1s+hop) stays under
  //   2.5s*0.6=1.5s. Hop spikeAfterDoor2(895, immediate). Exit@930.
  {
    name: "The Other Button",
    theme: 'temple',
    deathMsgs: [
      "You should've kept walking.",
      "The doors talk to each other.",
      "Pressing it wasn't the mistake. Stopping was."
    ],
    spawn: { x: 40, y: 440 },
    exit: { x: 930, y: 430 },
    objects: [
      { id: 'floor', type: 'solid', x: 0, y: 480, w: 960, h: 60 },
      { id: 'spikeStart', type: 'hazard', variant: 'spikes', dir: 'up', x: 90, y: 460, w: 30, h: 20, hidden: true },
      { type: 'trigger', x: 50, y: 380, w: 20, h: 100, once: true, delay: 0,
        actions: [ { do: 'reveal', target: 'spikeStart' }, { do: 'shake' } ] },

      { id: 'button1', type: 'button', x: 150, y: 470, w: 30, h: 10,
        actions: [ { do: 'open', target: 'door1', duration: 3 } ] },
      { id: 'spikeA', type: 'hazard', variant: 'spikes', dir: 'up', x: 250, y: 460, w: 30, h: 20, hidden: true },
      { type: 'trigger', x: 210, y: 380, w: 20, h: 100, once: true, delay: 0,
        actions: [ { do: 'reveal', target: 'spikeA' }, { do: 'shake' } ] },
      { id: 'door1', type: 'door', x: 350, y: 380, w: 20, h: 100 },

      // Betrayal: button2 sits inside door1's own footprint. Pressing it
      // opens door2 further ahead but also re-slams door1 in 0.35s - just
      // enough to walk clear (>=0.25s fairness minimum), not enough to
      // stand around admiring your work.
      { id: 'button2', type: 'button', x: 355, y: 470, w: 30, h: 10,
        actions: [ { do: 'open', target: 'door2', duration: 2.5 }, { do: 'open', target: 'door1', duration: 0.35 } ] },

      { id: 'spikeB', type: 'hazard', variant: 'spikes', dir: 'up', x: 500, y: 460, w: 30, h: 20, hidden: true },
      { type: 'trigger', x: 460, y: 380, w: 20, h: 100, once: true, delay: 0,
        actions: [ { do: 'reveal', target: 'spikeB' }, { do: 'shake' } ] },
      { id: 'door2', type: 'door', x: 650, y: 380, w: 20, h: 100 },

      { id: 'spikeAfterDoor2', type: 'hazard', variant: 'spikes', dir: 'up', x: 720, y: 460, w: 30, h: 20, hidden: true },
      { type: 'trigger', x: 680, y: 380, w: 20, h: 100, once: true, delay: 0,
        actions: [ { do: 'reveal', target: 'spikeAfterDoor2' }, { do: 'shake' } ] },

      { id: 'lintel3', type: 'decor', variant: 'ceiling', x: 335, y: 340, w: 50, h: 30 },
      { id: 'lintel4', type: 'decor', variant: 'ceiling', x: 635, y: 340, w: 50, h: 30 },
      { id: 'pillar5', type: 'decor', variant: 'rocks', x: 60, y: 450, w: 20, h: 30 },
      { id: 'pillar6', type: 'decor', variant: 'rocks', x: 850, y: 450, w: 20, h: 30 }
    ]
  },

  // ================= LEVEL 39 =================
  // SOLUTION (THE FAKECLEAR): floor is one continuous strip. Hop
  //   spikeStart(90). At x440 sits decoyDoor - pixel-identical to the real
  //   exit. Touch it: a perfect LEVEL CLEAR overlay shows for ~1.2s, then
  //   rips away - level continues, you keep control. This only ever fires
  //   ONCE, first time you touch it. Immediately after, hop spikeAfterFake
  //   (470, ~0.2s lead - "the real corridor keeps going"). Press
  //   button1(520) - opens door1(680) for 3s. Hop spikeB(600, well inside
  //   the timing budget) en route. Past the door, hop spikeKeyGuard(740),
  //   grab key1(800). Touch lock1(860) with the key. Hop spikeAfterLock
  //   (895, immediate). The REAL exit is at 930 - well behind the lock.
  {
    name: "The Real Door Is Further",
    theme: 'temple',
    deathMsgs: [
      "That wasn't the exit. You already knew that.",
      "The real door was always further.",
      "One rug pull per level. That was it."
    ],
    spawn: { x: 40, y: 440 },
    exit: { x: 930, y: 430 },
    objects: [
      { id: 'floor', type: 'solid', x: 0, y: 480, w: 960, h: 60 },
      { id: 'spikeStart', type: 'hazard', variant: 'spikes', dir: 'up', x: 90, y: 460, w: 30, h: 20, hidden: true },
      { type: 'trigger', x: 50, y: 380, w: 20, h: 100, once: true, delay: 0,
        actions: [ { do: 'reveal', target: 'spikeStart' }, { do: 'shake' } ] },

      { id: 'decoyDoor', type: 'decoy', x: 440, y: 430, w: 30, h: 50 },
      { type: 'trigger', x: 440, y: 380, w: 30, h: 100, once: true, delay: 0,
        actions: [ { do: 'fakeclear' } ] },

      { id: 'spikeAfterFake', type: 'hazard', variant: 'spikes', dir: 'up', x: 470, y: 460, w: 30, h: 20, hidden: true },
      { type: 'trigger', x: 440, y: 380, w: 20, h: 100, once: true, delay: 0.2,
        actions: [ { do: 'reveal', target: 'spikeAfterFake' }, { do: 'shake' } ] },

      { id: 'button1', type: 'button', x: 520, y: 470, w: 30, h: 10,
        actions: [ { do: 'open', target: 'door1', duration: 3 } ] },
      { id: 'spikeB2', type: 'hazard', variant: 'spikes', dir: 'up', x: 600, y: 460, w: 30, h: 20, hidden: true },
      { type: 'trigger', x: 560, y: 380, w: 20, h: 100, once: true, delay: 0,
        actions: [ { do: 'reveal', target: 'spikeB2' }, { do: 'shake' } ] },
      { id: 'door1', type: 'door', x: 680, y: 380, w: 20, h: 100 },

      { id: 'spikeKeyGuard', type: 'hazard', variant: 'spikes', dir: 'up', x: 740, y: 460, w: 30, h: 20, hidden: true },
      { type: 'trigger', x: 700, y: 380, w: 20, h: 100, once: true, delay: 0,
        actions: [ { do: 'reveal', target: 'spikeKeyGuard' }, { do: 'shake' } ] },
      { id: 'key1', type: 'key', x: 800, y: 456, w: 24, h: 24 },
      { id: 'lock1', type: 'lock', x: 860, y: 380, w: 20, h: 100 },

      { id: 'spikeAfterLock', type: 'hazard', variant: 'spikes', dir: 'up', x: 895, y: 460, w: 20, h: 20, hidden: true },
      { type: 'trigger', x: 860, y: 380, w: 20, h: 100, once: true, delay: 0.15,
        actions: [ { do: 'reveal', target: 'spikeAfterLock' }, { do: 'shake' } ] },

      { id: 'lintel5', type: 'decor', variant: 'ceiling', x: 665, y: 340, w: 50, h: 30 },
      { id: 'lintel6', type: 'decor', variant: 'ceiling', x: 845, y: 340, w: 50, h: 30 },
      { id: 'pillar7', type: 'decor', variant: 'rocks', x: 60, y: 450, w: 20, h: 30 },
      { id: 'pillar8', type: 'decor', variant: 'rocks', x: 420, y: 450, w: 20, h: 30 }
    ]
  },

  // ================= LEVEL 40 =================
  // SOLUTION (chapter 8 climax - full temple gauntlet): floor0[0,200], hop
  //   spikeStart(90). Jump pit1(200-320,120px, tailwind callback fx300) -
  //   spikeWind pops mid-air on floor1 - hop it. Press button1(420) - opens
  //   door1(520) for 3s; hop spikeDoor(470) en route (well under budget).
  //   Past the door, hop spikeKeyGuard(580), grab key1(630). Touch
  //   lock1(700) with the key - spikeAfterLock pops right as you pass
  //   through (0.15s delay, ~0.3s effective lead) - hop it. Crossing x750
  //   drops a falling crusher block (temple deadfall, pingpong y80<->440,
  //   speed560) into the corridor ahead - wait for it to swing up, dash
  //   through. spikeEnd pops right after (0.25s lead) - hop it, exit@920.
  {
    name: "The Full Gauntlet",
    theme: 'temple',
    deathMsgs: [
      "Everything. All at once. On purpose.",
      "The temple remembers every trick.",
      "You made it further than most. Not far enough."
    ],
    spawn: { x: 40, y: 440 },
    exit: { x: 920, y: 430 },
    objects: [
      { id: 'floor0', type: 'solid', x: 0, y: 480, w: 200, h: 60 },
      { id: 'spikeStart', type: 'hazard', variant: 'spikes', dir: 'up', x: 90, y: 460, w: 30, h: 20, hidden: true },
      { type: 'trigger', x: 50, y: 380, w: 20, h: 100, once: true, delay: 0,
        actions: [ { do: 'reveal', target: 'spikeStart' }, { do: 'shake' } ] },

      // pit1 200-320 (120px), wind callback (tailwind, visible).
      { id: 'windCallback', type: 'wind', x: 190, y: 300, w: 140, h: 180, fx: 300 },
      { id: 'floor1', type: 'solid', x: 320, y: 480, w: 200, h: 60 },
      { id: 'spikeWind', type: 'hazard', variant: 'spikes', dir: 'up', x: 360, y: 460, w: 30, h: 20, hidden: true },
      { type: 'trigger', x: 210, y: 300, w: 120, h: 180, once: true, delay: 0,
        actions: [ { do: 'reveal', target: 'spikeWind' }, { do: 'shake' } ] },

      { id: 'button1', type: 'button', x: 420, y: 470, w: 30, h: 10,
        actions: [ { do: 'open', target: 'door1', duration: 3 } ] },
      { id: 'spikeDoor', type: 'hazard', variant: 'spikes', dir: 'up', x: 470, y: 460, w: 30, h: 20, hidden: true },
      { type: 'trigger', x: 440, y: 380, w: 20, h: 100, once: true, delay: 0,
        actions: [ { do: 'reveal', target: 'spikeDoor' }, { do: 'shake' } ] },
      { id: 'door1', type: 'door', x: 520, y: 380, w: 20, h: 100 },

      { id: 'floor2', type: 'solid', x: 540, y: 480, w: 200, h: 60 },
      { id: 'spikeKeyGuard', type: 'hazard', variant: 'spikes', dir: 'up', x: 580, y: 460, w: 30, h: 20, hidden: true },
      { type: 'trigger', x: 540, y: 380, w: 20, h: 100, once: true, delay: 0,
        actions: [ { do: 'reveal', target: 'spikeKeyGuard' }, { do: 'shake' } ] },
      { id: 'key1', type: 'key', x: 630, y: 456, w: 24, h: 24 },
      { id: 'lock1', type: 'lock', x: 700, y: 380, w: 20, h: 100 },
      { id: 'spikeAfterLock', type: 'hazard', variant: 'spikes', dir: 'up', x: 730, y: 460, w: 30, h: 20, hidden: true },
      { type: 'trigger', x: 700, y: 380, w: 20, h: 100, once: true, delay: 0.15,
        actions: [ { do: 'reveal', target: 'spikeAfterLock' }, { do: 'shake' } ] },

      { id: 'floor3', type: 'solid', x: 720, y: 480, w: 240, h: 60 },
      { id: 'crusher1', type: 'platform', x: 790, y: 80, w: 60, h: 40,
        path: [ { x: 790, y: 440 } ], speed: 560, mode: 'pingpong', startOnTrigger: true, hidden: true },
      { type: 'trigger', x: 750, y: 380, w: 20, h: 100, once: true, delay: 0,
        actions: [ { do: 'reveal', target: 'crusher1' }, { do: 'start', target: 'crusher1' }, { do: 'shake' } ] },

      { id: 'spikeEnd', type: 'hazard', variant: 'spikes', dir: 'up', x: 870, y: 460, w: 30, h: 20, hidden: true },
      { type: 'trigger', x: 830, y: 380, w: 20, h: 100, once: true, delay: 0,
        actions: [ { do: 'reveal', target: 'spikeEnd' }, { do: 'shake' } ] },

      { id: 'lintel7', type: 'decor', variant: 'ceiling', x: 505, y: 340, w: 50, h: 30 },
      { id: 'lintel8', type: 'decor', variant: 'ceiling', x: 685, y: 340, w: 50, h: 30 },
      { id: 'pillar9', type: 'decor', variant: 'rocks', x: 60, y: 450, w: 20, h: 30 },
      { id: 'pillar10', type: 'decor', variant: 'rocks', x: 900, y: 450, w: 20, h: 30 }
    ]
  }

];
