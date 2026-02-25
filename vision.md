# Advance Games Platform

## What We're Building

A platform for creating casual, chapter-based games that connect players to local stories and content. Each game is a standalone experience built on a shared foundation, so new games can be created quickly without reinventing the wheel.

## The Idea

Players complete short puzzle chapters guided by a companion character. Each chapter is a self-contained experience — a handful of levels tied together by a narrative thread. That thread can be a local news story, a patrol route, a seasonal event, or anything a content team wants to deliver.

The games are embedded directly into publisher websites. Players don't need to download anything. They just play.

## How Games Work

Every Advance game follows the same rhythm:

1. **A companion introduces the chapter** — sets the tone, gives context
2. **The player works through levels** — each level is a small, satisfying puzzle
3. **Between levels, the story unfolds** — clues, dialogue, or narrative beats keep the player engaged
4. **The chapter ends with a payoff** — a story reveal, a completed patrol, a reward

Chapters are delivered from a backend. Games don't ship with hardcoded content — they pull chapters dynamically, so content can be updated weekly, daily, or however the editorial team decides.

## What's Shared Across Games

Every Advance game gets the same infrastructure for free:

- **Asset loading** — images, sounds, spritesheets, all managed consistently
- **Screen flow** — loading, start, gameplay, transitions
- **Audio** — music, sound effects, volume controls
- **Companion system** — characters that introduce chapters, deliver clues, and celebrate completions
- **Chapter delivery** — a catalog of chapters fetched from a backend, with progress tracking
- **Tuning** — real-time parameter adjustment for designers and QA
- **Embedding** — games run inside publisher sites with data injection
- **Progress persistence** — players can leave and come back where they left off

## What's Unique to Each Game

Each game brings its own:

- **Core mechanic** — rotate tiles, match colors, connect pipes, whatever the game is
- **Visual theme** — art, animations, tile sets
- **Level generation** — how puzzles are built from seeds and configs
- **Difficulty curve** — how levels progress within a chapter

## Separation Principle

The shared foundation never knows about any specific game. Games depend on the foundation, never the other way around. This means:

- A new game starts by replacing the game layer, not by forking the whole project
- Improvements to the foundation benefit every game automatically
- Games can have completely different mechanics while sharing all the plumbing

## Content Model

- A **catalog** lists all available chapters for a game
- Each **chapter** contains levels, a story, and companion dialogue
- Each **level** contains a seed, config, and clues
- Chapters can be tied to real-world content (news, events) or be standalone (patrols, seasonal themes)
- **Fallback chapters** exist for every game so it always has something to play, even without a backend

## Player Experience Principles

- No failure states — players always make progress
- No time pressure — relaxing, not stressful
- Short sessions — a chapter should feel complete in a few minutes
- Story as reward — the narrative is what pulls you forward, not points or leaderboards
- Works on any device — mobile-first, but plays well everywhere

## Current Games

- **City Lines** — rotate road tiles to connect landmarks across neighborhoods

## Roadmap

### Now
- Chapter catalog with multiple chapters and progression between them
- Companion-guided introduction and story flow
- Fallback patrol chapters for offline/default play
- Progress persistence across sessions

### Next
- Backend-driven chapter publishing (editorial creates, players receive)
- Multiple companion characters with distinct personalities
- Seasonal and event-based chapter themes
- Embed integration with publisher analytics

### Later
- Second game on the platform (proving the foundation works for more than one game)
- Shared player profiles across games
- A/B testing of chapter content and game tuning via feature flags
- Community features (sharing completed chapters, streaks)
