// Stickman Rage — main.js: state machine, HUD, persistence, input.
(function () {
  'use strict';

  // ---- Dev fallback level (exercises every object type + every trigger action) ----
  var DEV_LEVEL = {
    name: 'DEV: Everything Test',
    label: 'DEV',
    deathMsgs: ['Dev level says hi.', 'You broke the test level.'],
    spawn: { x: 40, y: 440 },
    exit: { x: 900, y: 430 },
    objects: [
      { id: 'floor1', type: 'solid', x: 0, y: 480, w: 220, h: 60 },
      { type: 'hazard', x: 220, y: 460, w: 60, h: 20, variant: 'spikes', dir: 'up' },
      { id: 'floor2', type: 'solid', x: 280, y: 480, w: 140, h: 60 },
      {
        id: 't1', type: 'trigger', x: 300, y: 440, w: 20, h: 40, once: true, delay: 0.15,
        actions: [
          { do: 'msg', text: 'Incoming!' },
          { do: 'reveal', target: 'popStep' },
          { do: 'shake' }
        ]
      },
      { id: 'popStep', type: 'solid', x: 420, y: 450, w: 60, h: 20, hidden: true },
      { id: 'floor3', type: 'solid', x: 480, y: 480, w: 120, h: 60 },
      { id: 't2', type: 'trigger', x: 500, y: 440, w: 20, h: 40, once: true, actions: [{ do: 'hide', target: 'floor1' }] },
      { type: 'hazard', x: 340, y: 380, w: 40, h: 16, variant: 'lava', dir: 'down' },
      { type: 'hazard', x: 230, y: 380, w: 16, h: 40, variant: 'spikes', dir: 'left' },
      { type: 'hazard', x: 250, y: 380, w: 16, h: 40, variant: 'spikes', dir: 'right' },
      {
        id: 'plat1', type: 'platform', x: 610, y: 460, w: 80, h: 16,
        path: [{ x: 700, y: 460 }], speed: 100, mode: 'pingpong', startOnTrigger: true
      },
      { id: 't3', type: 'trigger', x: 590, y: 440, w: 15, h: 40, once: true, actions: [{ do: 'start', target: 'plat1' }] },
      { type: 'hazard', x: 600, y: 525, w: 180, h: 15, variant: 'lava', dir: 'up' },
      { id: 'floor4', type: 'solid', x: 780, y: 480, w: 100, h: 60 },
      {
        id: 't4', type: 'trigger', x: 800, y: 440, w: 15, h: 40, once: false,
        actions: [{ do: 'shoot', from: { x: 960, y: 350 }, dir: { x: -1, y: 0 }, speed: 400 }]
      },
      { id: 'wall1', type: 'solid', x: 860, y: 200, w: 20, h: 340 },
      {
        id: 't5', type: 'trigger', x: 820, y: 440, w: 15, h: 40, once: true,
        actions: [
          { do: 'msg', text: 'Wall slides away!' },
          { do: 'move', target: 'wall1', to: { x: 1100, y: 200 }, speed: 400 }
        ]
      },
      { id: 'floor5', type: 'solid', x: 880, y: 480, w: 80, h: 60 }
    ]
  };

  var GLOBAL_TAUNTS = [
    'Skill issue.', 'Did you mean to do that?', 'Even the tutorial was shorter.',
    "That's cool, try not dying next time.", 'Wow, you made the spikes happy.',
    'Physics sends their regards.', 'You had ONE job.', 'Is this your first video game?',
    'The spike is undefeated.', 'Gravity: 1, You: 0', 'Press jump to continue being bad.',
    'That looked intentional.', 'Ten more tries should do it.', 'Speedrunners hate this one trick.',
    'Patience mode: activated.', "You're learning! Slowly.", 'Better luck next life.',
    'The void has spoken.', "That's what I would've done wrong too.",
    'One more try. You know you want to.'
  ];

  var LEVELS = [].concat(window.LEVELS_A || [], window.LEVELS_B || []);
  if (LEVELS.length === 0) {
    LEVELS = [DEV_LEVEL];
  }

  // ---- Persistence ----
  var LS_PREFIX = 'stickmanrage.';
  function lsGet(key, def) {
    try {
      var v = localStorage.getItem(LS_PREFIX + key);
      return v == null ? def : JSON.parse(v);
    } catch (e) { return def; }
  }
  function lsSet(key, val) {
    try { localStorage.setItem(LS_PREFIX + key, JSON.stringify(val)); } catch (e) { /* ignore */ }
  }

  var totalDeaths = lsGet('totalDeaths', 0);
  var levelDeaths = lsGet('levelDeaths', {});
  var bestTimeMs = lsGet('bestTimeMs', {});
  var furthestLevel = lsGet('furthestLevel', 0);

  // ---- DOM ----
  var canvas = document.getElementById('game');
  var stage = document.getElementById('stage');
  var hud = document.getElementById('hud');
  var hudLevelNum = document.getElementById('hud-levelnum');
  var hudName = document.getElementById('hud-name');
  var hudTimer = document.getElementById('hud-timer');
  var hudDeaths = document.getElementById('hud-deaths');
  var toastDeath = document.getElementById('toast-death');
  var overlayTitle = document.getElementById('overlay-title');
  var overlayClear = document.getElementById('overlay-clear');
  var overlayVictory = document.getElementById('overlay-victory');
  var levelSelectDiv = document.getElementById('level-select');
  var titleTotalDeaths = document.getElementById('title-total-deaths');
  var victoryDeaths = document.getElementById('victory-deaths');
  var victoryTime = document.getElementById('victory-time');
  var victoryLevels = document.getElementById('victory-levels');
  var btnCopy = document.getElementById('btn-copy-suffering');
  var btnBackTitle = document.getElementById('btn-back-title');
  var touchControls = document.getElementById('touch-controls');
  var btnLeft = document.getElementById('btn-left');
  var btnRight = document.getElementById('btn-right');
  var btnJump = document.getElementById('btn-jump');

  var isTouch = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;

  var engine = new window.Engine(canvas);

  // ---- Runtime session state ----
  var state = 'title'; // title | playing | clear | victory
  var currentLevelIndex = 0;
  var sessionDeaths = 0;
  var sessionStartTime = 0;
  var levelStartTime = 0;
  var toastTimer = null;
  var clearAdvanceTimer = null;
  var nameFlashTimer = null;

  function fmtTime(ms) {
    var s = Math.max(0, Math.floor(ms / 1000));
    var mm = Math.floor(s / 60);
    var ss = s % 60;
    return (mm < 10 ? '0' : '') + mm + ':' + (ss < 10 ? '0' : '') + ss;
  }

  function setState(s) {
    state = s;
    overlayTitle.classList.toggle('show', s === 'title');
    overlayClear.classList.toggle('show', s === 'clear');
    overlayVictory.classList.toggle('show', s === 'victory');
    hud.style.display = (s === 'playing') ? 'flex' : 'none';
    if (s !== 'playing') {
      hudName.classList.remove('show');
      if (nameFlashTimer) { clearTimeout(nameFlashTimer); nameFlashTimer = null; }
    }
    touchControls.classList.toggle('show', isTouch && s === 'playing');
    if (s === 'title') renderLevelSelect();
  }

  function updateHud() {
    hudLevelNum.textContent = String(currentLevelIndex + 1);
    hudDeaths.textContent = String(sessionDeaths);
  }

  function flashLevelName() {
    var lvl = LEVELS[currentLevelIndex];
    hudName.textContent = (currentLevelIndex + 1) + '. ' + (lvl.name || '') + (lvl.label ? ' [' + lvl.label + ']' : '');
    if (nameFlashTimer) clearTimeout(nameFlashTimer);
    // Force reflow so re-triggering the fade-in works even if it's still showing.
    hudName.classList.remove('show');
    void hudName.offsetWidth;
    hudName.classList.add('show');
    nameFlashTimer = setTimeout(function () {
      hudName.classList.remove('show');
    }, 1500);
  }

  setInterval(function () {
    if (state === 'playing') {
      hudTimer.textContent = fmtTime(performance.now() - sessionStartTime);
    }
  }, 200);

  function loadLevelByIndex(idx) {
    currentLevelIndex = idx;
    engine.loadLevel(LEVELS[idx]);
    engine.active = true;
    levelStartTime = performance.now();
    updateHud();
    flashLevelName();
  }

  function startGame(idx) {
    if (clearAdvanceTimer) { clearTimeout(clearAdvanceTimer); clearAdvanceTimer = null; }
    sessionDeaths = 0;
    sessionStartTime = performance.now();
    loadLevelByIndex(idx || 0);
    setState('playing');
  }

  function goToTitle() {
    if (clearAdvanceTimer) { clearTimeout(clearAdvanceTimer); clearAdvanceTimer = null; }
    engine.active = false;
    setState('title');
  }

  function restartCurrentLevel() {
    if (state !== 'playing') return;
    engine.restartLevel(); // free — no death counted
  }

  function showDeathToast() {
    var lvl = LEVELS[currentLevelIndex];
    var pool = GLOBAL_TAUNTS.concat(lvl.deathMsgs || []);
    var msg = pool[Math.floor(Math.random() * pool.length)];
    toastDeath.textContent = msg;
    toastDeath.classList.add('show');
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastDeath.classList.remove('show'); }, 900);
  }

  engine.onDeath = function () {
    sessionDeaths++;
    totalDeaths++;
    lsSet('totalDeaths', totalDeaths);
    var key = String(currentLevelIndex);
    levelDeaths[key] = (levelDeaths[key] || 0) + 1;
    lsSet('levelDeaths', levelDeaths);
    showDeathToast();
    updateHud();
  };

  engine.onClear = function () {
    engine.active = false;
    var key = String(currentLevelIndex);
    var elapsed = performance.now() - levelStartTime;
    if (!bestTimeMs[key] || elapsed < bestTimeMs[key]) {
      bestTimeMs[key] = elapsed;
      lsSet('bestTimeMs', bestTimeMs);
    }
    if (currentLevelIndex + 1 > furthestLevel) {
      furthestLevel = currentLevelIndex + 1;
      lsSet('furthestLevel', furthestLevel);
    }
    setState('clear');
    clearAdvanceTimer = setTimeout(function () {
      clearAdvanceTimer = null;
      if (currentLevelIndex + 1 >= LEVELS.length) {
        showVictory();
        setState('victory');
      } else {
        loadLevelByIndex(currentLevelIndex + 1);
        setState('playing');
      }
    }, 1200);
  };

  function showVictory() {
    var totalMs = performance.now() - sessionStartTime;
    victoryDeaths.textContent = 'Total deaths: ' + sessionDeaths;
    victoryTime.textContent = 'Total time: ' + fmtTime(totalMs);
    victoryLevels.textContent = 'Levels cleared: ' + LEVELS.length;
    try { window.STICKAUDIO && window.STICKAUDIO.sfx.victory(); } catch (e) { /* ignore */ }
  }

  function copyToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).catch(function () { fallbackCopy(text); });
    } else {
      fallbackCopy(text);
    }
  }
  function fallbackCopy(text) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.focus(); ta.select();
    try { document.execCommand('copy'); } catch (e) { /* ignore */ }
    document.body.removeChild(ta);
  }

  btnCopy.addEventListener('click', function () {
    var totalMs = performance.now() - sessionStartTime;
    var text = 'I beat STICKMAN RAGE 🔥 ' + LEVELS.length + ' levels, ' +
      sessionDeaths + ' deaths, ' + fmtTime(totalMs) + '. Think you can do better?';
    copyToClipboard(text);
    var old = btnCopy.textContent;
    btnCopy.textContent = 'Copied!';
    setTimeout(function () { btnCopy.textContent = old; }, 1400);
  });

  btnBackTitle.addEventListener('click', goToTitle);

  function renderLevelSelect() {
    levelSelectDiv.innerHTML = '';
    for (var i = 0; i < LEVELS.length; i++) {
      (function (idx) {
        var b = document.createElement('button');
        b.textContent = String(idx + 1);
        if (idx > furthestLevel) {
          b.classList.add('locked');
          b.disabled = true;
        } else {
          b.addEventListener('click', function (ev) {
            ev.stopPropagation();
            startGame(idx);
          });
        }
        levelSelectDiv.appendChild(b);
      })(i);
    }
    titleTotalDeaths.textContent = String(totalDeaths);
  }

  overlayTitle.addEventListener('click', function (ev) {
    if (ev.target.closest && ev.target.closest('#level-select')) return;
    startGame(0);
  });

  // ---- Input ----
  function isLeftCode(c) { return c === 'ArrowLeft' || c === 'KeyA'; }
  function isRightCode(c) { return c === 'ArrowRight' || c === 'KeyD'; }
  function isJumpCode(c) { return c === 'ArrowUp' || c === 'KeyW' || c === 'Space'; }

  window.addEventListener('keydown', function (e) {
    if (isLeftCode(e.code) || isRightCode(e.code) || isJumpCode(e.code)) {
      e.preventDefault();
    }
    if (state === 'title') {
      startGame(0);
      return;
    }
    if (state !== 'playing') return;
    if (isLeftCode(e.code)) engine.input.left = true;
    if (isRightCode(e.code)) engine.input.right = true;
    if (isJumpCode(e.code)) { if (!e.repeat) engine.pressJump(); }
    if (e.code === 'KeyR') restartCurrentLevel();
    if (e.code === 'Escape') goToTitle();
  });

  window.addEventListener('keyup', function (e) {
    if (isLeftCode(e.code)) engine.input.left = false;
    if (isRightCode(e.code)) engine.input.right = false;
    if (isJumpCode(e.code)) engine.releaseJump();
  });

  // Touch controls.
  function bindHold(btn, onDown, onUp) {
    btn.addEventListener('pointerdown', function (ev) { ev.preventDefault(); onDown(); });
    btn.addEventListener('pointerup', function (ev) { ev.preventDefault(); onUp(); });
    btn.addEventListener('pointerleave', function () { onUp(); });
    btn.addEventListener('pointercancel', function () { onUp(); });
  }
  bindHold(btnLeft, function () { engine.input.left = true; }, function () { engine.input.left = false; });
  bindHold(btnRight, function () { engine.input.right = true; }, function () { engine.input.right = false; });
  bindHold(btnJump, function () { engine.pressJump(); }, function () { engine.releaseJump(); });

  // ---- Canvas letterbox scaling ----
  function fitCanvas() {
    var scale = Math.min(window.innerWidth / 960, window.innerHeight / 540);
    stage.style.transform = 'translate(-50%, -50%) scale(' + scale + ')';
  }
  window.addEventListener('resize', fitCanvas);
  fitCanvas();

  // ---- Boot ----
  engine.active = false;
  setState('title');
  engine.start();

  // ---- QA / debug handle ----
  window.__game = {
    get playerX() { return engine.player.x; },
    get playerY() { return engine.player.y; },
    get state() { return state; },
    get deaths() { return totalDeaths; },
    get sessionDeaths() { return sessionDeaths; },
    get levelIndex() { return currentLevelIndex; },
    get levelCount() { return LEVELS.length; },
    get usingDevLevel() { return LEVELS[0] === DEV_LEVEL; },
    loadLevel: function (i) { startGame(i); },
    engine: engine
  };
})();
