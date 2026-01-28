# **City Lines: Design Document**

**Title:** City Lines

**Tagline:** TBD

**Genre:** Puzzle (Path Connection / Network Building)

**Platform:** Web (mobile-first, responsive)

**Target Audience:** nj.com readers, adults 40+ in New Jersey

**Latest Prototype Link:** https://city-lines-news.vercel.app/

**Screen Mocks:** TBD

---

## **Game Overview**

An endless puzzle game where players rotate road tiles to connect landmarks across New Jersey counties to highways. Players progress through chapters of 10 levels, each revealing a weekly local news story.

---

## **Core Gameplay Flow**

Below is a description of the gameplay flow, going through each key moment in the game.

### **Start Screen**

This is the screen players see when they start the game. Below is what they encounter:

- Authority figure (in-game companion character)
- Current chapter info
  (e.g., "Atlantic County")
- Some info on the task & goal
- "Start" button

### **Level Structure**

Below is the breakdown of how levels are structures in the game - based on difficulty.

- Grid of road tiles (4×4 to 6×6)
- 2-4 landmarks placed on grid
  - Landmarks can be common or county specific
    - Commons: house, gas station, diner, market
    - County Specific: TBD
- Player taps tiles to rotate 90° clockwise
- Goal: Connect all landmarks to turnpikes/highway exists with continuous roads
- Roads light up when a landmark is connected to the turnpike
  **Road Tile Types:**
  - Straight
  - Corner (L-shapes)
  - T-junction

### **Level Completion**

When players complete a level, they encounter the following flow:

- Roads light up when all landmarks connected
- Story clue appears (3 seconds)
  - Example: "Unlikely championship victory"
- Progress advances (+1 level)
- "Continue" to next level

### **Chapters (5 to 10 Levels Each)**

To enhance the feeling of progress, we'll have chapters in the game consisting of levels. Each chapter will feature one county and this will be based on the source of the news.

- Each chapter = 1 NJ county + 1 news story
- County selected based on top news of the week
- County-specific visual elements:
  - Option 1: County specific backgrounds **(easier)**
  - Option 2: Unique landmarks (Atlantic → Casino, Bergen → Mall) **(harder)**
  - Themed decorations
  - Color variations
- Each level reveals one story clue
- After Last Level: Story Reveal Interstitial

### **Chapter Completion: Story Interstitial**

Once the players complete a chapter, they encounter the following screen:

**Displays:**

- Full headline
  - Reveal style: [old school spinning newspaper headline animations](https://www.youtube.com/watch?v=wwhue4mkOyQ)
- Story summary (2-3 sentences)
- Featured image
- County name
- Bookmark story
- Copy: _Story added to the news basket_
- "Continue to Next Chapter" button

**Then:**

- New chapter loads
- New county theme
- New story begins
- Progress resets to 0/10

### **Interaction with the Character**

For MVP, the interaction with the character will be limited. The following are the limits to character involvement during the gameplay:
**Title Screen:**

- The character is visible on title screen illustrated (different than in game assets)

**Introduction Screen (after title screen, first time playing):**

- The character slides in from right of the screen.
- Character doesn’t animate
- Character talks through dialogue boxes.

**Chapter start**

- ~~The character slides in from right of the screen.~~
- Character doesn't animate
- Character talks through dialogue boxes, explains what story they are after.

**During Gameplay (level completion):**

- The character talks through little pop up boxes - we only see character’s head in a circle revealing the clue.

**Chapter end**

- Character doesn't animate (static)
- Character talks through dialogue boxes, reveals the story they found.
  ![Mockups.png](attachment:f37d3eaf-efe0-499c-8fd3-7619defcffa6:Mockups.png)

---

## **Flow Chart**

`Start Screen
    ↓
Chapter (0/10) - County Theme Loads
    ↓
Level 1 → Complete → Clue 1 → Continue
Level 2 → Complete → Clue 2 → Continue
Level 3-9 → (same pattern)
Level 10 → Complete → Clue 10 → Continue
    ↓
Story Reveal Interstitial
    ↓
\[Headline + Summary + Link\]
    ↓
Continue to Next Chapter
    ↓
(cycle repeats infinitely)`

---

## **Progression**

Each chapter will start with easier levels and will get harder towards the end of the chapter.

**Difficulty Scaling:**

- Levels 1-2: 4×4 grid, 2-3 landmarks
- Levels 3-6: 5×5 grid, 3-5 landmarks
- Levels 7-10: 6×6 grid, 5-7 landmarks
- Resets slightly each new chapter

**No Failure State:**

- Unlimited moves
- No time limits
- Focus on discovery, not competition

---

## **Story Clue System**

The clues are snippets from the news and their main goal is to invoke curiosity in players.

**Clue Types:**

- Text: "A local hero returns..."
- Category: "🏈 Sports"
- Location: "Big news in Trenton..."
- Keywords: "Jackpot", "Championship"

**Example (TBD - Writers)**

---

## **County Themes**

To enhance localization, we'll incorporate art assets from different counties in New Jersey based on the news story featured on that chapter.

**21 NJ Counties, each featuring:**

- 1-2 unique landmarks
- Themed decorations
- Color variations

**Examples:**

- Atlantic: Casino, Boardwalk
- Bergen: Mall, GW Bridge
- Cape May: Lighthouse, Beach
- Essex: Airport, Arts Center
- Hudson: Liberty Park, Waterfront

---

## **Mechanics**

As of now, we have the most basic mechanics allowing for a relaxing, forever puzzle game.
Based on the performance, we may add more mechanics in the future.

**MVP:**

- Tap to rotate tiles
- Connect all landmarks
- option to restart (reload) level
- No restrictions (i.e. move limits, time limits etc)

---

## **Narrative/Characters (TBD)**

We are planning to incorporate one of these characters in the game as a companion to both guide and excite the player.

**THE PAPER KID:**

**Companion:**

- The last Paper Boy/Girl in town, still delivering physical news in a place that has gone fully digital.
- Races through neighborhoods shouting the story in quick bursts as they pass.
- Relies on the player to chart a usable delivery route so they can keep the tradition of print news alive.

**Player’s Role:**

- The player connects streets to build the Paper Kid’s delivery path through each neighborhood.
- Each new route lets the Paper Kid shout out another snippet of the day’s story as they speed by.
- By completing the full set of routes, the player helps them share the entire article with the community.

**News Reveal:**

- When a level is completed, the Paper Kid shouts the next snippet while rushing down the newly opened path.
- The snippet appears on screen in sync with their shout, revealing the next piece of the story.

**GOODBOI: THE NEWS HOUND:**

**Companion:**

- A loyal News Hound with a sharp nose for developing stories.
- Follows scent trails through different neighborhoods where parts of the article have surfaced.
- Depends on the player to connect the correct routes so he can track the story piece by piece.

**Player’s Role:**

- The player draws routes and connects the roads to guide the News Hound from one clue location to the next.
- Each completed path leads him to another spot where he picks up a new part of the article.
- By helping the Hound follow the scent trail, the player uncovers the full story.

**News Reveal:**

- When a level is completed, the News Hound “finds” the next snippet, barking or reacting as the new clue appears.
- The snippet fades in as if discovered on the spot, representing the next piece of the developing article.

---

## Asset List

Below is the required visual assets for the MVP.

VFX

- Rotating tiles (particles)
- When roads are connected (color change/asset change)
- When a level is complete (particles & celebratory image)
  - 5-10 celebratory image variations (traffic light in the current prototype) → to be displayed on different sections

UI

- Next button
- Start Button
- Chapter Interstitial
- Chapter Complete Interstitial & news reveal
- News clues
- Fill bar (showing progress in a chapter) → how many levels left to finish the chapter & reveal the news

Art

- Shared Game Pieces
  - House
  - Gas station
  - Diner
  - School
  - Exit sign _→ can we swap exits based on the locations?_
  - Roads tiles
    - straight
    - L shaped
    - T junction
- County Landmarks (TBD)
- Decorational items (i.e. trees, bushes)
  - 8+ options

## Asset List (SFX)

Below are the required audio assets for the MVP.

Gameplay

- Music (multiple jazzy tracks, rotating between chapters)
- Rotating tiles → 5-10 variations
- When a level is complete
- When a chapter is complete
- News reveal interstitial

UI

- Button clicked

---

## **Content**

**AI-Generated Weekly:**

1. AI scans top nj.com stories
2. Maps stories to NJ counties
3. Generates 10 clues per story
4. Creates solvable level layouts
5. _Human editor reviews before publish(?)_

**Content Structure:**

- 3-5 new chapters per week
- Each chapter = county + story + 10 levels
- Clues progress from vague to specific

---

## City Lines Level Generation Summary

### Architecture Overview

**Two-tier loading system:**

Level 1-3 → Hand-crafted JSON

Level 4+ → Procedurally generated with deterministic seed

---

### LevelGenerator

There is an infinite level genarator integrated in the game. Here is how it works:

**Phase 1: Landmark Placement**

1. **Count**: 2 for easy, 3-4 for medium/hard
2. **Spacing Constraints:**
   - Minimum **3 tiles** from turnpike
   - Minimum **2 tiles** between landmarks
3. **Position**: Random position anywhere on grid (0 to gridSize-1 for both row and col)
4. **Cannot occupy**: Already occupied tiles (turnpike or other landmarks)
5. **Landmark types cycle**: Diner → GasStation → Market (repeats if more than 3)
6. **Max attempts**: 100 tries per landmark before generation fails

**Phase 2: Path Selection**

- For each landmark → generate path to turnpike using constrained random walk
- Key constraint: **No crossroads allowed** (max 3 connections per tile = T-junction)
- There is a variable for detour probability: adds randomness (0.1 easy → 0.6 hard)

**Phase 3: Tile Type Assignment**

- Based on actual connections, assign tile types:
  - 2 opposite connections → straight road
  - 2 adjacent connections → corner road
  - 3 connections → t_junction road
- Save solution rotation for each tile

**Phase 4: Scramble Road Tiles**

- Randomly rotate all road tiles to create the puzzle

**Phase 5: Tree Decorations**

- Place up decorative assets on empty tiles (non-gameplay)

---

### Difficulty Scaling

| Level Range | Grid Size | Landmarks | Min Path | Detour % |
| ----------- | --------- | --------- | -------- | -------- |
| 1-2         | 4×4       | 2-3       | 3        | 10-15%   |
| 3-6         | 5×5       | 3-5       | 4        | 20-35%   |
| 7-10        | 6×6       | 5-7       | 5        | 40-60%   |

---

### Key Technical Details

- **Deterministic RNG**: Uses XORShift32 seeded with `levelNumber \* 12345` for reproducibility
- **Retry Logic**: Up to 10 attempts with different seeds if generation fails
- **Bad Seed Tracking**: Failed seeds are cached to avoid retrying
- **Output Format**: `GameConfig` with `entities` (CityGrid), `ui` (HeadlineDisplay), `gridTiles`, and `headlines`

---

## **Architecture and Configurability**

**Configurable:**

- Grid sizes
- Number of landmarks
- Detour probability
- Chapter length
- Clue display time
- Rotation behavior

---

## **Technical Notes**

**Tracking:**

- Completion rates
- Article click-through
- Session length
- County popularity
- Drop-off points

**AI Pipeline:**

- Weekly content generation
- Admin moderation dashboard
- Manual fallback option

---

## UX/UI Implementations

Feedback

- When road tile directly next to highway sign is correctly orientated, the road on that tile turns green
  - If the tile is not correctly oriented, it doesn’t change
- All subsequent tiles that are correctly orientated and in contact with the tile next to the highway also turn green

---

## Post MVP

### Mechanics

- Unlocking Connections
- Different Road Types
- Move Limits
- Time Limits
- Hints/undo
- Achievement badges
- Story archive
  - News Basket
    A place that allows players to see all the news they collected that week
  - updates weekly
  - can be displayed:
    - as a cute oldschool shopping basket
    - as a newspaper where slots fill up as players collect news stories
  - provides access to link to news & bookmarks

### Leaderboard/Social

- Community challenges
- County vs. County leaderboards
- Social sharing
