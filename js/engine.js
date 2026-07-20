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
    this.shake = { mag: 0, ttl: 0, dur: 0.0001 };
    this.deathFlash = { ttl: 0, dur: 0.12 };
    this.levelTime = 0;
    this.dying = false;
    this.deathTimer = 0;
    this.cleared = false;
    this.invertTimer = 0; // 'invert' action: seconds remaining of flipped L/R input; resets on death/load
    this.player = {
      x: levelDef.spawn.x, y: levelDef.spawn.y, vx: 0, vy: 0,
      grounded: false, groundObj: null, facing: 1,
      coyoteTimer: 0, jumpBufferTimer: 0, alive: true
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
      if (!o.hidden && (o.type === 'solid' || o.type === 'platform')) out.push(o);
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

  Engine.prototype.spawnRagdoll = function () {
    this.particles = [];
    var cx = this.player.x + PLAYER_W / 2, cy = this.player.y + PLAYER_H / 2;
    for (var i = 0; i < 7; i++) {
      var ang = (Math.PI * 2 * i / 7) + Math.random() * 0.6;
      var speed = 80 + Math.random() * 170;
      this.particles.push({
        x: cx, y: cy,
        vx: Math.cos(ang) * speed, vy: Math.sin(ang) * speed - 120,
        rot: Math.random() * Math.PI, vrot: (Math.random() - 0.5) * 12,
        len: 6 + Math.random() * 9
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
            w: 24, h: 6, angle: Math.atan2(dir.y, dir.x)
          });
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
    var solids = this.collidables();
    for (var i = 0; i < solids.length; i++) {
      var s = solids[i];
      if (rectOverlap(p.x, p.y, PLAYER_W, PLAYER_H, s.x, s.y, s.w, s.h)) {
        if (p.vy > 0) { p.y = s.y - PLAYER_H; p.vy = 0; p.grounded = true; newGroundObj = s; }
        else if (p.vy < 0) { p.y = s.y + s.h; p.vy = 0; }
        else {
          var overlapTop = (p.y + PLAYER_H) - s.y;
          var overlapBottom = (s.y + s.h) - p.y;
          if (overlapTop < overlapBottom) { p.y = s.y - PLAYER_H; p.grounded = true; newGroundObj = s; }
          else { p.y = s.y + s.h; }
        }
      }
    }
    p.groundObj = newGroundObj;
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

    // Projectiles.
    for (var j = this.projectiles.length - 1; j >= 0; j--) {
      var pr = this.projectiles[j];
      pr.x += pr.vx * dt; pr.y += pr.vy * dt;
      if (pr.x < -60 || pr.x > CANVAS_W + 60 || pr.y < -60 || pr.y > CANVAS_H + 60) {
        this.projectiles.splice(j, 1);
        continue;
      }
      if (rectOverlap(p.x, p.y, PLAYER_W, PLAYER_H, pr.x, pr.y, pr.w, pr.h)) {
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
      }
      return;
    }

    this.stepPhysics(dt);
  };

  // ---- Rendering ----

  function drawStickman(ctx, p, animTime) {
    var cx = p.x + PLAYER_W / 2;
    var headR = 6;
    var headCY = p.y + headR + 1;
    var neckY = p.y + headR * 2 + 2;
    var hipY = p.y + 26;
    var feetY = p.y + PLAYER_H;
    var dir = p.facing || 1;

    ctx.strokeStyle = COL_PLAYER;
    ctx.fillStyle = COL_PLAYER;
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';

    ctx.beginPath(); ctx.arc(cx, headCY, headR, 0, Math.PI * 2); ctx.fill();

    ctx.beginPath(); ctx.moveTo(cx, neckY); ctx.lineTo(cx, hipY); ctx.stroke();

    if (!p.grounded) {
      ctx.beginPath(); ctx.moveTo(cx, hipY); ctx.lineTo(cx + 5 * dir, feetY - 5); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx, hipY); ctx.lineTo(cx - 3 * dir, feetY); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx, neckY); ctx.lineTo(cx + 8 * dir, neckY - 8); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx, neckY); ctx.lineTo(cx - 5 * dir, neckY + 5); ctx.stroke();
    } else if (Math.abs(p.vx) > 1) {
      var swing = Math.sin(animTime * 16) * 10;
      ctx.beginPath(); ctx.moveTo(cx, hipY); ctx.lineTo(cx + swing, feetY); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx, hipY); ctx.lineTo(cx - swing, feetY); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx, neckY); ctx.lineTo(cx - swing * 0.8, neckY + 10); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx, neckY); ctx.lineTo(cx + swing * 0.8, neckY + 10); ctx.stroke();
    } else {
      var bob = Math.sin(animTime * 3) * 1.5;
      ctx.beginPath(); ctx.moveTo(cx, hipY); ctx.lineTo(cx + 4, feetY); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx, hipY); ctx.lineTo(cx - 4, feetY); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx, neckY); ctx.lineTo(cx + 5, neckY + 10 + bob); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx, neckY); ctx.lineTo(cx - 5, neckY + 10 - bob); ctx.stroke();
    }
  }

  function drawHazard(ctx, o) {
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
  function drawGroundLike(ctx, o) {
    ctx.fillStyle = COL_SOLID;
    ctx.fillRect(o.x, o.y, o.w, o.h);
    ctx.fillStyle = COL_SOLID_TOP;
    ctx.fillRect(o.x, o.y, o.w, 2);
  }

  // Shared by `exit` and `decoy` — identical draw path so a decoy is
  // pixel-indistinguishable from the real exit door (30x50).
  function drawDoorLike(ctx, o) {
    ctx.fillStyle = COL_DOOR;
    ctx.fillRect(o.x, o.y, o.w, o.h);
    ctx.fillStyle = COL_DOOR_HANDLE;
    ctx.beginPath();
    ctx.arc(o.x + o.w - 7, o.y + o.h / 2, 2.2, 0, Math.PI * 2);
    ctx.fill();
  }

  Engine.prototype.render = function () {
    var ctx = this.ctx;
    ctx.save();
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
    ctx.fillStyle = COL_BG;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    if (this.shake.ttl > 0) {
      var falloff = this.shake.ttl / this.shake.dur;
      var amt = this.shake.mag * falloff;
      ctx.translate((Math.random() * 2 - 1) * amt, (Math.random() * 2 - 1) * amt);
    }

    var i;
    for (i = 0; i < this.objects.length; i++) {
      var o = this.objects[i];
      if (o.hidden) continue;
      if (o.type === 'solid' || o.type === 'platform') {
        drawGroundLike(ctx, o);
      } else if (o.type === 'hazard') {
        drawHazard(ctx, o);
      } else if (o.type === 'exit' || o.type === 'decoy') {
        drawDoorLike(ctx, o);
      }
      // trigger: invisible (no render)
    }

    // Projectiles.
    ctx.fillStyle = COL_PROJECTILE;
    for (i = 0; i < this.projectiles.length; i++) {
      var pr = this.projectiles[i];
      ctx.save();
      ctx.translate(pr.x + pr.w / 2, pr.y + pr.h / 2);
      ctx.rotate(pr.angle);
      ctx.fillRect(-pr.w / 2, -pr.h / 2, pr.w, pr.h);
      ctx.beginPath();
      ctx.moveTo(pr.w / 2, -pr.h);
      ctx.lineTo(pr.w / 2 + 6, 0);
      ctx.lineTo(pr.w / 2, pr.h);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    // Player / ragdoll.
    if (this.dying) {
      ctx.strokeStyle = COL_PLAYER;
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      for (i = 0; i < this.particles.length; i++) {
        var pt = this.particles[i];
        ctx.save();
        ctx.translate(pt.x, pt.y);
        ctx.rotate(pt.rot);
        ctx.beginPath();
        ctx.moveTo(-pt.len / 2, 0);
        ctx.lineTo(pt.len / 2, 0);
        ctx.stroke();
        ctx.restore();
      }
    } else {
      drawStickman(ctx, this.player, this.animTime);
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
