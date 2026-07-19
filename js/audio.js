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
    if (c && c.state === 'suspended') {
      c.resume().catch(function () {});
    }
  }

  // Arm resume/creation on first user gesture.
  window.addEventListener('click', resume, { once: true });
  window.addEventListener('keydown', resume, { once: true });
  window.addEventListener('touchstart', resume, { once: true });

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
      // Descending square buzzer.
      tone(280, t, 0.14, { type: 'square', vol: 0.6, freqEnd: 140 });
      tone(180, t + 0.1, 0.22, { type: 'square', vol: 0.55, freqEnd: 60 });
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
      tone(220, t, 0.06, { type: 'sine', vol: 0.4, freqEnd: 440 });
      tone(660, t + 0.05, 0.07, { type: 'square', vol: 0.25 });
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

  window.STICKAUDIO = {
    ensureCtx: ensureCtx,
    resume: resume,
    sfx: SFX
  };
})();
