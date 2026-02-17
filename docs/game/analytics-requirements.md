# Overview

This document defines the analytics instrumentation for City Lines' initial release. It specifies all tracking events, parameters, and data structures needed to measure player progression, engagement, and story interaction from session start through chapter completion.

### Goals

- Enable measurement of level completion rates and player drop-off points
- Track player engagement with story reveals and news content
- Provide data to evaluate level difficulty and progression pacing
- Support A/B testing and feature flagging for future iterations
- Establish consistent event taxonomy for future Advance games

### Scope

**In scope for CL1.0:**

- Session and gameplay event tracking (session, screen, game, level events)
- Level progression and completion metrics
- Story interaction tracking (clues, reveals, links, bookmarks)
- PostHog project setup with feature flags and survey integration
- Core properties: user identification, timestamps, level metadata

### Out of Scope

- Retention and cohort analysis (separate analysis layer)
- In-game performance metrics (frame rate, load times)
- User account/authentication events
- Payment or monetization tracking

### Definition of Done

- All events, properties, and integrations are implemented, verified in PostHog debugger across the complete user journey, and validated by QA with engineering and product sign-off.

# High level Requirements

1. **“City Lines” Posthog project setup**
2. **Posthog Survey Integration**
3. **Required Properties in all Events**
    1. `game_name` (string)
    2. `session_elapsed` (number/float)
4. **Session Events**
    1. `session_start`
    2. (new) `session_pause` - handle cases if user switches tab
    3. (new) `session_resume` - handle cases when users switch tab back
    4. `session_end`
5. **Gameplay Events:**
    1. `game_start` (start_source, is_returning_player)
    2. `level_start` (level_id, chapter_id, difficulty, is_tutorial)
    3. `level_restart` (level_id, moves_before_restart, is_tutorial)
    4. `level_complete` (level_id, moves_used, optimal_moves, time_spent, eraser_used, is_tutorial)
    5. `level_fail` (level_id, moves_used, quit_reason, is_tutorial)
    6. `chapter_start` (chapter_id, is_tutorial)
    7. `chapter_complete` (chapter_id, score, erasers_used, time_spent, is_tutorial)
    8. `chapter_fail` (chapter_id, quit_reason, is_tutorial
6. **Content Engagement Events**:
    1. `cutscene_show` (cutscene_type, cutscene_id, interaction_type, seconds_viewed)
    2. `cutscene_skip` (cutscene_type, cutscene_id, interaction_type, seconds_viewed)
    3. `cutscene_complete` (cutscene_type, cutscene_id, interaction_type, seconds_viewed)
    4. `cutscene_interact` (cutscene_type, cutscene_id, interaction_type, seconds_viewed)
    5. `story_link_click` (chapter_id, chapter_count, article_url)
7. **Advanced Gameplay Metrics (City Lines-specific)**
    1. `tile_rotated`
    2. `landmark_connected`
    3. `audio_setting_changed`
8. **Feature Flags and A/B Testing using PostHog**
    1. Support for feature flags and variant testing

### Important Notes

1. **Game End**: There is no `game_end` event because the game has infinite number of levels and chapters. We will use combination of `game_start` and `session_end` to evaluate the game end activities.
2. Minimized number of properties to include per event, since Posthog already handles the essential events like `timestamp`, `users_id`.

## Open Questions

1. Can we track returning users across sessions via LocalStorage `user_id`?
2. (Design Question) When should we trigger PostHog surveys? (After first chapter? After session end?)
3. Should we consolidate City Lines + Trivia into single PostHog project for easier comparison?
4. Do we know if Posthog tracking are blocked by adblocker?

# Detailed Requirements

## 1. PostHog Setup

- Send all City Lines events PostHog “City Lines” project.
- Use consistent naming conventions across all Advance games for easier cross-game analysis.

## 2. PostHog Survey Integration

### Goals

- Collect lightweight player feedback without interrupting core gameplay.
- Use “natural breaks” (chapter completion or session end) to trigger surveys.

### Requirements

- Use PostHog Surveys inside the **City Lines** PostHog project.
- Surveys should be triggered at a natural break:
    - Primary trigger: after `chapter_complete` (after the story reveal experience is shown).
    - Fallback trigger: on `session_end` if the player did not complete a chapter in the session.
- Ensure the survey is shown at most once per user per configured cooldown.
    - Prefer PostHog survey settings.
    - If extra gating is needed, store a local `last_survey_shown_at` timestamp.

### Data to include (as properties)

- `game_name`
- `session_elapsed`
- `chapter_count` (when survey is triggered after chapter)
- `county_theme` (when known)

## 3. Required Properties in all Events

Every event fired from City Lines must include:

- `game_name` (string)
    - Always `"city_lines"`
- `session_elapsed` (number/float)
    - Seconds since `session_start` for the current session.

## 4. Session Events

`session_start`

Fired when the game loads and the first frame is interactive.

```json
{
  "event_name": "session_start",
  "properties": {
    "game_name": "city_lines",
    "session_elapsed": 0,

    "entry_screen": "start"
  }
}
```

`session_pause`

Fired when the session becomes inactive because the user switches away from the game (tab hidden, window blur, app background).

```json
{
  "event_name": "session_pause",
  "properties": {
    "game_name": "city_lines",
    "session_elapsed": 120.3,

    "pause_reason": "tab_hidden|window_blur|app_background"
  }
}
```

`session_resume`

Fired when the user returns to the game after a pause.

```json
{
  "event_name": "session_resume",
  "properties": {
    "game_name": "city_lines",
    "session_elapsed": 135.8,

    "resume_reason": "tab_visible|window_focus|app_foreground",
    "pause_duration": 15.5
  }
}
```

`session_end`

Fired when the user closes the game, navigates away, or after inactivity timeout.

```json
{
  "event_name": "session_end",
  "properties": {
    "game_name": "city_lines",
    "session_elapsed": 245.7,

        // Session rollups
    "levels_completed_in_session": 10,
    "chapters_completed_in_session": 1,
    "story_links_clicked_in_session": 1,

    // Where the user ended (last known position)
    "last_chapter_count": 2,
    "last_level_order": 3,
    "last_chapter_progress": "3/10",
    "last_county_theme": "atlantic",

    "session_end_reason": "user_close|timeout|navigation_away"
  }
}
```

## 5. Gameplay Events

`game_start`

Fired when the player presses **Start** on the start screen and gameplay begins (first level starts loading).

```json
{
  "event_name": "game_start",
  "properties": {
    "game_name": "city_lines",
    "session_elapsed": 3.2,

    "start_source": "start_screen",
    "is_returning_player": true,

    "chapter_count": 1,
    "county_theme": "atlantic"
  }
}
```

`level_start`

Fired when a level becomes interactive (grid rendered and user can rotate tiles).

```json
{
  "event_name": "level_start",
  "properties": {
    "game_name": "city_lines",
    "session_elapsed": 25.1,

    "chapter_count": 1,
    "county_theme": "atlantic",
    "chapter_progress": "5/10",

    "level_order": 5,
    "level_difficulty": "easy|medium|hard",
    "is_tutorial": false,

    "grid_size": 5,
    "landmarks_count": 3,
    "road_tiles_count": 25,
    "min_path_length": 4,
    "level_seed": 12345,
    "level_config": [
      // TBD: engineering should define the City Lines level_config schema
    ]
  }
}
```

`level_restart`

Fired when the player restarts a level (reload).

```json
{
  "event_name": "level_restart",
  "properties": {
    "game_name": "city_lines",
    "session_elapsed": 36.2,

    "chapter_count": 1,
    "county_theme": "atlantic",
    "chapter_progress": "5/10",

    "level_order": 5,
    "level_difficulty": "easy|medium|hard",
    "is_tutorial": false,
    "level_seed": 12345,

    "moves_before_restart": 7,
    "level_config": [
      // TBD: engineering should define the City Lines level_config schema
    ]
  }
}
```

`level_complete`

Fired when the player completes a level.

```json
{
  "event_name": "level_complete",
  "properties": {
    "game_name": "city_lines",
    "session_elapsed": 48.7,

    "chapter_count": 1,
    "county_theme": "atlantic",
    "chapter_progress": "5/10",

    "level_order": 5,
    "level_difficulty": "easy|medium|hard",
    "is_tutorial": false,
    "level_seed": 12345,

    "moves_used": 21,
    "optimal_moves": 19,
    "time_spent": 23.6,
    "level_config": [
      // TBD: engineering should define the City Lines level_config schema
    ]
  }
}
```

`level_fail`

Fired when the level ends without completion (player quits mid-level, error, or timeout).

```json
{
  "event_name": "level_fail",
  "properties": {
    "game_name": "city_lines",
    "session_elapsed": 44.1,

    "chapter_count": 1,
    "county_theme": "atlantic",
    "chapter_progress": "5/10",

    "level_order": 5,
    "level_difficulty": "easy|medium|hard",
    "is_tutorial": false,
    "level_seed": 12345,

    "level_config": [
      // TBD: engineering should define the City Lines level_config schema
    ],

    "moves_used": 12,
    "quit_reason": "user_quit|error|timeout"
  }
}
```

`chapter_start`

Fired when a new chapter begins.

```json
{
  "event_name": "chapter_start",
  "properties": {
    "game_name": "city_lines",
    "session_elapsed": 5.2,

    "chapter_count": 1,
    "county_theme": "atlantic",
    "is_tutorial": false,

    "chapter_size": 10,

    "story_id": "story_abc123",
    "story_headline": "Local Hero Returns After Championship Win"
  }
}
```

`chapter_complete`

Fired when the chapter is completed.

```json
{
  "event_name": "chapter_complete",
  "properties": {
    "game_name": "city_lines",
    "session_elapsed": 120.5,

    "chapter_count": 1,
    "county_theme": "atlantic",
    "is_tutorial": false,

    "chapter_size": 10,
    "time_spent": 115.3
  }
}
```

`chapter_fail`

Fired when a chapter ends without completion.

```json
{
  "event_name": "chapter_fail",
  "properties": {
    "game_name": "city_lines",
    "session_elapsed": 62.0,

    "chapter_count": 1,
    "county_theme": "atlantic",
    "is_tutorial": false,

    "quit_reason": "user_quit|error|timeout"
  }
}
```

## 6. Content Engagement Events

These events measure how players **see, consume, and interact with story surfaces** (clues, chapter story reveals, and any narrative overlays). City Lines uses the cutscene-style event family so the taxonomy stays consistent across Advance games.

`cutscene_show`

Fired when a story/narrative/cutscene surface becomes visible.

```json
{
  "event_name": "cutscene_show",
  "properties": {
    "game_name": "city_lines",
    "session_elapsed": 50.2,

    "cutscene_id": "cs_post_level_clue_005",
    "cutscene_type": "chapter_start|post_level_clue|chapter_end_story_reveal|tutorial|other",
    "interaction_type": "auto|tap|other",
    "seconds_viewed": 0,

    "chapter_count": 1,
    "county_theme": "atlantic",

    "level_order": 5
  }
}
```

`cutscene_skip`

Fired when the player skips a cutscene surface (only if skippable).

```json
{
  "event_name": "cutscene_skip",
  "properties": {
    "game_name": "city_lines",
    "session_elapsed": 51.1,

    "cutscene_id": "cs_chapter_end_story_reveal_001",
    "cutscene_type": "chapter_end_story_reveal",
    "interaction_type": "skip_button|tap|other",
    "seconds_viewed": 1.3,

    "chapter_count": 1,
    "county_theme": "atlantic"
  }
}
```

`cutscene_complete`

Fired when the cutscene surface is viewed to completion (or dismissed after the full intended duration).

```json
{
  "event_name": "cutscene_complete",
  "properties": {
    "game_name": "city_lines",
    "session_elapsed": 53.2,

    "cutscene_id": "cs_post_level_clue_005",
    "cutscene_type": "post_level_clue",
    "interaction_type": "auto|tap|other",
    "seconds_viewed": 3.0,

    "chapter_count": 1,
    "county_theme": "atlantic",

    "level_order": 5
  }
}
```

`cutscene_interact`

Fired when the player interacts with the cutscene surface (advance dialogue, tap, etc.).

```json
{
  "event_name": "cutscene_interact",
  "properties": {
    "game_name": "city_lines",
    "session_elapsed": 52.0,

    "cutscene_id": "cs_chapter_end_story_reveal_001",
    "cutscene_type": "chapter_end_story_reveal",
    "interaction_type": "tap|advance|other",
    "seconds_viewed": 2.4,

    "chapter_count": 1,
    "county_theme": "atlantic"
  }
}
```

`story_link_click`

Fired when the player clicks “Read the full story →”.

```json
{
  "event_name": "story_link_click",
  "properties": {
    "game_name": "city_lines",
    "session_elapsed": 125.3,

    "chapter_count": 1,
    "county_theme": "atlantic",

    "article_url": "https://example.com/story"
  }
}
```

## 7. Advanced Gameplay Metrics (City Lines-specific)

The following events are City Lines-specific gameplay metrics that are useful for deeper analysis. These events were identified from analyzing the existing `advance-game-citylines` codebase and may already exist internally, but need to be connected to PostHog.

`tile_rotated`

Fired on every tile rotation by the player.

```json
{
  "event_name": "tile_rotated",
  "properties": {
    "game_name": "city_lines",
    "session_elapsed": 30.5,

    "chapter_count": 1,
    "county_theme": "atlantic",
    "chapter_progress": "5/10",

    "level_order": 5,

    "tile_position": {"x": 2, "y": 3},
    "rotation_direction": "clockwise|counter_clockwise",
    "total_rotations_in_level": 8
  }
}
```

`landmark_connected`

Fired when a landmark connects to the road network.

```json
{
  "event_name": "landmark_connected",
  "properties": {
    "game_name": "city_lines",
    "session_elapsed": 35.2,

    "chapter_count": 1,
    "county_theme": "atlantic",
    "chapter_progress": "5/10",

    "level_order": 5,

    "landmark_id": "landmark_abc123",
    "landmark_type": "common|county_specific|other",
    "connection_order": 2,
    "time_to_connect_seconds": 12.5,
    "landmarks_remaining": 1
  }
}
```

`audio_setting_changed`

Fired when the player changes audio settings.

```json
{
  "event_name": "audio_setting_changed",
  "properties": {
    "game_name": "city_lines",
    "session_elapsed": 10.3,

    "setting_type": "volume|mute",
    "old_value": 0.8,
    "new_value": 0.5,

    "screen_name": "settings"
  }
}
```

> **Note:** These events were discovered during codebase analysis for [ENG-1447](1447). The game already emits internal equivalents for tile rotation and landmark connection for UI/audio behavior. The requirement here is to forward them into PostHog.
>

## 8. Feature Flags & A/B Testing (TBD)

### **PostHog Feature Flags Integration**

**Requirements:**

- Use PostHog Feature Flags to assign users to experiment variants on session start
- Feature flag assignments are persistent per user (stored in LocalStorage via `user_id`)
- All events include the assigned variant in event properties for analysis
- Feature flags can be toggled on/off from PostHog dashboard without code deployment

### **MVP Feature Flags**

| **Flag Key** | **Description** | **Variants** | **Target Property** |
| --- | --- | --- | --- |
| `difficulty_curve_variant` | Controls difficulty ramp speed | `easy_start` | `medium_start` | `hard_start` | Sets `detour_probability` progression |
| `county_theming_enabled` | Enables county-specific visual theming | `true` | `false` | Toggles county backgrounds/landmarks |
| `clue_display_time` | Duration clues stay on screen | `2s` | `3s` | `5s` | Sets clue overlay duration |
| `clue_overlay_enabled` | Controls whether clues are displayed after level completion | `true` \ `false` | `false` |

### **Implementation Notes**

- Feature flags should default to control values if PostHog fetch fails
- Variant assignment must happen before `game_start` to ensure consistent experience

# Success Metrics

- **Event Coverage:** 100% of core user journey tracked (session → level → chapter completion)
- **Data Quality:** <1% event loss rate; all required properties present in 99%+ of events
- **Real-time Visibility:** Events appear in PostHog within 60 seconds of firing
- **Feature Flag Response:** A/B test variant assignments load within 2 seconds of session start

# Risk Mitigation

| **Risk** | **Mitigation** |
| --- | --- |
| Ad blockers prevent telemetry | PostHog proxy configuration; track blocker rate in backend logs |
| Event deduplication failures | Enforce unique `event_id` per event; validate in PostHog |
| Config version mismatches | Include `config_version` in all events; alert on unexpected values |
| Missing required properties | Schema validation before sending; log failed events for debugging |
| Survey timing disrupts gameplay | Test trigger points in staging; allow easy dismissal |