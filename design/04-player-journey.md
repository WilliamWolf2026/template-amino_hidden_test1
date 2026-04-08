# 04 — Player Journey: Recipe Hunt

## Section A: Game Lifecycle

```json
{
  "lifecycle": {
    "screens": [
      {"name": "TITLE", "purpose": "Brand impression with scattered food items drifting across a warm wooden-table background and play CTA", "elements": ["Recipe Hunt logo in handwritten-style Fredoka One", "Play button (primary CTA)", "Settings gear icon", "Scoreboard trophy icon"]},
      {"name": "MENU", "purpose": "Recipe selection by level and chef tier progression", "options": ["Level select grid (completed recipes show star rating and dish illustration)", "Daily Special recipe button", "Back to title"]},
      {"name": "PLAYING", "purpose": "delegates to game loop"},
      {"name": "PAUSED", "purpose": "Freeze timer and play area on pause tap or window focus loss", "options": ["Resume", "Restart recipe", "Quit to menu"]},
      {"name": "LEVEL_END", "purpose": "Celebrate recipe completion with dish reveal and score breakdown", "elements": ["Completed dish illustration with name reveal", "Star rating (1-3) based on accuracy and time", "Score breakdown (ingredients found, time bonus, combo multiplier, accuracy multiplier)", "Perfect recipe badge if zero misses", "Next recipe button", "Share button (recipe card artifact)"]},
      {"name": "GAME_OVER", "purpose": "Show ingredients found vs missed and clear retry path", "elements": ["Final score with multiplier breakdown", "Ingredients found count / total required", "Accuracy percentage", "Retry button (primary)", "View scores button", "Back to menu button"]},
      {"name": "SCOREBOARD", "purpose": "Display top 10 high scores per recipe level plus Daily Special leaderboard"},
      {"name": "SETTINGS", "purpose": "Audio and accessibility controls", "options": ["SFX volume slider", "Music volume slider", "Mute toggle", "Reduced motion toggle", "High contrast toggle"]}
    ],
    "session_model": {
      "max_taps_to_gameplay": 2,
      "score_persistence": "localStorage",
      "settings_persistence": "localStorage"
    },
    "transitions": {
      "between_screens": "fade 250ms with recipe card slide-in from bottom",
      "into_gameplay": "Recipe card flips onto screen, ingredients listed one by one (800ms total), then 'Hunt!' prompt",
      "style": "warm kitchen-themed slides matching wooden-table and cream card aesthetic"
    },
    "ui_shell": {
      "title_idle_behavior": "Food emoji drift slowly across the background like a farmers market display; after 10 seconds idle, transitions to attract mode",
      "game_over_actions": ["Retry recipe", "View scores", "Back to menu"],
      "scoreboard_entries": 10,
      "settings_options": ["SFX volume", "Music volume", "Mute toggle", "Reduced motion", "High contrast"]
    }
  }
}
```

### Screen Graph

| Screen | Purpose | Navigates To |
|---|---|---|
| TITLE | First impression, brand, play CTA | MENU, PLAYING, SETTINGS, SCOREBOARD |
| MENU | Recipe/level select with star ratings and dish previews | PLAYING, TITLE |
| PLAYING | Game loop + HUD (recipe card, timer bar, combo counter, pause) | PAUSED, LEVEL_END, GAME_OVER |
| PAUSED | Resume or quit, triggered by button or focus loss | PLAYING, TITLE |
| LEVEL_END | Dish reveal, star rating, score breakdown, next recipe | PLAYING, GAME_OVER |
| GAME_OVER | Final score, accuracy stats, retry path | PLAYING, SCOREBOARD, TITLE |
| SCOREBOARD | Top 10 per recipe level, Daily Special board | TITLE |
| SETTINGS | Audio sliders, accessibility toggles | Previous screen |

## Section B: FTUE

```json
{
  "ftue": {
    "tutorial_steps": [
      {"teach": "core_input", "hint_type": "hand gesture + spotlight", "success_condition": "Player taps a spotlighted food item on the play area to select it"},
      {"teach": "goal", "hint_type": "arrow + brief text", "success_condition": "Player taps a correct ingredient and sees it check off on the recipe card with pop animation"},
      {"teach": "challenge", "hint_type": "spotlight + brief text", "success_condition": "Player notices timer bar and avoids tapping a wrong item (or sees 3-second penalty on intentional guided wrong tap)"},
      {"teach": "completion", "hint_type": "none — player should understand", "success_condition": "Player finds all 3 ingredients independently with no hints triggered"}
    ],
    "hint_system": {
      "max_words_per_hint": 8,
      "hint_types": ["spotlight", "arrow", "hand gesture", "text bubble"],
      "initial_hint_delay_ms": 2000,
      "repeat_hint_delay_ms": 5000,
      "dismiss_on": "correct action"
    },
    "prompt_style": "coaching — brief, friendly, contextual",
    "tutorial_level_modifications": {
      "simplified_layout": true,
      "reduced_obstacles": true,
      "guaranteed_first_win": true
    },
    "skip_mechanism": {
      "always_available": true,
      "auto_skip_if": "player acts before hints appear",
      "placement": "small corner button"
    },
    "first_run_detection": "localStorage hasPlayed flag",
    "returns_to_screen": "MENU level 1"
  }
}
```

### Tutorial Flow

| Step | Teaches | Hint | Board Setup |
|---|---|---|---|
| 1 — Tap | Tap food items | Hand gesture spotlights one correct ingredient with pulsing glow | 3 required ingredients, 5 obvious distractors (e.g. apple among broccoli), 90s timer |
| 2 — Recipe card | Correct tap checks off ingredient | Arrow to recipe card, "Tap ingredients to find them!" | Same board, second ingredient spotlighted after first found |
| 3 — Penalty | Wrong taps cost time | Spotlight on timer bar, "Wrong taps lose 3 seconds!" | Player guided to tap one wrong item, then correct one; timer is generous at 90s |
| 4 — Free play | Full recipe unguided | No hints unless 10s idle | 3 ingredients, 10 distractors, 60s timer — standard tier 1 but easier |

## Section C: Attract Mode

```json
{
  "attract_mode": {
    "demo_sequence": [
      {"beat": "intro", "duration_s": 3, "action": "AI taps a correct ingredient among clutter; item pops and checks off recipe card", "shows": "Core tap-to-find verb in action on a fresh play area with recipe card visible"},
      {"beat": "competence", "duration_s": 5, "action": "AI finds 3 ingredients quickly with consecutive taps; combo counter climbs to x3 with sizzle sound", "shows": "Fast scanning and combo streak with rising score and pop-and-vanish feedback"},
      {"beat": "near_miss", "duration_s": 3, "action": "AI hesitates between a lemon and a lime, taps the lime (wrong) — timer loses 3 seconds, combo resets", "shows": "Look-alike confusion moment — viewer sees the correct lemon was right next to it"},
      {"beat": "failure", "duration_s": 4, "action": "AI has 1 ingredient left but timer hits 0; play area dims with ticking clock SFX cutting to buzzer", "shows": "Timer expires with last ingredient unfound — GAME_OVER screen with full juice, recipe card shows one unchecked ingredient"},
      {"beat": "call_to_action", "duration_s": 5, "action": "Fade to title screen with pulsing 'Tap to Play' overlay", "shows": "Recipe Hunt logo, drifting food items background, inviting play prompt"}
    ],
    "auto_play": {
      "skill_level_percent": 60,
      "intentional_mistakes": true,
      "reaction_delay_ms": 200,
      "death_is_scripted": true
    },
    "hand_pointer": {
      "visible": true,
      "style": "pointer emoji follows AI tap position with 100ms ease lag",
      "animations": ["tap scale punch", "swipe trail", "idle hover"]
    },
    "triggers": {
      "start_on": "title idle 10s | game over idle 15s | explicit invoke",
      "exit_on": "any user input — immediate transition to title"
    },
    "total_duration_s": 20,
    "loops": true,
    "exit_conditions": ["any tap", "any key", "any swipe"]
  }
}
```

### 5-Beat Arc

| Beat | Duration | Purpose |
|---|---|---|
| Intro | 3s | AI taps a correct ingredient — core tap-to-find verb visible immediately |
| Competence | 5s | Fast combo streak with 3 consecutive finds — game looks rewarding and satisfying |
| Near miss | 3s | AI confuses lemon for lime — viewer sees the obvious correct answer |
| Failure | 4s | Timer expires with 1 ingredient left — full juice on game over — "I could do better" |
| Call to action | 5s | Title screen with pulsing "Tap to Play" prompt |

## Exit Criteria

- Given all 8 screens (TITLE, MENU, PLAYING, PAUSED, LEVEL_END, GAME_OVER, SCOREBOARD, SETTINGS), should specify purpose and elements/options for each
- Given title screen, should be the default entry point (not gameplay)
- Given max taps to gameplay, should be 2 (Title -> Menu -> Play)
- Given pause, should trigger on pause button press AND window focus loss
- Given scoreboard, should persist top 10 per recipe level via localStorage
- Given transitions, should be 250ms fade with recipe card slide, themed to warm kitchen style
- Given tutorial step 1, should teach tap via hand gesture on simplified board — success within 5 seconds
- Given tutorial step 2, should teach recipe card check-off — one concept only
- Given first attempt in tutorial, should guarantee success (3 ingredients, 5 distractors, 90s timer)
- Given hints, should use max 8 words per prompt ("Tap ingredients to find them!", "Wrong taps lose 3 seconds!")
- Given skip mechanism, should be always available via corner button; auto-skips if player acts before hints
- Given returning players, should skip tutorial automatically via localStorage hasPlayed flag
- Given 30-second phone test, should result in a non-gamer finding at least one ingredient via tap
- Given demo intro beat, should show core tap-to-find verb within first 3 seconds
- Given AI auto-play, should play at 60% skill with intentional look-alike mistakes and 200ms reaction delay
- Given failure beat, should be scripted timer expiry with 1 ingredient unfound and full buzzer/dim juice
- Given any user input during attract, should exit immediately to title with zero delay
- Given total attract duration, should be 20 seconds and loop continuously
