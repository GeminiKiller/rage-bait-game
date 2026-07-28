#!/usr/bin/env node
// Static validator for Stickman Rage level data (see SPEC.md).
// Usage: node tools/validate_levels.mjs
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const window = {};
const LEVEL_FILES = ['js/levels_a.js', 'js/levels_b.js', 'js/levels_c.js', 'js/levels_d.js', 'js/levels_e.js', 'js/levels_f.js'];
import { existsSync } from 'node:fs';
for (const f of LEVEL_FILES.filter(f => existsSync(join(root, f)))) {
  new Function('window', readFileSync(join(root, f), 'utf8'))(window);
}
const LEVELS = ['A','B','C','D','E','F'].flatMap(k => window['LEVELS_' + k] || []);

const TYPES = new Set(['solid', 'hazard', 'platform', 'trigger', 'decoy', 'decor', 'spring', 'conveyor', 'portal',
  'oneway', 'wind', 'button', 'door', 'key', 'lock']); // v3 wave 2
const THEMES = new Set(['plain', 'icecave', 'lava', 'night', 'sky', 'temple']);
const DECOR_VARIANTS = new Set(['ceiling', 'stalagmite', 'rocks', 'crystal']);
const ACTIONS = new Set(['reveal', 'hide', 'move', 'start', 'shoot', 'msg', 'shake', 'warp', 'invert', 'dark',
  'open', 'fakeclear']); // v3 wave 2
const W = 960, H = 540;
let errors = 0, warnings = 0;
const err = (l, m) => { errors++; console.log(`ERROR  [${l}] ${m}`); };
const warn = (l, m) => { warnings++; console.log(`warn   [${l}] ${m}`); };
const isNum = (v) => typeof v === 'number' && Number.isFinite(v);

LEVELS.forEach((lv, i) => {
  const tag = `L${i + 1} ${lv.name ?? '(unnamed)'}`;
  if (!lv.name) err(tag, 'missing name');
  if (!lv.spawn || !isNum(lv.spawn.x) || !isNum(lv.spawn.y)) err(tag, 'bad spawn');
  if (!lv.exit || !isNum(lv.exit.x) || !isNum(lv.exit.y)) err(tag, 'bad exit');
  if (!Array.isArray(lv.objects)) { err(tag, 'objects not an array'); return; }

  const ids = new Set(['exit']);
  for (const o of lv.objects) {
    if (o.id) {
      if (ids.has(o.id)) err(tag, `duplicate id "${o.id}"`);
      ids.add(o.id);
    }
  }

  // spawn/exit sanity
  if (lv.spawn) {
    const { x, y } = lv.spawn;
    if (x < 0 || x > W - 20 || y < 0 || y > 500) err(tag, `spawn out of bounds (${x},${y})`);
    const standing = lv.objects.some(o => (o.type === 'solid' || o.type === 'platform') && !o.hidden &&
      x + 20 > o.x && x < o.x + o.w && Math.abs((y + 40) - o.y) <= 2);
    if (!standing) warn(tag, `spawn (${x},${y}) has no solid directly under feet (y+40)`);
    // spawn must not start inside a visible hazard
    const inHazard = lv.objects.some(o => o.type === 'hazard' && !o.hidden &&
      x + 20 > o.x && x < o.x + o.w && y + 40 > o.y && y < o.y + o.h);
    if (inHazard) err(tag, 'spawn overlaps a visible hazard');
  }
  if (lv.exit) {
    const { x, y } = lv.exit;
    if (x < 0 || x > W - 30 || y < 0 || y > H - 50) err(tag, `exit out of bounds (${x},${y})`);
  }
  if (lv.deathMsgs && !Array.isArray(lv.deathMsgs)) err(tag, 'deathMsgs not an array');
  if (lv.theme && !THEMES.has(lv.theme)) err(tag, `unknown theme "${lv.theme}"`);
  if (lv.darkness != null && (!isNum(lv.darkness) || lv.darkness < 60)) err(tag, 'darkness radius must be a number >= 60');
  for (const o of lv.objects) {
    if (o.type === 'portal' && o.to && !lv.objects.some(q => q.type === 'portal' && q.id === o.to))
      err(tag, `portal "${o.id}" targets missing portal "${o.to}"`);
  }
  // hanging ice must not float unattached: needs solid/decor coverage above,
  // or it relies on the engine's auto rock lip (allowed — just warn if nothing above at all)
  for (const o of lv.objects) {
    if (o.type === 'hazard' && o.variant === 'ice' && o.dir === 'down' && isNum(o.y) && o.y > 60) {
      const attached = lv.objects.some(s => (s.type === 'solid' || s.type === 'decor') &&
        isNum(s.y) && isNum(s.h) && Math.abs((s.y + s.h) - o.y) <= 6 &&
        s.x < o.x + o.w && s.x + s.w > o.x);
      if (!attached) warn(tag, `hanging ice at (${o.x},${o.y}) has no ceiling/decor flush above (auto rock lip will cover it)`);
    }
  }

  for (const [j, o] of lv.objects.entries()) {
    const otag = `${tag} obj#${j}${o.id ? ` "${o.id}"` : ''} (${o.type})`;
    if (!TYPES.has(o.type)) { err(otag, `unknown type "${o.type}"`); continue; }
    for (const k of ['x', 'y', 'w', 'h']) if (!isNum(o[k])) err(otag, `bad ${k}`);
    if (isNum(o.x) && isNum(o.w) && (o.x < -5 || o.x + o.w > W + 5)) warn(otag, `x-range ${o.x}..${o.x + o.w} outside canvas`);
    if (isNum(o.y) && isNum(o.h) && (o.y < -5 || o.y + o.h > H + 65)) warn(otag, `y-range ${o.y}..${o.y + o.h} outside canvas`);
    if (o.type === 'hazard' && o.variant && !['spikes', 'lava', 'ice'].includes(o.variant)) err(otag, `bad variant "${o.variant}"`);
    if (o.type === 'hazard' && o.dir && !['up', 'down', 'left', 'right'].includes(o.dir)) err(otag, `bad dir "${o.dir}"`);
    if (o.type === 'decor' && o.variant && !DECOR_VARIANTS.has(o.variant)) err(otag, `bad decor variant "${o.variant}"`);
    if (o.type === 'conveyor' && (!isNum(o.speed) || o.speed <= 0 || o.speed > 200)) err(otag, 'conveyor speed must be 1..200');
    if (o.type === 'conveyor' && o.dir !== 1 && o.dir !== -1) err(otag, 'conveyor dir must be 1 or -1');
    if (o.type === 'solid' && o.surface && o.surface !== 'ice') err(otag, `bad surface "${o.surface}"`);
    if (o.type === 'portal' && (!o.id || !o.to)) err(otag, 'portal needs id and to');
    // v3 wave 2: oneway / wind / button / door / key / lock
    if (o.type === 'oneway' && isNum(o.h) && o.h > 24) warn(otag, `oneway h=${o.h}, expected thin (~12)`);
    if (o.type === 'wind') {
      if (!isNum(o.fx)) err(otag, 'wind missing/bad fx');
      if (o.fy != null && (!isNum(o.fy) || Math.abs(o.fy) > 1200)) err(otag, `wind fy must be within +/-1200 (got ${o.fy})`);
    }
    if (o.type === 'button' && (!Array.isArray(o.actions) || o.actions.length === 0)) err(otag, 'button has no actions');
    if (o.type === 'platform' && isNum(o.speed) && o.speed > 600) warn(otag, `platform speed ${o.speed} > 600`);
    if (o.type === 'platform') {
      if (!Array.isArray(o.path) || o.path.length === 0) err(otag, 'platform missing path');
      else for (const p of o.path) if (!isNum(p.x) || !isNum(p.y)) err(otag, 'bad path waypoint');
      if (o.mode && !['loop', 'pingpong'].includes(o.mode)) err(otag, `bad mode "${o.mode}"`);
      if (!isNum(o.speed) || o.speed <= 0) err(otag, 'platform missing/bad speed');
    }
    if (o.type === 'trigger' || o.type === 'button') {
      if (!Array.isArray(o.actions) || o.actions.length === 0) err(otag, `${o.type} has no actions`);
      else for (const a of o.actions) {
        if (!ACTIONS.has(a.do)) { err(otag, `unknown action "${a.do}"`); continue; }
        if (['reveal', 'hide', 'move', 'start', 'open'].includes(a.do) && !ids.has(a.target))
          err(otag, `action ${a.do} targets missing id "${a.target}"`);
        if (a.do === 'move' && (!a.to || !isNum(a.to.x) || !isNum(a.to.y))) err(otag, 'move missing to{x,y}');
        if (a.do === 'shoot' && (!a.from || !a.dir)) err(otag, 'shoot missing from/dir');
        if (a.do === 'shoot' && isNum(a.speed) && a.speed > 500) warn(otag, `arrow speed ${a.speed} > 500`);
        if (a.do === 'msg' && typeof a.text !== 'string') err(otag, 'msg missing text');
        if (a.do === 'warp' && (!a.to || !isNum(a.to.x) || !isNum(a.to.y))) err(otag, 'warp missing to{x,y}');
        if (a.do === 'invert' && (!isNum(a.duration) || a.duration <= 0)) err(otag, 'invert missing/bad duration');
        if (a.do === 'invert' && isNum(a.duration) && a.duration > 4) warn(otag, `invert duration ${a.duration} > 4s`);
        if (a.do === 'dark' && (!isNum(a.radius) || (a.radius !== 0 && a.radius < 60))) err(otag, 'dark radius must be 0 or >= 60');
        if (a.do === 'open' && (!isNum(a.duration) || a.duration <= 0)) err(otag, 'open missing/bad duration');
        if (a.do === 'open' && isNum(a.duration) && a.duration > 12) warn(otag, `open duration ${a.duration} > 12s`);
        if (a.do === 'open' && ids.has(a.target)) {
          const doorObj = lv.objects.find(q => q.id === a.target);
          if (doorObj && doorObj.type !== 'door') err(otag, `open target "${a.target}" is not a door (type "${doorObj.type}")`);
        }
      }
    }
  }
});

console.log(`\n${LEVELS.length} levels (${(window.LEVELS_A || []).length} + ${(window.LEVELS_B || []).length}), ${errors} errors, ${warnings} warnings`);
if (LEVELS.length < 20) { console.log('ERROR: fewer than 20 levels'); process.exit(1); }
process.exit(errors ? 1 : 0);
