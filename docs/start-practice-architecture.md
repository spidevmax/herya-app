# Start Practice — Architecture & Decisions

## Overview

The Start Practice feature enables users to create personalized practice sessions from blocks, execute them with guided timers, and record a post-practice journal.

## Flow (3+1 phases)

```
Choose Type → Build Session → [Optional Check-in] → Guided Practice → Post-Practice Journal → Done
```

## Architecture

### Frontend (4 modular components)

| Component | Location | Responsibility |
|---|---|---|
| **PracticeTypeSelector** | `components/session/PracticeTypeSelector.jsx` | 4-option grid: VK, Pranayama, Meditation, Complete |
| **SessionBuilder** | `components/session/SessionBuilder.jsx` | Visual block builder with drag-reorder (framer-motion Reorder) |
| **GuidedPracticePlayer** | `components/session/GuidedPracticePlayer.jsx` | Timer display, block navigation, play/pause/skip controls |
| **PostPracticeJournal** | `components/session/PostPracticeJournal.jsx` | Mood, energy, stress, sensations, notes, gratitude |

### Orchestrator Page

`pages/StartPractice.jsx` manages the full lifecycle with phase state machine: `type → build → checkin → practice → journal → done`

### Custom Hooks

| Hook | File | Purpose |
|---|---|---|
| **useSessionTimer** | `hooks/useSessionTimer.js` | Dual countdown (global + per-block), pause/resume with offset-based accuracy, auto-advance |
| **useSessionPersistence** | `hooks/useSessionPersistence.js` | localStorage save/recover for interrupted sessions (24h TTL) |

### Backend Extensions

**Session Model** (`Session.model.js`):
- `status`: `planned → active → paused → completed | abandoned`
- `plannedBlocks[]`: Array of `{ blockType, label, durationMinutes, order, vkSequence?, breathingPattern?, meditationType? }`
- `checkIn`: Optional pre-practice state `{ enabled, mood[], energyLevel, intention }`
- `timerData`: Server-side timing `{ startedAt, pausedAt, totalPausedMs, currentBlockIndex, blockStartedAt, blockPausedMs }`
- `actualDuration`: Real elapsed minutes (excludes pauses)
- `completionRate`: % of blocks completed

**New API Endpoints** (all under `/api/v1/sessions`):

| Method | Path | Purpose |
|---|---|---|
| GET | `/active/current` | Get user's most recent active/paused session (recovery) |
| GET | `/analytics/practice` | Completion rate, avg duration, most-used blocks |
| POST | `/:id/start` | Transition planned/paused → active |
| POST | `/:id/pause` | Transition active → paused |
| POST | `/:id/advance-block` | Move to next/prev block |
| POST | `/:id/complete` | Finalize session, calc actual duration & completion % |
| POST | `/:id/abandon` | Mark abandoned with partial metrics |

## Key Decisions

1. **Journal is always shown post-practice** — even on abandoned sessions, to capture reflections.
2. **Check-in is configurable, not forced** — toggle in the build phase header. Stored when enabled.
3. **Timer uses offset-based approach** — `Date.now()` snapshots on pause/resume avoid drift from `setInterval` inaccuracy.
4. **Block auto-advance** — when block time expires, automatically moves to next block with optional audio chime (Web Audio API).
5. **Recovery via dual persistence** — localStorage (immediate, for tab close) + server status (for cross-device).
6. **Backward compatible** — existing `/session/:type` route and old session creation flow are preserved. New flow lives at `/start-practice`.

## Analytics Tracked

- Start vs finish rate (completion %)
- Abandonment rate
- Average duration by session type
- Most-used block types and labels
- Per-type completion rates

## Future Improvements (prioritized)

1. **Template sessions** — save a block configuration as reusable template
2. **Audio guidance** — voice cues for pose transitions and breathing phases
3. **Haptic feedback** — vibration on block transitions (mobile)
4. **Social sharing** — share session summary card
5. **Smart recommendations** — suggest block configurations based on time of day, past sessions, goals
6. **Block presets per type** — curated "beginner pranayama" or "morning vinyasa" block sets
7. **Offline mode** — service worker caching for practice execution without network
8. **Widget / notifications** — remind to practice, show streak on home screen
9. **Detailed pose-by-pose tracking** — within VK blocks, track individual poses held
10. **Integration with wearables** — heart rate during practice for intensity calibration
