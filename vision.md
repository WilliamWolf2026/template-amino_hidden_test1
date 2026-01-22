# Project Vision: City Lines

## Overview

Endless puzzle game for nj.com where players rotate road tiles to connect NJ landmarks to highways, revealing weekly local news stories.

## Goals

- Relaxing, casual puzzle experience for adults 40+
- Connect gameplay to real NJ news stories
- Chapter-based progression (10 levels per county/story)
- Mobile-first, web-based delivery

## Non-Goals (Out of Scope for MVP)

- Competitive mechanics (move limits, time limits, leaderboards)
- Complex animations for companion character
- Multiple save slots or user accounts
- Features listed in GDD "Post MVP" section

## Key Constraints

- **Platform**: Web, mobile-first responsive
- **Tech Stack**: SolidJS + PixiJS (engine-agnostic scaffold)
- **Content**: 21 NJ counties, AI-generated weekly chapters
- **UX**: No failure state, focus on discovery not competition

## Architectural Decisions

- Engine-agnostic asset loading (swap Pixi/Phaser/Three)
- Signal-based screen navigation (no router)
- Two-tier levels: hand-crafted (1-3) + procedural (4+)
- Tuning system for real-time parameter adjustment

## User Experience Principles

- Unlimited moves, no time pressure
- Visual feedback when roads connect (color change)
- Story clues as level completion rewards
- News reveal as chapter completion reward

## Success Criteria

- Completion rates per level/chapter
- Article click-through from story reveals
- Session length and return visits
- County popularity metrics

## Reference Documents

- [Game Design Document](docs/game/gdd.md) — Full gameplay specs
- [Architecture](docs/architecture.md) — Technical scaffold
- [Assets](docs/assets.md) — Asset loading system
- [Tuning System](docs/services/tuning.md) — Dev/QA parameter adjustment
