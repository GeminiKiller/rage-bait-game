// Stickman Rage — WebAudio oscillator SFX. No external files.
(function () {
  'use strict';

  var ctx = null;
  var master = null;

  function ensureCtx() {
    if (ctx) return ctx;
    try {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0.25;
      master.connect(ctx.destination);
    } catch (e) {
      ctx = null;
    }
    return ctx;
  }

  function resume() {
    var c = ensureCtx();
    if (c && c.state !== 'running') {
      // 'suspended' on all browsers pre-gesture; iOS can also report
      // 'interrupted' after calls/backgrounding — resume() covers both.
      c.resume().catch(function () {});
    }
  }

  // Arm resume/creation on user gestures. NOT one-shot: mobile browsers
  // (iOS especially) may reject the first resume or re-suspend later, so we
  // keep listening until the context is actually running — and re-arm on
  // visibility changes, which can re-suspend the context.
  var GESTURES = ['click', 'keydown', 'pointerdown', 'touchstart', 'touchend'];
  function onGesture() {
    resume();
    if (ctx && ctx.state === 'running') {
      for (var i = 0; i < GESTURES.length; i++) window.removeEventListener(GESTURES[i], onGesture);
    }
  }
  for (var gi = 0; gi < GESTURES.length; gi++) window.addEventListener(GESTURES[gi], onGesture);
  document.addEventListener('visibilitychange', function () {
    if (!document.hidden && ctx && ctx.state !== 'running') {
      // Context may need a fresh gesture; re-arm the listeners.
      for (var i = 0; i < GESTURES.length; i++) window.addEventListener(GESTURES[i], onGesture);
    }
  });

  function tone(freq, startTime, dur, opts) {
    if (!ctx || !master) return;
    opts = opts || {};
    var type = opts.type || 'square';
    var vol = opts.vol != null ? opts.vol : 1;
    var freqEnd = opts.freqEnd;
    var osc = ctx.createOscillator();
    var gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, startTime);
    if (freqEnd != null) {
      osc.frequency.linearRampToValueAtTime(freqEnd, startTime + dur);
    }
    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.linearRampToValueAtTime(vol, startTime + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + dur);
    osc.connect(gain);
    gain.connect(master);
    osc.start(startTime);
    osc.stop(startTime + dur + 0.02);
  }

  var SFX = {
    jump: function () {
      if (!ctx) return;
      var t = ctx.currentTime;
      tone(520, t, 0.11, { type: 'square', vol: 0.5, freqEnd: 780 });
    },
    death: function () {
      if (!ctx) return;
      var t = ctx.currentTime;
      // Comedic splat: two quick discordant descending piano-like notes
      // (a tritone apart), not a harsh buzzer.
      tone(293.66, t, 0.13, { type: 'triangle', vol: 0.55 });
      tone(207.65, t + 0.07, 0.24, { type: 'sine', vol: 0.5, freqEnd: 150 });
    },
    levelClear: function () {
      if (!ctx) return;
      var t = ctx.currentTime;
      tone(523.25, t, 0.14, { type: 'triangle', vol: 0.5 });
      tone(783.99, t + 0.13, 0.22, { type: 'triangle', vol: 0.55 });
    },
    reveal: function () {
      if (!ctx) return;
      var t = ctx.currentTime;
      // Subtle mechanical click/whoosh for a trap firing — quiet and low,
      // never a bright chirp that would pre-warn the player.
      tone(150, t, 0.045, { type: 'square', vol: 0.10, freqEnd: 95 });
      tone(85, t + 0.015, 0.09, { type: 'sine', vol: 0.14, freqEnd: 45 });
    },
    warp: function () {
      if (!ctx) return;
      var t = ctx.currentTime;
      // Short, deterministic click for the 'warp' teleport action.
      tone(900, t, 0.045, { type: 'square', vol: 0.22, freqEnd: 1400 });
    },
    shoot: function () {
      if (!ctx) return;
      var t = ctx.currentTime;
      // Short glassy "shink" for icicle projectiles — a high, subtle ping,
      // not a harsh twang.
      tone(1900, t, 0.05, { type: 'sine', vol: 0.14, freqEnd: 2700 });
      tone(2700, t + 0.018, 0.06, { type: 'triangle', vol: 0.09, freqEnd: 3300 });
    },
    boing: function () {
      if (!ctx) return;
      var t = ctx.currentTime;
      // Quiet springy rising blip for the 'spring' launch object.
      tone(300, t, 0.09, { type: 'sine', vol: 0.16, freqEnd: 640 });
      tone(640, t + 0.05, 0.07, { type: 'triangle', vol: 0.11, freqEnd: 920 });
    },
    // ---- v3 wave 2 ----
    doorThunk: function () {
      if (!ctx) return;
      var t = ctx.currentTime;
      // Low, quiet thud for a timed door slamming shut.
      tone(90, t, 0.16, { type: 'sine', vol: 0.32, freqEnd: 52 });
      tone(60, t + 0.02, 0.12, { type: 'triangle', vol: 0.2, freqEnd: 38 });
    },
    keyChime: function () {
      if (!ctx) return;
      var t = ctx.currentTime;
      // Two quick bright notes for collecting a key.
      tone(1046.5, t, 0.09, { type: 'sine', vol: 0.22 });
      tone(1568, t + 0.07, 0.13, { type: 'sine', vol: 0.2 });
    },
    fakeClearRip: function () {
      if (!ctx) return;
      var t = ctx.currentTime;
      // Descending buzz/scratch for the fake LEVEL CLEAR overlay ripping away.
      tone(700, t, 0.32, { type: 'sawtooth', vol: 0.2, freqEnd: 90 });
      tone(520, t + 0.02, 0.28, { type: 'square', vol: 0.13, freqEnd: 60 });
    },
    victory: function () {
      if (!ctx) return;
      var t = ctx.currentTime;
      var notes = [523.25, 659.25, 783.99, 1046.5];
      for (var i = 0; i < notes.length; i++) {
        tone(notes[i], t + i * 0.14, 0.2, { type: 'triangle', vol: 0.55 });
      }
    }
  };

  // ---- Background music: light procedural chiptune loop ----
  // Mischievous minor-key vamp. Quiet by design — texture, not a headline.
  var music = { on: false, timer: null, nextStep: 0, nextTime: 0 };
  var STEP = 60 / 112 / 2; // 112 BPM, 8th notes
  var BASS = [110, 0, 110, 0, 82.41, 0, 87.31, 0, 110, 0, 110, 0, 130.81, 0, 123.47, 0];
  var LEAD = [0, 440, 0, 523.25, 0, 0, 415.3, 0, 0, 440, 0, 587.33, 523.25, 0, 493.88, 0];

  function scheduleMusic() {
    if (!music.on || !ctx) return;
    var horizon = ctx.currentTime + 0.25;
    while (music.nextTime < horizon) {
      var i = music.nextStep % 16;
      if (BASS[i]) tone(BASS[i], music.nextTime, STEP * 0.9, { type: 'triangle', vol: 0.11 });
      if (LEAD[i]) tone(LEAD[i], music.nextTime, STEP * 0.55, { type: 'square', vol: 0.045 });
      music.nextStep++;
      music.nextTime += STEP;
    }
  }

  function startMusic() {
    if (music.on) return;
    music.on = true;
    var c = ensureCtx();
    if (c) {
      music.nextStep = 0;
      music.nextTime = c.currentTime + 0.05;
    }
    if (!music.timer) music.timer = setInterval(function () {
      if (!ctx || ctx.state !== 'running') return;
      if (music.nextTime === 0) { music.nextTime = ctx.currentTime + 0.05; }
      scheduleMusic();
    }, 100);
  }

  function stopMusic() {
    music.on = false;
    if (music.timer) { clearInterval(music.timer); music.timer = null; }
    music.nextTime = 0;
  }

  // ---- Mute toggle (persisted) ----
  var MUTE_KEY = 'stickmanrage.muted';
  function isMuted() {
    try { return localStorage.getItem(MUTE_KEY) === '1'; } catch (e) { return false; }
  }
  function applyMute() {
    if (master) master.gain.value = isMuted() ? 0 : 0.25;
  }
  function toggleMute() {
    try { localStorage.setItem(MUTE_KEY, isMuted() ? '0' : '1'); } catch (e) {}
    applyMute();
    return isMuted();
  }
  // ensureCtx creates master after this file runs — re-apply once created.
  var _origEnsure = ensureCtx;
  ensureCtx = function () { var c = _origEnsure(); applyMute(); return c; };

  window.STICKAUDIO = {
    ensureCtx: ensureCtx,
    resume: resume,
    sfx: SFX,
    startMusic: startMusic,
    stopMusic: stopMusic,
    toggleMute: toggleMute,
    isMuted: isMuted
  };
})();
