# Stickman Rage — Project Plan

Goal: a viral "rage bait" stickman platformer — Level Devil / Trap Adventure style —
with 20+ short troll levels, playable as a single static page (no build step).

## The viral formula (from research)

- **No checkpoints + instant respawn (<0.7s) + prominent death counter + 10–30s levels
  + sarcastic taunts = endlessly clippable.**
- Deaths must feel like the player's fault *in retrospect*: a trap may surprise-kill
  once, but must be avoidable with knowledge. Deterministic, no RNG.
- Difficulty arc over 20+ levels: teach a rule → enforce it → betray it → force synthesis.
- Streamer/clip hooks: big death number, session timer, taunt toasts, victory screen
  with "share your suffering" copy-to-clipboard stats.

## Trap arsenal (implemented via generic trigger/action system — see SPEC.md)

Collapsing floors, fake exits that run away, invisible blocks revealed mid-jump,
spikes that pop out, crusher platforms, arrow projectiles, moving-platform betrayals,
walls that close behind you, trolly safe-looking paths.

## Team structure (planner = this session; builders = cheaper models)

| Agent | Model | Deliverable |
|---|---|---|
| Research ×2 | haiku | Genre + tech research (done) |
| Engine | sonnet | `index.html`, `js/engine.js`, `js/audio.js`, `js/main.js` per SPEC.md |
| Levels A | sonnet | `js/levels_a.js` — levels 1–10 (teach → first betrayals) |
| Levels B | sonnet | `js/levels_b.js` — levels 11–22 (complexity → mastery) |
| QA | sonnet | Playwright playtest: boot, auto-drive levels, console errors, solvability spot checks |

Planner owns: SPEC.md (the engine/level contract), integration, validation script,
final playtesting, fixes, ship.

## Milestones

1. ✅ Research (viral mechanics + tech patterns)
2. ✅ SPEC.md — binding level-format / physics contract
3. Engine + 22 levels built in parallel against the spec
4. Integration + automated validation (geometry bounds, trigger id refs, jump reachability)
5. Playtest, fix, polish (SFX, shake, taunts, share screen)
6. Ship: push branch, draft PR
