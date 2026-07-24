// Stickman Rage — Engine: physics, collision, triggers, rendering, stickman, FX.
// No build step. Exposes window.Engine (constructor) and window.ENGINE_CONSTANTS.
(function () {
  'use strict';

  var CANVAS_W = 960, CANVAS_H = 540;
  var PLAYER_W = 20, PLAYER_H = 40;
  var MOVE_SPEED = 300;
  var GRAVITY = 2400;
  var JUMP_VEL = -800;
  var MAX_FALL = 900;
  var COYOTE_TIME = 0.1;
  var JUMP_BUFFER = 0.1;
  var FIXED_DT = 1 / 120;
  var RESPAWN_TIME = 0.45; // instant respawn feel, < 0.7s required
  var MAX_FRAME_DT = 0.1; // spiral-of-death guard

  // ---- Presentation palette (rendering only — no gameplay/physics meaning) ----
  var COL_BG = '#efece6';
  var COL_SOLID = '#1c1c1c';
  var COL_SOLID_TOP = 'rgba(255,255,255,0.14)';
  var COL_HAZARD = '#e0201a';
  var COL_HAZARD_GLOW = '#ff5a3c';
  var COL_DOOR = '#0e0e0e';
  var COL_DOOR_HANDLE = '#e0201a';
  var COL_PLAYER = '#181818';
  var COL_PROJECTILE = '#e0201a';
  var COL_POP = '26,26,26';
  // ---- Character face / ice palette (rendering only) ----
  var COL_HEAD_FILL = COL_BG;
  var COL_FACE = '#141414';
  var COL_VEIN = '#c81414';
  var COL_ICE_FILL = '#a8deec';
  var COL_ICE_FILL_LT = '#c9ecf5';
  var COL_ICE_EDGE = '#2e8ba8';
  var COL_ICE_HILITE = 'rgba(255,255,255,0.85)';
  var COL_SPRING_ACCENT = '#e0201a';

  // ---- Level themes (v2.2) — rendering/ambience ONLY, never geometry. ----
  // Hazards intentionally stay vivid/fixed across all themes for contrast and
  // readability; only background, terrain accent, player-body color and a
  // sparse ambient decor layer change per theme.
  var THEMES = {
    plain: {
      bg: '#efece6', terrain: '#1c1c1c', terrainTop: 'rgba(255,255,255,0.14)',
      playerFill: COL_PLAYER, accent: '#e0201a', dark: false
    },
    icecave: {
      bg: '#dce7ee', terrain: '#20262c', terrainTop: 'rgba(255,255,255,0.18)',
      playerFill: '#181818', accent: '#3fa9c9', dark: false
    },
    lava: {
      bg: '#f7e3cc', terrain: '#241a14', terrainTop: 'rgba(255,255,255,0.14)',
      playerFill: '#181818', accent: '#ff7a3c', dark: false
    },
    night: {
      bg: '#1b1d22', terrain: '#c9cdd3', terrainTop: 'rgba(0,0,0,0.18)',
      playerFill: '#f0ede6', accent: '#8fb8ff', dark: true
    }
  };
  var DECOR_MIX = 0.70; // muted decor = 70% of the way from terrain color to bg color

  function getTheme(levelDef) {
    var name = (levelDef && levelDef.theme) || 'plain';
    return THEMES[name] || THEMES.plain;
  }

  function hexToRgb(hex) {
    var h = hex.replace('#', '');
    if (h.length === 3) h = h.split('').map(function (c) { return c + c; }).join('');
    var num = parseInt(h, 16);
    return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
  }
  function mixColor(hexA, hexB, t) {
    var a = hexToRgb(hexA), b = hexToRgb(hexB);
    var r = Math.round(a.r + (b.r - a.r) * t);
    var g = Math.round(a.g + (b.g - a.g) * t);
    var bl = Math.round(a.b + (b.b - a.b) * t);
    return 'rgb(' + r + ',' + g + ',' + bl + ')';
  }
  // Deterministic 0..1 pseudo-random from a number seed (no RNG per frame —
  // used for jagged rock lips / decor clusters / ambient placement so the
  // same input always draws the same shape).
  function hashFrac(x) {
    var s = Math.sin(x * 12.9898) * 43758.5453;
    return s - Math.floor(s);
  }

  window.ENGINE_CONSTANTS = {
    CANVAS_W: CANVAS_W, CANVAS_H: CANVAS_H, PLAYER_W: PLAYER_W, PLAYER_H: PLAYER_H,
    MOVE_SPEED: MOVE_SPEED, GRAVITY: GRAVITY, JUMP_VEL: JUMP_VEL, MAX_FALL: MAX_FALL,
    COYOTE_TIME: COYOTE_TIME, JUMP_BUFFER: JUMP_BUFFER, FIXED_DT: FIXED_DT,
    RESPAWN_TIME: RESPAWN_TIME
  };

  function rectOverlap(ax, ay, aw, ah, bx, by, bw, bh) {
    return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
  }

  function clone(o) {
    return JSON.parse(JSON.stringify(o));
  }

  function sfx(name) {
    try {
      if (window.STICKAUDIO && window.STICKAUDIO.sfx && window.STICKAUDIO.sfx[name]) {
        window.STICKAUDIO.sfx[name]();
      }
    } catch (e) { /* audio must never break the game */ }
  }

  function buildInitialObjects(levelDef) {
    var out = [];
    var src = levelDef.objects || [];
    for (var i = 0; i < src.length; i++) {
      var o = clone(src[i]);
      o.hidden = !!o.hidden;
      if (o.type === 'hazard') {
        o.variant = o.variant || 'spikes';
        o.dir = o.dir || 'up';
      } else if (o.type === 'platform') {
        o.path = o.path || [];
        o.speed = o.speed != null ? o.speed : 100;
        o.mode = o.mode || 'loop';
        o.startOnTrigger = !!o.startOnTrigger;
      } else if (o.type === 'trigger') {
        o.once = o.once !== false;
        o.delay = o.delay || 0;
        o.actions = o.actions || [];
      } else if (o.type === 'decor') {
        o.variant = o.variant || 'ceiling';
      }
      initRuntimeFields(o);
      out.push(o);
    }
    var exit = levelDef.exit || { x: 0, y: 0 };
    var exitObj = {
      type: 'exit', id: 'exit', x: exit.x, y: exit.y, w: 30, h: 50,
      hidden: !!exit.hidden
    };
    initRuntimeFields(exitObj);
    out.push(exitObj);
    return out;
  }

  function initRuntimeFields(o) {
    o._lastDelta = { x: 0, y: 0 };
    if (o.type === 'platform') {
      o._wp = [{ x: o.x, y: o.y }].concat((o.path || []).map(function (p) { return { x: p.x, y: p.y }; }));
      o._idx = o._wp.length > 1 ? 1 : 0;
      o._dir = 1;
      o._started = !o.startOnTrigger;
    } else if (o.type === 'trigger') {
      o._firedOnce = false;
      o._inside = false;
    } else if (o.type === 'decoy') {
      o.w = 30; o.h = 50;
    } else if (o.type === 'spring') {
      // Cosmetic squash-then-extend coil animation state, driven by
      // launchSpring()/updateMovers() — never affects physics. Reset fresh
      // every resetRuntime() via the initialObjects clone (full death/respawn
      // reset path), so a spring caught mid-bounce at death always renders at
      // rest again after respawn.
      o._animTimer = 0;
      o._animDur = 0.22;
    }
    o._moveTo = null;
    o._moveSpeed = 0;
    return o;
  }

  function Engine(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.active = false;
    this.onDeath = null;
    this.onClear = null;
    this.accumulator = 0;
    this._lastTime = null;
    this.animTime = 0;
    this.levelDef = null;
    this.initialObjects = [];
    this._loopStarted = false;
    // Consecutive-deaths-on-this-level counter, driven by main.js (not reset by
    // resetRuntime — it spans respawns within the same level attempt). Used
    // only for a cosmetic respawn flourish (rage-vein flash); never gameplay.
    this.consecutiveDeaths = 0;
    this._animPrevGrounded = false;
    this.resetRuntime();
  }

  Engine.prototype.loadLevel = function (levelDef) {
    this.levelDef = levelDef;
    this.initialObjects = buildInitialObjects(levelDef);
    this.resetRuntime();
  };

  Engine.prototype.resetRuntime = function () {
    var levelDef = this.levelDef || { spawn: { x: 40, y: 440 } };
    this.objects = this.initialObjects.map(clone);
    this.objectsById = {};
    for (var i = 0; i < this.objects.length; i++) {
      var o = this.objects[i];
      if (o.id) this.objectsById[o.id] = o;
    }
    this.projectiles = [];
    this.pendingActions = [];
    this.toasts = [];
    this.pops = [];
    this.particles = [];
    this.sparkles = [];
    this.shatters = [];
    this.shake = { mag: 0, ttl: 0, dur: 0.0001 };
    this.deathFlash = { ttl: 0, dur: 0.12 };
    this.levelTime = 0;
    this.dying = false;
    this.deathTimer = 0;
    this.cleared = false;
    this.invertTimer = 0; // 'invert' action: seconds remaining of flipped L/R input; resets on death/load
    this._animPrevGrounded = false;
    this.player = {
      x: levelDef.spawn.x, y: levelDef.spawn.y, vx: 0, vy: 0,
      grounded: false, groundObj: null, facing: 1,
      coyoteTimer: 0, jumpBufferTimer: 0, alive: true,
      // ---- purely cosmetic animation state (render only, no gameplay effect) ----
      idleTime: 0, squashTimer: 0, squashKind: null,
      fistShakeTimer: 0, rageFlashTimer: 0
    };
    this.input = this.input || { left: false, right: false };
  };

  Engine.prototype.restartLevel = function () {
    // Free restart (R key) — no death counted, instant, no ragdoll.
    this.resetRuntime();
  };

  Engine.prototype.pressJump = function () {
    this.player.jumpBufferTimer = JUMP_BUFFER;
  };

  Engine.prototype.releaseJump = function () {
    if (this.player.vy < 0) this.player.vy *= 0.5;
  };

  Engine.prototype.triggerShake = function (mag, dur) {
    this.shake.mag = mag != null ? mag : 8;
    this.shake.dur = dur != null ? dur : 0.25;
    this.shake.ttl = this.shake.dur;
  };

  Engine.prototype.collidables = function () {
    var out = [];
    for (var i = 0; i < this.objects.length; i++) {
      var o = this.objects[i];
      // Springs collide like a plain solid block on all sides EXCEPT the top
      // landing case, which resolveY() special-cases into a launch instead
      // of a normal rest. Existing solid/platform collision is untouched.
      if (!o.hidden && (o.type === 'solid' || o.type === 'platform' || o.type === 'spring')) out.push(o);
    }
    return out;
  };

  Engine.prototype.die = function (reason) {
    if (this.dying || this.cleared) return;
    this.dying = true;
    this.deathTimer = 0;
    this.player.alive = false;
    this.spawnRagdoll();
    this.triggerShake(10, 0.3);
    this.deathFlash.ttl = this.deathFlash.dur;
    sfx('death');
    if (this.onDeath) this.onDeath(reason);
  };

  // Chunky ragdoll burst: one 'head' piece (keeps the grumpy face, X eyes)
  // plus several stubby limb/torso chunks — comedy-proportioned, matching the
  // fat/muscular silhouette instead of thin stick lines.
  var RAGDOLL_PIECES = [
    { kind: 'head', w: 11, h: 11 },
    { kind: 'chunk', w: 11, h: 8 },
    { kind: 'chunk', w: 6, h: 5 },
    { kind: 'chunk', w: 6, h: 5 },
    { kind: 'chunk', w: 5, h: 9 },
    { kind: 'chunk', w: 5, h: 9 },
    { kind: 'chunk', w: 4, h: 4 }
  ];

  Engine.prototype.spawnRagdoll = function () {
    this.particles = [];
    var cx = this.player.x + PLAYER_W / 2, cy = this.player.y + PLAYER_H / 2;
    for (var i = 0; i < RAGDOLL_PIECES.length; i++) {
      var piece = RAGDOLL_PIECES[i];
      var ang = (Math.PI * 2 * i / RAGDOLL_PIECES.length) + Math.random() * 0.6;
      var speed = 70 + Math.random() * 170;
      this.particles.push({
        x: cx, y: cy,
        vx: Math.cos(ang) * speed, vy: Math.sin(ang) * speed - 130,
        rot: Math.random() * Math.PI, vrot: (Math.random() - 0.5) * 11,
        kind: piece.kind, w: piece.w, h: piece.h
      });
    }
  };

  // Brief 2-3 shard shatter FX — used on projectile/player impact and on
  // off-screen projectile despawn. Purely cosmetic (this.shatters), decayed
  // and rendered like the existing pop/toast FX arrays.
  Engine.prototype.spawnIceShatter = function (x, y) {
    var n = 2 + Math.floor(Math.random() * 2); // 2-3
    for (var i = 0; i < n; i++) {
      var ang = Math.random() * Math.PI * 2;
      var speed = 60 + Math.random() * 90;
      this.shatters.push({
        x: x, y: y,
        vx: Math.cos(ang) * speed, vy: Math.sin(ang) * speed - 50,
        rot: Math.random() * Math.PI, vrot: (Math.random() - 0.5) * 9,
        w: 3 + Math.random() * 2.5, h: 2 + Math.random(),
        ttl: 0.3, dur: 0.3
      });
    }
  };

  // ---- Trigger / action system ----

  Engine.prototype.executeActions = function (actions) {
    for (var i = 0; i < actions.length; i++) {
      var a = actions[i];
      switch (a.do) {
        case 'warp': {
          if (!a.to) break;
          var wp = this.player;
          var fromCx = wp.x + PLAYER_W / 2, fromCy = wp.y + PLAYER_H / 2;
          this.pops.push({ x: fromCx, y: fromCy, ttl: 0.3, dur: 0.3 });
          wp.x = a.to.x; wp.y = a.to.y;
          wp.vx = 0; wp.vy = 0;
          wp.grounded = false; wp.groundObj = null;
          var toCx = wp.x + PLAYER_W / 2, toCy = wp.y + PLAYER_H / 2;
          this.pops.push({ x: toCx, y: toCy, ttl: 0.3, dur: 0.3 });
          sfx('warp');
          break;
        }
        case 'invert': {
          var dur = a.duration != null ? a.duration : 0;
          this.invertTimer = Math.max(this.invertTimer, dur);
          break;
        }
        case 'reveal': {
          var t = this.objectsById[a.target];
          if (t && t.hidden) {
            t.hidden = false;
            this.pops.push({ x: t.x + (t.w || 0) / 2, y: t.y + (t.h || 0) / 2, ttl: 0.3, dur: 0.3 });
            sfx('reveal');
          }
          break;
        }
        case 'hide': {
          var th = this.objectsById[a.target];
          if (th) th.hidden = true;
          break;
        }
        case 'move': {
          var tm = this.objectsById[a.target];
          if (tm && a.to) {
            tm._moveTo = { x: a.to.x, y: a.to.y };
            tm._moveSpeed = a.speed != null ? a.speed : 200;
          }
          break;
        }
        case 'start': {
          var ts = this.objectsById[a.target];
          if (ts) ts._started = true;
          break;
        }
        case 'shoot': {
          var from = a.from || { x: 0, y: 0 };
          var dir = a.dir || { x: 1, y: 0 };
          var mag = Math.hypot(dir.x, dir.y) || 1;
          var spd = a.speed != null ? a.speed : 400;
          this.projectiles.push({
            x: from.x, y: from.y,
            vx: (dir.x / mag) * spd, vy: (dir.y / mag) * spd,
            w: 24, h: 6, angle: Math.atan2(dir.y, dir.x),
            _sparkTimer: 0
          });
          sfx('shoot');
          break;
        }
        case 'msg': {
          this.toasts.push({ text: a.text || '', ttl: 1.4, dur: 1.4 });
          break;
        }
        case 'shake': {
          this.triggerShake(8, 0.3);
          break;
        }
      }
    }
  };

  Engine.prototype.fireTrigger = function (trig) {
    if (trig.delay && trig.delay > 0) {
      this.pendingActions.push({ timeLeft: trig.delay, actions: trig.actions });
    } else {
      this.executeActions(trig.actions);
    }
  };

  // ---- Movers: platforms following paths + generic move-to targets ----

  Engine.prototype.updateMovers = function (dt) {
    for (var i = 0; i < this.objects.length; i++) {
      var o = this.objects[i];
      var prevX = o.x, prevY = o.y;
      if (o.type === 'platform' && o._started && o._wp && o._wp.length > 1) {
        this.stepAlongPath(o, dt);
      }
      if (o._moveTo) {
        this.stepMoveTo(o, dt);
      }
      if (o.type === 'spring' && o._animTimer > 0) {
        o._animTimer = Math.max(0, o._animTimer - dt);
      }
      o._lastDelta = { x: o.x - prevX, y: o.y - prevY };
    }
  };

  Engine.prototype.stepAlongPath = function (o, dt) {
    var target = o._wp[o._idx];
    var dx = target.x - o.x, dy = target.y - o.y;
    var dist = Math.hypot(dx, dy);
    var step = o.speed * dt;
    if (dist <= step || dist === 0) {
      o.x = target.x; o.y = target.y;
      if (o.mode === 'pingpong') {
        var next = o._idx + o._dir;
        if (next >= o._wp.length) { o._dir = -1; next = o._idx - 1; }
        if (next < 0) { o._dir = 1; next = 1 % o._wp.length; }
        o._idx = next;
      } else {
        o._idx = (o._idx + 1) % o._wp.length;
      }
    } else {
      o.x += (dx / dist) * step;
      o.y += (dy / dist) * step;
    }
  };

  Engine.prototype.stepMoveTo = function (o, dt) {
    var dx = o._moveTo.x - o.x, dy = o._moveTo.y - o.y;
    var dist = Math.hypot(dx, dy);
    var step = (o._moveSpeed || 200) * dt;
    if (dist <= step || dist === 0) {
      o.x = o._moveTo.x; o.y = o._moveTo.y;
      o._moveTo = null;
    } else {
      o.x += (dx / dist) * step;
      o.y += (dy / dist) * step;
    }
  };

  // ---- Collision resolution ----

  Engine.prototype.resolveX = function () {
    var p = this.player;
    var solids = this.collidables();
    for (var i = 0; i < solids.length; i++) {
      var s = solids[i];
      if (rectOverlap(p.x, p.y, PLAYER_W, PLAYER_H, s.x, s.y, s.w, s.h)) {
        if (p.vx > 0) { p.x = s.x - PLAYER_W; }
        else if (p.vx < 0) { p.x = s.x + s.w; }
        else {
          var overlapLeft = (p.x + PLAYER_W) - s.x;
          var overlapRight = (s.x + s.w) - p.x;
          if (overlapLeft < overlapRight) p.x = s.x - PLAYER_W; else p.x = s.x + s.w;
        }
        p.vx = 0;
      }
    }
  };

  Engine.prototype.resolveY = function () {
    var p = this.player;
    p.grounded = false;
    var newGroundObj = null;
    var springLaunch = null; // spring landed on this frame — launch happens AFTER the loop
    var solids = this.collidables();
    for (var i = 0; i < solids.length; i++) {
      var s = solids[i];
      if (rectOverlap(p.x, p.y, PLAYER_W, PLAYER_H, s.x, s.y, s.w, s.h)) {
        if (p.vy > 0) {
          p.y = s.y - PLAYER_H;
          if (s.type === 'spring') { springLaunch = s; }
          else { p.vy = 0; p.grounded = true; newGroundObj = s; }
        }
        else if (p.vy < 0) { p.y = s.y + s.h; p.vy = 0; }
        else {
          var overlapTop = (p.y + PLAYER_H) - s.y;
          var overlapBottom = (s.y + s.h) - p.y;
          if (overlapTop < overlapBottom) {
            p.y = s.y - PLAYER_H;
            if (s.type === 'spring') { springLaunch = s; }
            else { p.grounded = true; newGroundObj = s; }
          } else { p.y = s.y + s.h; }
        }
      }
    }
    p.groundObj = newGroundObj;
    // Spring launch: overrides normal landing, no jump input required.
    // vy=-1150 gives ~275px rise (~2x a normal jump). Fair-use per SPEC —
    // does not require/consume jump buffer/coyote state.
    if (springLaunch) {
      p.vy = -1150;
      p.grounded = false;
      p.groundObj = null;
      this.launchSpring(springLaunch);
    }
  };

  // Cosmetic launch hook: kicks off the squash-then-extend coil animation and
  // plays the "boing" SFX. No gameplay/physics effect beyond what resolveY
  // already applied (vy=-1150).
  Engine.prototype.launchSpring = function (s) {
    s._animTimer = s._animDur || 0.22;
    sfx('boing');
  };

  // True squeeze detection (SPEC): a moving solid/platform that has advanced
  // into the player is not allowed to merely shove them — it must try to push
  // the player clear along its own motion delta. If the pushed player would
  // still overlap the mover (couldn't fully clear it) or would land inside any
  // OTHER visible solid/platform (pinned against a wall/floor/ceiling), the
  // player is crushed and dies. Otherwise the push is applied for real, which
  // gives ordinary "get shoved out of the way" behavior when there's room.
  // Standing on top of a mover (normal carry, handled separately in
  // stepPhysics right after this) is explicitly exempted so elevators/carried
  // platforms never kill by themselves.
  Engine.prototype.crushCheck = function () {
    var p = this.player;
    for (var i = 0; i < this.objects.length; i++) {
      var o = this.objects[i];
      if (o.hidden) continue;
      if (o.type !== 'solid' && o.type !== 'platform') continue;
      var moving = o._lastDelta.x !== 0 || o._lastDelta.y !== 0;
      if (!moving) continue;
      if (p.grounded && p.groundObj === o) continue; // riding on top — normal carry, not a crush
      if (!rectOverlap(p.x, p.y, PLAYER_W, PLAYER_H, o.x, o.y, o.w, o.h)) continue;

      var nx = p.x + o._lastDelta.x;
      var ny = p.y + o._lastDelta.y;

      if (rectOverlap(nx, ny, PLAYER_W, PLAYER_H, o.x, o.y, o.w, o.h)) {
        this.die('crush'); // still overlaps the mover itself — nowhere to go
        return;
      }
      var blocked = false;
      var solids = this.collidables();
      for (var j = 0; j < solids.length; j++) {
        var s = solids[j];
        if (s === o) continue;
        if (rectOverlap(nx, ny, PLAYER_W, PLAYER_H, s.x, s.y, s.w, s.h)) { blocked = true; break; }
      }
      if (blocked) {
        this.die('crush'); // pushed straight into other geometry — pinned
        return;
      }
      // Room to be shoved clear — apply the displacement for real.
      p.x = nx;
      p.y = ny;
    }
  };

  // ---- Main physics step ----

  Engine.prototype.stepPhysics = function (dt) {
    if (this.cleared) return;
    this.levelTime += dt;

    // Pending delayed trigger actions.
    for (var i = this.pendingActions.length - 1; i >= 0; i--) {
      var pa = this.pendingActions[i];
      pa.timeLeft -= dt;
      if (pa.timeLeft <= 0) {
        this.executeActions(pa.actions);
        this.pendingActions.splice(i, 1);
      }
    }

    this.updateMovers(dt);

    var p = this.player;

    // Squeeze/crush check happens right after movers advance, using the
    // player's position from the end of the previous frame (before this
    // frame's own input/gravity movement) — see crushCheck() for the algorithm.
    this.crushCheck();
    if (this.dying) return;

    // Carry player on moving ground.
    if (p.grounded && p.groundObj) {
      p.x += p.groundObj._lastDelta.x;
      p.y += p.groundObj._lastDelta.y;
    }

    // Projectiles (rendered as icicles — see drawIcicleShard). Movement/hit
    // logic below is unchanged; the sparkle/shatter calls are cosmetic FX only.
    for (var j = this.projectiles.length - 1; j >= 0; j--) {
      var pr = this.projectiles[j];
      pr.x += pr.vx * dt; pr.y += pr.vy * dt;
      // Trailing sparkle, spawned every few frames (cheap, cosmetic).
      pr._sparkTimer = (pr._sparkTimer || 0) - dt;
      if (pr._sparkTimer <= 0) {
        this.sparkles.push({
          x: pr.x + pr.w / 2 - pr.vx * 0.02, y: pr.y + pr.h / 2 - pr.vy * 0.02,
          ttl: 0.22, dur: 0.22
        });
        pr._sparkTimer = 0.05;
      }
      if (pr.x < -60 || pr.x > CANVAS_W + 60 || pr.y < -60 || pr.y > CANVAS_H + 60) {
        this.spawnIceShatter(pr.x, pr.y);
        this.projectiles.splice(j, 1);
        continue;
      }
      if (rectOverlap(p.x, p.y, PLAYER_W, PLAYER_H, pr.x, pr.y, pr.w, pr.h)) {
        this.spawnIceShatter(pr.x + pr.w / 2, pr.y + pr.h / 2);
        this.die('projectile');
        return;
      }
    }

    // 'invert' action timer: flips L/R mapping while active. No indicator/sound.
    if (this.invertTimer > 0) this.invertTimer = Math.max(0, this.invertTimer - dt);

    // Input -> horizontal velocity (instant accel/decel).
    var dir = (this.input.right ? 1 : 0) - (this.input.left ? 1 : 0);
    if (this.invertTimer > 0) dir = -dir;
    p.vx = dir * MOVE_SPEED;
    if (dir !== 0) p.facing = dir;

    // Jump (coyote + buffer).
    if (p.jumpBufferTimer > 0 && (p.grounded || p.coyoteTimer > 0)) {
      p.vy = JUMP_VEL;
      p.jumpBufferTimer = 0;
      p.coyoteTimer = 0;
      p.grounded = false;
      p.groundObj = null;
      sfx('jump');
    }
    if (p.jumpBufferTimer > 0) p.jumpBufferTimer = Math.max(0, p.jumpBufferTimer - dt);

    // Gravity.
    p.vy += GRAVITY * dt;
    if (p.vy > MAX_FALL) p.vy = MAX_FALL;

    // Move + resolve X.
    p.x += p.vx * dt;
    this.resolveX();
    // Move + resolve Y.
    p.y += p.vy * dt;
    this.resolveY();

    if (p.grounded) p.coyoteTimer = COYOTE_TIME;
    else p.coyoteTimer = Math.max(0, p.coyoteTimer - dt);

    // Triggers.
    for (var k = 0; k < this.objects.length; k++) {
      var trg = this.objects[k];
      if (trg.type !== 'trigger' || trg.hidden) continue;
      var inside = rectOverlap(p.x, p.y, PLAYER_W, PLAYER_H, trg.x, trg.y, trg.w, trg.h);
      if (inside && !trg._inside && (!trg._firedOnce || !trg.once)) {
        this.fireTrigger(trg);
        trg._firedOnce = true;
      }
      trg._inside = inside;
    }

    // Hazards.
    for (var m = 0; m < this.objects.length; m++) {
      var hz = this.objects[m];
      if (hz.type !== 'hazard' || hz.hidden) continue;
      if (rectOverlap(p.x, p.y, PLAYER_W, PLAYER_H, hz.x, hz.y, hz.w, hz.h)) {
        this.die('hazard');
        return;
      }
    }

    // Exit.
    var ex = this.objectsById['exit'];
    if (ex && !ex.hidden && rectOverlap(p.x, p.y, PLAYER_W, PLAYER_H, ex.x, ex.y, ex.w, ex.h)) {
      this.cleared = true;
      sfx('levelClear');
      if (this.onClear) this.onClear();
      return;
    }

    // Fall off.
    if (p.y > 620) {
      this.die('fall');
      return;
    }
  };

  Engine.prototype.update = function (dt) {
    this.animTime += dt;

    // Toasts / pops / shake decay regardless of dying state.
    for (var i = this.toasts.length - 1; i >= 0; i--) {
      this.toasts[i].ttl -= dt;
      if (this.toasts[i].ttl <= 0) this.toasts.splice(i, 1);
    }
    for (var j = this.pops.length - 1; j >= 0; j--) {
      this.pops[j].ttl -= dt;
      if (this.pops[j].ttl <= 0) this.pops.splice(j, 1);
    }
    for (var sIdx = this.sparkles.length - 1; sIdx >= 0; sIdx--) {
      this.sparkles[sIdx].ttl -= dt;
      if (this.sparkles[sIdx].ttl <= 0) this.sparkles.splice(sIdx, 1);
    }
    for (var shIdx = this.shatters.length - 1; shIdx >= 0; shIdx--) {
      var sh = this.shatters[shIdx];
      sh.vy += 500 * dt;
      sh.x += sh.vx * dt; sh.y += sh.vy * dt; sh.rot += sh.vrot * dt;
      sh.ttl -= dt;
      if (sh.ttl <= 0) this.shatters.splice(shIdx, 1);
    }
    if (this.shake.ttl > 0) {
      this.shake.ttl = Math.max(0, this.shake.ttl - dt);
    }
    if (this.deathFlash.ttl > 0) {
      this.deathFlash.ttl = Math.max(0, this.deathFlash.ttl - dt);
    }

    if (this.dying) {
      this.deathTimer += dt;
      for (var p = 0; p < this.particles.length; p++) {
        var pt = this.particles[p];
        pt.vy += GRAVITY * dt;
        pt.x += pt.vx * dt;
        pt.y += pt.vy * dt;
        pt.rot += pt.vrot * dt;
      }
      if (this.deathTimer >= RESPAWN_TIME) {
        this.resetRuntime();
        // Personality beat: quick one-cycle fist-shake on every respawn
        // (doesn't touch input/physics — render-only). Rage-vein flashes on
        // every 3rd+ consecutive death on this level attempt.
        this.player.fistShakeTimer = 0.35;
        if (this.consecutiveDeaths >= 3) this.player.rageFlashTimer = 0.6;
      }
      return;
    }

    this.stepPhysics(dt);
    this.updatePlayerAnim(dt);
  };

  // Cosmetic-only per-frame bookkeeping for the character animation (idle
  // fidget timer, landing/takeoff squash detection, flourish timers). Never
  // reads or writes anything that affects physics/collision outcomes.
  Engine.prototype.updatePlayerAnim = function (dt) {
    var p = this.player;
    if (!p) return;
    if (p.grounded && Math.abs(p.vx) < 1) {
      p.idleTime += dt;
    } else {
      p.idleTime = 0;
    }
    if (!this._animPrevGrounded && p.grounded) {
      p.squashTimer = 0.12; p.squashKind = 'land';
    } else if (this._animPrevGrounded && !p.grounded && p.vy < 0) {
      p.squashTimer = 0.10; p.squashKind = 'takeoff';
    }
    this._animPrevGrounded = p.grounded;
    if (p.squashTimer > 0) p.squashTimer = Math.max(0, p.squashTimer - dt);
    if (p.fistShakeTimer > 0) p.fistShakeTimer = Math.max(0, p.fistShakeTimer - dt);
    if (p.rageFlashTimer > 0) p.rageFlashTimer = Math.max(0, p.rageFlashTimer - dt);
  };

  // ---- Rendering ----

  // Outlined-limb helpers: a thin cream "seam" halo drawn under the near-black
  // limb stroke/fist so arms/legs read as distinct shapes even where they
  // cross over the same-color torso silhouette (invisible against the cream
  // background, so it costs nothing there).
  // theme: { bg, playerFill } — halo matches the current level's background
  // (so limb seams stay invisible against it) and fill uses the current
  // theme's player color. Defaults to the plain theme so any stray caller
  // (none currently) still renders exactly as before.
  function limbStroke(ctx, x1, y1, x2, y2, width, theme) {
    theme = theme || THEMES.plain;
    ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
    ctx.strokeStyle = theme.bg; ctx.lineWidth = width + 1.7; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
    ctx.strokeStyle = theme.playerFill; ctx.lineWidth = width; ctx.stroke();
  }
  function limbDot(ctx, x, y, r, theme) {
    theme = theme || THEMES.plain;
    ctx.fillStyle = theme.bg;
    ctx.beginPath(); ctx.arc(x, y, r + 1, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = theme.playerFill;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  }
  function limbRect(ctx, x, y, w, h, theme) {
    theme = theme || THEMES.plain;
    ctx.fillStyle = theme.bg;
    ctx.fillRect(x - 0.8, y - 0.8, w + 1.6, h + 1.6);
    ctx.fillStyle = theme.playerFill;
    ctx.fillRect(x, y, w, h);
  }

  // ---- Grumpy face (near-black features on a cream head, reads at 11px) ----
  // opts: { squint, victory, veinFlash, animTime }
  function drawGrumpyFace(ctx, hcx, hcy, dir, opts) {
    ctx.strokeStyle = COL_FACE;
    ctx.fillStyle = COL_FACE;
    ctx.lineCap = 'round';
    ctx.lineWidth = 1;

    // Angled-inward eyebrows "\ /" — inner (nose-side) ends low, outer ends
    // high: the classic angry-V. Symmetric, so it mirrors trivially with dir.
    ctx.beginPath();
    ctx.moveTo(hcx - 4.2, hcy - 2.6); ctx.lineTo(hcx - 1.2, hcy - 1.2);
    ctx.moveTo(hcx + 4.2, hcy - 2.6); ctx.lineTo(hcx + 1.2, hcy - 1.2);
    ctx.stroke();

    // Eyes: dots, or a squint (angrier) while running.
    if (opts.squint) {
      ctx.fillRect(hcx - 2.6, hcy - 0.4, 2, 0.9);
      ctx.fillRect(hcx + 0.6, hcy - 0.4, 2, 0.9);
    } else {
      ctx.beginPath(); ctx.arc(hcx - 1.7, hcy + 0.2, 0.9, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(hcx + 1.7, hcy + 0.2, 0.9, 0, Math.PI * 2); ctx.fill();
    }

    // Mouth: inverted-arc frown (middle higher than the corners) — 4px wide.
    // Victory pose softens it to a flat, satisfied smirk.
    ctx.beginPath();
    if (opts.victory) {
      ctx.moveTo(hcx - 2, hcy + 2.6); ctx.lineTo(hcx + 2, hcy + 2.2);
    } else {
      ctx.moveTo(hcx - 2, hcy + 3); ctx.quadraticCurveTo(hcx, hcy + 1.4, hcx + 2, hcy + 3);
    }
    ctx.stroke();

    // Rage vein above one brow (mirrors with dir). Normally a faint near-black
    // mark; flashes bright red on the 3rd+ consecutive-death respawn.
    var veinX = hcx + 3.4 * dir, veinY = hcy - 3.6;
    var flashing = opts.veinFlash && Math.floor((opts.animTime || 0) * 9) % 2 === 0;
    ctx.strokeStyle = flashing ? COL_VEIN : 'rgba(20,20,20,0.55)';
    ctx.lineWidth = flashing ? 1.2 : 0.8;
    ctx.beginPath();
    ctx.moveTo(veinX, veinY); ctx.lineTo(veinX - 0.6 * dir, veinY - 1.6);
    ctx.lineTo(veinX + 0.6 * dir, veinY - 2.6);
    ctx.stroke();
  }

  // ---- FAT / MUSCULAR / GRUMPY MAN — One Punch Man comedy proportions ----
  // Barrel/pear torso, tiny legs, thick short arms, oversized grumpy head.
  // Drawn inside the 20x40 hitbox; may overflow it by 2-3px (design brief).
  function drawStickman(ctx, p, animTime, cleared, theme) {
    theme = theme || THEMES.plain;
    var dir = p.facing || 1;
    var cx = p.x + PLAYER_W / 2;
    var feetY = p.y + PLAYER_H;

    // Landing/takeoff squash-stretch (1-2px), pivoted at the feet; head never
    // squashes (drawn after restoring transform-free where needed — here we
    // just keep the squash small enough that the head reads unaffected).
    var squashAmt = 0;
    if (p.squashTimer > 0) {
      var sdur = p.squashKind === 'land' ? 0.12 : 0.10;
      squashAmt = Math.max(0, Math.min(1, p.squashTimer / sdur));
    }
    var scaleY = 1 - squashAmt * 0.09;
    var scaleX = 1 + squashAmt * 0.07;

    ctx.save();
    ctx.translate(cx, feetY);
    ctx.scale(scaleX, scaleY);
    ctx.translate(-cx, -feetY);

    var grounded = !!p.grounded;
    var running = grounded && Math.abs(p.vx) > 1;
    var idle = grounded && !running;
    var victory = !!cleared;

    // Baseline geometry (before any pose lean).
    var hipY = p.y + 30;
    var torsoTopY = p.y + 12;
    var torsoH = torsoTopY - hipY; // negative-going drawn as rect below
    var torsoW = 16;
    var headR = 5.5;
    var idleShift = idle && p.idleTime > 3 ? Math.sin(animTime * 2) * 1.3 : 0;

    // Forward lean: baseline hunch at idle, bigger lean while running, none
    // while airborne/victory (One Punch Man plants flat for those).
    var lean = 0;
    if (idle) lean = 0.08;
    else if (running) lean = 0.26 * dir;
    var pivotX = cx, pivotY = hipY + 2;

    ctx.save();
    ctx.translate(pivotX, pivotY);
    ctx.rotate(lean * (idle ? 1 : 1));
    ctx.translate(-pivotX, -pivotY);
    ctx.translate(idleShift, 0);

    var headCX = cx + 2 * dir + idleShift * 0.4;
    var headCY = torsoTopY - headR - 0.5;

    // ---- Legs (tiny, comedy proportions) — drawn first so torso overlaps hips.
    // Outlined (cream seam) so they read distinctly against the belly above.
    if (!grounded) {
      // Jump: legs tucked (rising) or extending toward landing (falling).
      var fallT = Math.max(-1, Math.min(1, (p.vy || 0) / 700));
      var tuck = 0.5 - fallT * 0.4; // 0.1 (tucked, rising) .. 0.9 (extended, falling)
      var legLen = 5 + tuck * 4;
      limbStroke(ctx, cx - 3, hipY, cx - 4 + (1 - tuck) * 2 * dir, hipY + legLen, 3.2, theme);
      limbStroke(ctx, cx + 3, hipY, cx + 4 - (1 - tuck) * 2 * dir, hipY + legLen, 3.2, theme);
    } else if (running) {
      var stride = Math.sin(animTime * 16) * 6;
      limbStroke(ctx, cx - 3, hipY, cx - 3 + stride, feetY - 1, 3.4, theme);
      limbStroke(ctx, cx + 3, hipY, cx + 3 - stride, feetY - 1, 3.4, theme);
      // tiny feet nubs
      limbRect(ctx, cx - 3 + stride - 2, feetY - 2, 4, 2, theme);
      limbRect(ctx, cx + 3 - stride - 2, feetY - 2, 4, 2, theme);
    } else {
      // Idle: slightly splayed static stance, one knee easing on the fidget.
      var kneeEase = idle && p.idleTime > 3 ? Math.sin(animTime * 1.2) * 1.2 : 0;
      limbStroke(ctx, cx - 3, hipY, cx - 5, feetY - 1 + kneeEase, 3.4, theme);
      limbStroke(ctx, cx + 3, hipY, cx + 5, feetY - 1 - kneeEase, 3.4, theme);
      limbRect(ctx, cx - 8, feetY - 2 + kneeEase, 4.5, 2, theme);
      limbRect(ctx, cx + 3.5, feetY - 2 - kneeEase, 4.5, 2, theme);
    }

    // ---- Torso: barrel/pear with broad arced shoulders + lower belly bulge.
    ctx.fillStyle = theme.playerFill;
    ctx.beginPath();
    ctx.moveTo(cx - torsoW / 2, torsoTopY + 4);
    ctx.quadraticCurveTo(cx - torsoW / 2 - 1.5, torsoTopY - 2, cx - torsoW / 2 + 3, torsoTopY - 3);
    ctx.lineTo(cx + torsoW / 2 - 3, torsoTopY - 3);
    ctx.quadraticCurveTo(cx + torsoW / 2 + 1.5, torsoTopY - 2, cx + torsoW / 2, torsoTopY + 4);
    ctx.lineTo(cx + torsoW / 2, hipY - 4);
    ctx.quadraticCurveTo(cx + torsoW / 2, hipY, cx + torsoW / 2 - 3, hipY);
    ctx.lineTo(cx - torsoW / 2 + 3, hipY);
    ctx.quadraticCurveTo(cx - torsoW / 2, hipY, cx - torsoW / 2, hipY - 4);
    ctx.closePath();
    ctx.fill();
    // Belly bulge overhang — sticks out 1-2px past the torso silhouette.
    ctx.beginPath();
    ctx.ellipse(cx, hipY - 6, 9, 6.5, 0, 0, Math.PI * 2);
    ctx.fill();
    // Faint top-shoulder highlight (rim light) so the torso doesn't read as
    // a flat inkblot — cheap, matches the ground/platform top-edge treatment.
    // Themes with a light player body (night) get a dark rim instead of a
    // white one, since a white highlight would vanish on a light fill.
    ctx.fillStyle = theme.dark ? 'rgba(0,0,0,0.14)' : 'rgba(255,255,255,0.10)';
    ctx.beginPath();
    ctx.ellipse(cx - 2 * dir, torsoTopY, torsoW / 2 - 2, 2.4, 0, Math.PI, 0);
    ctx.fill();

    // ---- Arms (thick, short, outlined) — pose-dependent. Shoulders attach
    // right at the torso's outer edge and hands reach OUTSIDE the silhouette
    // so every pose stays legible instead of vanishing into the belly.
    var shY = torsoTopY + 3;
    var shoulderOut = torsoW / 2 + 1;
    if (victory) {
      // Raised-fist victory pose — fists lifted clear ABOVE the head so they
      // never overlap the (later-drawn) head circle regardless of facing.
      var victHandY = headCY - headR - 3;
      limbStroke(ctx, cx - shoulderOut, shY, cx - 6, victHandY, 4.6, theme);
      limbStroke(ctx, cx + shoulderOut, shY, cx + 6, victHandY, 4.6, theme);
      limbDot(ctx, cx - 6, victHandY - 1, 2.2, theme);
      limbDot(ctx, cx + 6, victHandY - 1, 2.2, theme);
    } else if (!grounded) {
      // Arms up/spread with clenched fists.
      limbStroke(ctx, cx - shoulderOut, shY, cx - 12, shY - 7, 4.6, theme);
      limbStroke(ctx, cx + shoulderOut, shY, cx + 12, shY - 7, 4.6, theme);
      limbDot(ctx, cx - 12, shY - 8, 2.1, theme);
      limbDot(ctx, cx + 12, shY - 8, 2.1, theme);
    } else if (running) {
      var aswing = Math.sin(animTime * 16 + Math.PI) * 7;
      limbStroke(ctx, cx - shoulderOut, shY, cx - shoulderOut - 2 + aswing, shY + 8, 4.6, theme);
      limbStroke(ctx, cx + shoulderOut, shY, cx + shoulderOut + 2 - aswing, shY + 8, 4.6, theme);
      limbDot(ctx, cx - shoulderOut - 2 + aswing, shY + 9, 2, theme);
      limbDot(ctx, cx + shoulderOut + 2 - aswing, shY + 9, 2, theme);
    } else {
      // Idle: crossed arms over the belly, impatient — elbows poke out past
      // the silhouette, fists rest on the opposite shoulder.
      limbStroke(ctx, cx - shoulderOut, shY, cx + shoulderOut - 3, shY + 9, 4.4, theme);
      limbStroke(ctx, cx + shoulderOut, shY, cx - shoulderOut + 3, shY + 11, 4.4, theme);
      limbDot(ctx, cx + shoulderOut - 3, shY + 9, 1.9, theme);
      limbDot(ctx, cx - shoulderOut + 3, shY + 11, 1.9, theme);
      // Fist-shake flourish on respawn: a quick extra shake layered on the
      // crossed-arm fist, one short cycle, never blocks input.
      if (p.fistShakeTimer > 0) {
        var shk = Math.sin(animTime * 40) * 2.4 * (p.fistShakeTimer / 0.35);
        limbDot(ctx, cx + shoulderOut - 3 + shk, shY + 7, 2.1, theme);
      }
    }

    // ---- Head: oval, thrust forward, cream fill + near-black outline + face.
    ctx.fillStyle = COL_HEAD_FILL;
    ctx.beginPath();
    ctx.ellipse(headCX, headCY, headR, headR * 1.02, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = COL_PLAYER;
    ctx.lineWidth = 1.6;
    ctx.stroke();

    drawGrumpyFace(ctx, headCX, headCY, dir, {
      squint: running,
      victory: victory,
      veinFlash: p.rageFlashTimer > 0,
      animTime: animTime
    });

    ctx.restore(); // lean/idleShift
    ctx.restore(); // squash
  }

  // Tapered ice shard, drawn in a LOCAL frame where +x is "forward" (the
  // direction the shard points/travels) and +y is perpendicular thickness.
  // Shared by icicle projectiles (ctx pre-rotated to the velocity angle) and
  // the 'ice' hazard cluster (each shard passes its own forward vector).
  function drawIcicleShardLocal(ctx, len, baseHalf, glint) {
    var notchT = len * 0.32;
    var notchHalf = baseHalf * 0.55;
    ctx.beginPath();
    ctx.moveTo(-len / 2, -baseHalf);
    ctx.lineTo(-len / 2 + notchT, -notchHalf);
    ctx.lineTo(len / 2, 0);
    ctx.lineTo(-len / 2 + notchT, notchHalf);
    ctx.lineTo(-len / 2, baseHalf);
    ctx.closePath();
    ctx.fillStyle = COL_ICE_FILL;
    ctx.fill();
    ctx.strokeStyle = COL_ICE_EDGE;
    ctx.lineWidth = 1;
    ctx.stroke();
    // White highlight edge along the top.
    ctx.beginPath();
    ctx.moveTo(-len / 2 + 1, -baseHalf * 0.6);
    ctx.lineTo(len / 2 - 1.5, -baseHalf * 0.08);
    ctx.strokeStyle = COL_ICE_HILITE;
    ctx.lineWidth = 0.8;
    ctx.stroke();
    if (glint) {
      ctx.beginPath();
      ctx.arc(len * 0.08, 0, 1.3, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
    }
  }

  // Places one icicle shard in world space: base at (bx,by), pointing along
  // unit vector (dx,dy), the given length/base-thickness.
  function drawIcicleShardAt(ctx, bx, by, dx, dy, len, baseHalf, glint) {
    var ang = Math.atan2(dy, dx);
    ctx.save();
    ctx.translate(bx + dx * len / 2, by + dy * len / 2);
    ctx.rotate(ang);
    drawIcicleShardLocal(ctx, len, baseHalf, glint);
    ctx.restore();
  }

  // 'ice' hazard: 2-4 tapered shards filling the rect, dir-aware (hanging
  // from the edge the spikes "point away from"), same pale-blue palette as
  // icicle projectiles, with an occasional twinkling glint. Same lethality
  // as spikes/lava — this is rendering only.
  function drawIceHazard(ctx, o, animTime) {
    var dir = o.dir || 'up';
    var vx = 0, vy = 0, along = o.w, across = o.h, baseX = o.x, baseY = o.y;
    if (dir === 'down') { vx = 0; vy = 1; along = o.w; across = o.h; }
    else if (dir === 'up') { vx = 0; vy = -1; along = o.w; across = o.h; }
    else if (dir === 'left') { vx = -1; vy = 0; along = o.h; across = o.w; }
    else if (dir === 'right') { vx = 1; vy = 0; along = o.h; across = o.w; }

    var n = Math.max(2, Math.min(4, Math.floor(along / 12)));
    var twinkleIdx = Math.floor((Date.now() / 650)) % n;
    for (var i = 0; i < n; i++) {
      var t = (i + 0.5) / n;
      var jitter = (Math.sin(i * 12.9898 + o.x * 0.37 + o.y * 0.13) * 0.5 + 0.5); // deterministic 0..1
      var len = across * (0.72 + jitter * 0.26);
      var baseHalf = Math.max(2, Math.min(3, along / n * 0.42));
      var bx, by;
      if (dir === 'down') { bx = o.x + t * o.w; by = o.y; }
      else if (dir === 'up') { bx = o.x + t * o.w; by = o.y + o.h; }
      else if (dir === 'left') { bx = o.x + o.w; by = o.y + t * o.h; }
      else { bx = o.x; by = o.y + t * o.h; }
      drawIcicleShardAt(ctx, bx, by, vx, vy, len, baseHalf, i === twinkleIdx);
    }
  }

  function drawHazard(ctx, o, animTime) {
    if (o.variant === 'ice') { drawIceHazard(ctx, o, animTime); return; }
    var isLava = o.variant === 'lava';
    ctx.fillStyle = isLava ? COL_HAZARD_GLOW : COL_HAZARD;
    if (isLava) {
      ctx.fillRect(o.x, o.y, o.w, o.h);
      ctx.fillStyle = COL_HAZARD;
      var t = (Date.now() / 300) % 1;
      for (var i = 0; i < Math.max(1, Math.floor(o.w / 14)); i++) {
        var wx = o.x + i * 14 + (t * 6);
        ctx.beginPath();
        ctx.arc(wx % (o.x + o.w) || o.x, o.y + 2, 2, 0, Math.PI * 2);
        ctx.fill();
      }
      return;
    }
    // Spikes: draw triangles pointing `dir`.
    var n = Math.max(1, Math.floor((o.dir === 'left' || o.dir === 'right' ? o.h : o.w) / 10));
    ctx.beginPath();
    if (o.dir === 'down') {
      var sw = o.w / n;
      for (var i2 = 0; i2 < n; i2++) {
        var x0 = o.x + i2 * sw;
        ctx.moveTo(x0, o.y);
        ctx.lineTo(x0 + sw / 2, o.y + o.h);
        ctx.lineTo(x0 + sw, o.y);
      }
    } else if (o.dir === 'left') {
      var sh = o.h / n;
      for (var i3 = 0; i3 < n; i3++) {
        var y0 = o.y + i3 * sh;
        ctx.moveTo(o.x + o.w, y0);
        ctx.lineTo(o.x, y0 + sh / 2);
        ctx.lineTo(o.x + o.w, y0 + sh);
      }
    } else if (o.dir === 'right') {
      var sh2 = o.h / n;
      for (var i4 = 0; i4 < n; i4++) {
        var y1 = o.y + i4 * sh2;
        ctx.moveTo(o.x, y1);
        ctx.lineTo(o.x + o.w, y1 + sh2 / 2);
        ctx.lineTo(o.x, y1 + sh2);
      }
    } else {
      // up (default)
      var sw2 = o.w / n;
      for (var i5 = 0; i5 < n; i5++) {
        var x1 = o.x + i5 * sw2;
        ctx.moveTo(x1, o.y + o.h);
        ctx.lineTo(x1 + sw2 / 2, o.y);
        ctx.lineTo(x1 + sw2, o.y + o.h);
      }
    }
    ctx.closePath();
    ctx.fill();
  }

  // Solids and platforms render IDENTICALLY — same fill, no per-rect border —
  // so a fake segment is pixel-indistinguishable from a real one. The only
  // decoration is a top-edge highlight flush to the rect's own bounds, so
  // adjacent coplanar tiles read as one continuous surface, not tiled boxes.
  function drawGroundLike(ctx, o, theme) {
    ctx.fillStyle = theme.terrain;
    ctx.fillRect(o.x, o.y, o.w, o.h);
    ctx.fillStyle = theme.terrainTop;
    ctx.fillRect(o.x, o.y, o.w, 2);
  }

  // Shared by `exit` and `decoy` — identical draw path so a decoy is
  // pixel-indistinguishable from the real exit door (30x50). On dark themes
  // (night) a faint light rim is added so the door doesn't melt into the bg;
  // purely cosmetic, geometry/hitbox unchanged.
  function drawDoorLike(ctx, o, theme) {
    ctx.fillStyle = COL_DOOR;
    ctx.fillRect(o.x, o.y, o.w, o.h);
    if (theme && theme.dark) {
      ctx.strokeStyle = 'rgba(255,255,255,0.28)';
      ctx.lineWidth = 1;
      ctx.strokeRect(o.x + 0.5, o.y + 0.5, o.w - 1, o.h - 1);
    }
    ctx.fillStyle = COL_DOOR_HANDLE;
    ctx.beginPath();
    ctx.arc(o.x + o.w - 7, o.y + o.h / 2, 2.2, 0, Math.PI * 2);
    ctx.fill();
  }

  // ---- Decor (v2.2): non-colliding, non-lethal scenery drawn BEHIND solids/
  // hazards/player. Always muted (DECOR_MIX toward bg from a base color) so
  // it never reads as a standable/functional object. All shapes are built
  // from deterministic hashFrac(x-seed) jitter — no RNG per frame, same shape
  // every render.
  function drawDecorCeiling(ctx, o, color) {
    var teeth = Math.max(3, Math.round(o.w / 14));
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(o.x, o.y);
    ctx.lineTo(o.x + o.w, o.y);
    ctx.lineTo(o.x + o.w, o.y + o.h * (0.35 + hashFrac(o.x + o.w) * 0.15));
    for (var i = teeth; i >= 0; i--) {
      var t = i / teeth;
      var jx = o.x + t * o.w;
      var jag = 0.38 + hashFrac(o.x * 0.31 + o.y * 0.07 + i * 7.77) * 0.62;
      ctx.lineTo(jx, o.y + o.h * jag);
    }
    ctx.closePath();
    ctx.fill();
  }
  function drawDecorStalagmite(ctx, o, color) {
    var count = 2 + (hashFrac(o.x * 0.19 + o.y * 0.05) > 0.5 ? 1 : 0);
    ctx.fillStyle = color;
    for (var i = 0; i < count; i++) {
      var t = (i + 0.5) / count;
      var baseX = o.x + t * o.w;
      var spikeW = (o.w / count) * (0.55 + hashFrac(o.x + i * 3.1) * 0.3);
      var spikeH = o.h * (0.55 + hashFrac(o.x + i * 5.2 + 1) * 0.45);
      ctx.beginPath();
      ctx.moveTo(baseX - spikeW / 2, o.y + o.h);
      ctx.lineTo(baseX - spikeW * 0.12, o.y + o.h - spikeH * 0.9);
      ctx.lineTo(baseX, o.y + o.h - spikeH);
      ctx.lineTo(baseX + spikeW * 0.12, o.y + o.h - spikeH * 0.9);
      ctx.lineTo(baseX + spikeW / 2, o.y + o.h);
      ctx.closePath();
      ctx.fill();
    }
  }
  function drawDecorRocks(ctx, o, color) {
    var count = 2 + Math.floor(hashFrac(o.x * 0.71 + o.y * 0.03) * 3); // 2..4
    ctx.fillStyle = color;
    for (var i = 0; i < count; i++) {
      var t = (i + 0.5) / count;
      var rx = (o.w / count) * 0.42 * (0.8 + hashFrac(o.x + i * 9.3) * 0.4);
      var ry = Math.min(o.h * 0.55, rx * 0.75);
      var bx = o.x + t * o.w;
      var by = o.y + o.h - ry * 0.85;
      ctx.beginPath();
      ctx.ellipse(bx, by, rx, ry, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  function drawDecorCrystal(ctx, o, color) {
    var count = 2 + (hashFrac(o.x * 0.33 + o.y * 0.11) > 0.5 ? 1 : 0);
    ctx.fillStyle = color;
    var firstCx = 0, firstCy = 0;
    for (var i = 0; i < count; i++) {
      var t = (i + 0.5) / count;
      var cx = o.x + t * o.w;
      var cy = o.y + o.h * 0.55;
      var w = (o.w / count) * (0.65 + hashFrac(o.x + i * 2.7) * 0.25);
      var h = o.h * (0.55 + hashFrac(o.x + i * 2.2 + 1) * 0.45);
      if (i === 0) { firstCx = cx; firstCy = cy - h * 0.15; }
      ctx.beginPath();
      ctx.moveTo(cx, cy - h / 2);
      ctx.lineTo(cx + w / 2, cy);
      ctx.lineTo(cx, cy + h / 2);
      ctx.lineTo(cx - w / 2, cy);
      ctx.closePath();
      ctx.fill();
    }
    // Faint glint on the first facet — cheap sparkle, no per-frame RNG.
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.beginPath();
    ctx.arc(firstCx - 1, firstCy, 1.3, 0, Math.PI * 2);
    ctx.fill();
  }
  function drawDecor(ctx, o, theme) {
    var color;
    if (o.variant === 'crystal') {
      color = mixColor(theme.accent, theme.bg, DECOR_MIX);
      drawDecorCrystal(ctx, o, color);
      return;
    }
    color = mixColor(theme.terrain, theme.bg, DECOR_MIX);
    if (o.variant === 'stalagmite') drawDecorStalagmite(ctx, o, color);
    else if (o.variant === 'rocks') drawDecorRocks(ctx, o, color);
    else drawDecorCeiling(ctx, o, color); // 'ceiling' + default
  }

  // ---- Auto rock lip (v2.2): every visible dir:'down' ice hazard gets a
  // small jagged rock attachment strip drawn directly above it, BEHIND the
  // icicle shards, so no hanging icicle ever floats in open air — even in
  // levels that add no explicit ceiling geometry. Skipped when a visible
  // solid/decor already sits flush above (same overlap rule the level
  // validator uses) to avoid a double-draw seam.
  function hasCoverAbove(objects, hz) {
    for (var i = 0; i < objects.length; i++) {
      var s = objects[i];
      if (s === hz || s.hidden) continue;
      if (s.type !== 'solid' && s.type !== 'decor') continue;
      if (Math.abs((s.y + s.h) - hz.y) <= 6 && s.x < hz.x + hz.w && s.x + s.w > hz.x) return true;
    }
    return false;
  }
  function drawRockLip(ctx, hz, color) {
    var lipH = 10, pad = 4;
    var lx = hz.x - pad, lw = hz.w + pad * 2;
    var topY = hz.y - lipH, botY = hz.y;
    var teeth = Math.max(4, Math.round(lw / 9));
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(lx, topY);
    ctx.lineTo(lx + lw, topY);
    ctx.lineTo(lx + lw, botY - lipH * 0.35);
    for (var i = teeth; i >= 0; i--) {
      var t = i / teeth;
      var tx = lx + t * lw;
      var jag = hashFrac(hz.x * 0.37 + hz.y * 0.11 + i * 5.13);
      var ty = botY - lipH * 0.1 - jag * lipH * 0.55;
      ctx.lineTo(tx, ty);
    }
    ctx.closePath();
    ctx.fill();
  }

  // ---- Spring (v2.2): coiled bounce pad. Renders 2-3 coil lines + a top
  // plate; a squash-then-extend animation plays on launch (o._animTimer,
  // driven by updateMovers()/launchSpring() — purely cosmetic).
  function drawSpring(ctx, o, theme) {
    var w = o.w, h = o.h;
    var squash = 0;
    if (o._animTimer > 0) {
      var dur = o._animDur || 0.22;
      var tt = 1 - o._animTimer / dur;
      squash = tt < 0.4 ? (tt / 0.4) : Math.max(0, 1 - (tt - 0.4) / 0.6);
    }
    var plateH = Math.max(3, h * 0.26);
    var coilTop = o.y + squash * plateH * 0.9;
    var coilBottom = o.y + h - plateH;
    // Base plate (fixed to the floor).
    ctx.fillStyle = theme.terrain;
    ctx.fillRect(o.x, o.y + h - plateH, w, plateH);
    // Coil lines — 3 gentle zigzags between base and (squash-compressed) top.
    ctx.strokeStyle = theme.terrain;
    ctx.lineWidth = 2;
    var coils = 3;
    for (var i = 0; i < coils; i++) {
      var ty = coilTop + ((i + 0.6) / coils) * (coilBottom - coilTop);
      ctx.beginPath();
      ctx.moveTo(o.x + 2, ty);
      ctx.lineTo(o.x + w * 0.3, ty - 2.2);
      ctx.lineTo(o.x + w * 0.7, ty + 2.2);
      ctx.lineTo(o.x + w - 2, ty);
      ctx.stroke();
    }
    // Top plate + red accent line (fixed warning red, not theme-tinted).
    var topPlateH = Math.max(2, plateH * 0.6);
    ctx.fillStyle = theme.terrain;
    ctx.fillRect(o.x, coilTop, w, topPlateH);
    ctx.fillStyle = COL_SPRING_ACCENT;
    ctx.fillRect(o.x, coilTop, w, 2);
  }

  // ---- Ambient theme decor (v2.2): sparse, cosmetic, deterministic from
  // animTime (no persisted state, no per-frame RNG). Drawn once per theme,
  // behind everything else.
  function drawAmbient(ctx, theme, themeName, animTime, canvasW, canvasH) {
    var i, seed;
    if (themeName === 'icecave') {
      var n = 7;
      for (i = 0; i < n; i++) {
        seed = i * 97.13;
        var x = hashFrac(seed) * canvasW;
        var len = 10 + hashFrac(seed + 1) * 14;
        var baseHalf = 2 + hashFrac(seed + 2) * 1.3;
        ctx.globalAlpha = 0.14 + hashFrac(seed + 3) * 0.08;
        drawIcicleShardAt(ctx, x, 0, 0, 1, len, baseHalf, false);
      }
      ctx.globalAlpha = 1;
    } else if (themeName === 'lava') {
      var n2 = 9;
      for (i = 0; i < n2; i++) {
        seed = i * 53.7;
        var laneX = hashFrac(seed) * canvasW;
        var speed = 20 + hashFrac(seed + 1) * 18;
        var cyc = canvasH + 20;
        var y = cyc - ((animTime * speed + hashFrac(seed + 2) * cyc) % cyc);
        var wob = Math.sin(animTime * 1.3 + seed) * 6;
        var r = 1.1 + hashFrac(seed + 3) * 1.3;
        var alpha = 0.22 + 0.16 * Math.sin(animTime * 2 + seed);
        ctx.globalAlpha = Math.max(0.05, alpha);
        ctx.fillStyle = theme.accent;
        ctx.beginPath();
        ctx.arc(laneX + wob, y, r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    } else if (themeName === 'night') {
      var n3 = 14;
      for (i = 0; i < n3; i++) {
        seed = i * 71.9;
        var sx = hashFrac(seed) * canvasW;
        var sy = hashFrac(seed + 1) * canvasH * 0.5;
        var tw = 0.35 + 0.35 * Math.sin(animTime * 1.6 + seed);
        ctx.globalAlpha = Math.max(0.12, tw);
        ctx.fillStyle = '#eef2f8';
        var sz = 1 + hashFrac(seed + 2);
        ctx.fillRect(sx, sy, sz, sz);
      }
      ctx.globalAlpha = 1;
    }
  }

  Engine.prototype.render = function () {
    var ctx = this.ctx;
    var theme = getTheme(this.levelDef);
    var themeName = (this.levelDef && this.levelDef.theme) || 'plain';
    ctx.save();
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
    ctx.fillStyle = theme.bg;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    // Sparse ambient theme decor (icicle silhouettes / embers / stars) —
    // behind everything, purely cosmetic.
    drawAmbient(ctx, theme, themeName, this.animTime, CANVAS_W, CANVAS_H);

    if (this.shake.ttl > 0) {
      var falloff = this.shake.ttl / this.shake.dur;
      var amt = this.shake.mag * falloff;
      ctx.translate((Math.random() * 2 - 1) * amt, (Math.random() * 2 - 1) * amt);
    }

    var i;
    // Pass 1: decor — non-colliding cave scenery, BEHIND solids/hazards/player.
    for (i = 0; i < this.objects.length; i++) {
      var od = this.objects[i];
      if (od.hidden || od.type !== 'decor') continue;
      drawDecor(ctx, od, theme);
    }
    // Pass 2: auto rock lip — for every visible dir:'down' ice hazard with no
    // solid/decor flush above it, draw a small attachment strip BEHIND the
    // icicle shards themselves (drawn in pass 3 below).
    var rockLipColor = mixColor(theme.terrain, '#000000', 0.28);
    for (i = 0; i < this.objects.length; i++) {
      var oh = this.objects[i];
      if (oh.hidden || oh.type !== 'hazard' || oh.variant !== 'ice' || oh.dir !== 'down') continue;
      if (hasCoverAbove(this.objects, oh)) continue;
      drawRockLip(ctx, oh, rockLipColor);
    }
    // Pass 3: solids/platforms, hazards (icicles now sit on their rock lip),
    // springs, exit/decoy doors.
    for (i = 0; i < this.objects.length; i++) {
      var o = this.objects[i];
      if (o.hidden) continue;
      if (o.type === 'solid' || o.type === 'platform') {
        drawGroundLike(ctx, o, theme);
      } else if (o.type === 'hazard') {
        drawHazard(ctx, o, this.animTime);
      } else if (o.type === 'spring') {
        drawSpring(ctx, o, theme);
      } else if (o.type === 'exit' || o.type === 'decoy') {
        drawDoorLike(ctx, o, theme);
      }
      // trigger: invisible (no render)
    }

    // Projectiles — rendered as tapered icicle shards (same 24x6 hitbox).
    for (i = 0; i < this.projectiles.length; i++) {
      var pr = this.projectiles[i];
      ctx.save();
      ctx.translate(pr.x + pr.w / 2, pr.y + pr.h / 2);
      ctx.rotate(pr.angle);
      drawIcicleShardLocal(ctx, pr.w, pr.h / 2, false);
      ctx.restore();
    }
    // Trailing sparkle (small white diamonds).
    for (i = 0; i < this.sparkles.length; i++) {
      var sp = this.sparkles[i];
      var spAl = Math.max(0, sp.ttl / sp.dur);
      ctx.save();
      ctx.translate(sp.x, sp.y);
      ctx.rotate(Math.PI / 4);
      ctx.globalAlpha = spAl * 0.9;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-1.4, -1.4, 2.8, 2.8);
      ctx.restore();
      ctx.globalAlpha = 1;
    }
    // Icicle shatter FX (impact / off-screen despawn).
    for (i = 0; i < this.shatters.length; i++) {
      var sh = this.shatters[i];
      var shAl = Math.max(0, sh.ttl / sh.dur);
      ctx.save();
      ctx.translate(sh.x, sh.y);
      ctx.rotate(sh.rot);
      ctx.globalAlpha = shAl;
      ctx.fillStyle = COL_ICE_FILL_LT;
      ctx.beginPath();
      ctx.moveTo(-sh.w / 2, -sh.h / 2); ctx.lineTo(sh.w / 2, 0); ctx.lineTo(-sh.w / 2, sh.h / 2);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
      ctx.globalAlpha = 1;
    }

    // Player / ragdoll.
    if (this.dying) {
      for (i = 0; i < this.particles.length; i++) {
        var pt = this.particles[i];
        ctx.save();
        ctx.translate(pt.x, pt.y);
        ctx.rotate(pt.rot);
        if (pt.kind === 'head') {
          ctx.fillStyle = COL_HEAD_FILL;
          ctx.beginPath();
          ctx.ellipse(0, 0, pt.w / 2, pt.h / 2, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = COL_PLAYER;
          ctx.lineWidth = 1.4;
          ctx.stroke();
          // Grumpy X eyes + frown, even in death.
          ctx.strokeStyle = COL_FACE;
          ctx.lineWidth = 1.1;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(-3.2, -2.2); ctx.lineTo(-1, -0.2); ctx.moveTo(-1, -2.2); ctx.lineTo(-3.2, -0.2);
          ctx.moveTo(1, -2.2); ctx.lineTo(3.2, -0.2); ctx.moveTo(3.2, -2.2); ctx.lineTo(1, -0.2);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(-2, 3); ctx.quadraticCurveTo(0, 1.4, 2, 3);
          ctx.stroke();
        } else {
          ctx.fillStyle = theme.playerFill;
          if (ctx.roundRect) {
            ctx.beginPath();
            ctx.roundRect(-pt.w / 2, -pt.h / 2, pt.w, pt.h, 1.4);
            ctx.fill();
          } else {
            ctx.fillRect(-pt.w / 2, -pt.h / 2, pt.w, pt.h);
          }
        }
        ctx.restore();
      }
    } else {
      drawStickman(ctx, this.player, this.animTime, this.cleared, theme);
    }

    // Reveal pop FX.
    for (i = 0; i < this.pops.length; i++) {
      var pp = this.pops[i];
      var t2 = 1 - pp.ttl / pp.dur;
      ctx.strokeStyle = 'rgba(' + COL_POP + ',' + (1 - t2) + ')';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(pp.x, pp.y, 6 + t2 * 22, 0, Math.PI * 2);
      ctx.stroke();
    }

    // In-canvas level toasts (from `msg` trigger action).
    if (this.toasts.length > 0) {
      var ty = 70;
      for (i = 0; i < this.toasts.length; i++) {
        var to = this.toasts[i];
        var alpha = Math.min(1, to.ttl / 0.3);
        ctx.font = 'bold 20px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = 'rgba(20,20,20,' + (0.82 * alpha) + ')';
        var tw = ctx.measureText(to.text).width;
        ctx.fillRect(CANVAS_W / 2 - tw / 2 - 12, ty - 20, tw + 24, 32);
        ctx.fillStyle = 'rgba(255,255,255,' + alpha + ')';
        ctx.fillText(to.text, CANVAS_W / 2, ty + 2);
        ty += 40;
      }
    }

    ctx.restore();

    // Brief comedic death flash, drawn outside the shake transform so it
    // reads as a clean full-screen hit rather than a jittery one.
    if (this.deathFlash && this.deathFlash.ttl > 0) {
      var fa = this.deathFlash.ttl / this.deathFlash.dur;
      ctx.fillStyle = 'rgba(255,255,255,' + (0.6 * fa) + ')';
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    }
  };

  Engine.prototype.start = function () {
    if (this._loopStarted) return;
    this._loopStarted = true;
    var self = this;
    function frame(now) {
      requestAnimationFrame(frame);
      if (self._lastTime == null) self._lastTime = now;
      var dt = (now - self._lastTime) / 1000;
      self._lastTime = now;
      if (dt > MAX_FRAME_DT) dt = MAX_FRAME_DT;
      self.accumulator += dt;
      while (self.accumulator >= FIXED_DT) {
        if (self.active) self.update(FIXED_DT);
        self.accumulator -= FIXED_DT;
      }
      self.render();
    }
    requestAnimationFrame(frame);
  };

  window.Engine = Engine;
})();
