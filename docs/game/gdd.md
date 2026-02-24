## Daily Dispatch: Design Document

**Title:** Daily Dispatch

**Tagline:** "Keep your town moving."

**Genre:** Puzzle (Sliding Block / Spatial Reasoning)

**Platform:** Web (mobile-first, responsive)

**Target Audience:** Advance readers, adults 40+

**Latest Prototype Link:** https://daily-dispatch-us.vercel.app/

**Asset List:** [Production Requirements](https://www.notion.so/Production-Requirements-2e84a337719980ecb2c4e1a87f31c160?pvs=21)

**Screen Mocks:** TBD

---

## Game Overview

A sliding block puzzle game where players guide colored polyomino pieces to matching exits on a grid. The game combines the sliding mechanics of sliding puzzles with spatial reasoning.

### Setting

The game takes place in a warehouse distribution center. Players help Dale, the warehouse floor manager, sort and dispatch packages to the correct loading docks. Each section tells a real local news story through dialogue and package deliveries.

---

## Screens & Flow

Below is a description of each screen in the game flow.

### Title Screen

- Background: Warehouse setting
- Title: "DAILY DISPATCH"
- Tagline: "Keep your town moving." - TBD
- Play button

### Intro Cutscene

- Character: Marty (warehouse manager) slides up from bottom
- Marty introduces himself and explains the job
- Tap to advance through dialogue, then transitions to game

## Chapters

Players go through chapters to progress in the game. Each chapter consists of 5-10 levels and feature one top news story from that week.

Below is a description of each screen in a chapter:

### Chapter Start Interstitial

Screen shown when a new chapter starts.

- Chapter number and title (e.g., "CHAPTER 1: FISHTOWN IN LIGHTS")
- Section-specific background image
- marty introduces the section's story theme
- START button to begin first level

### Game Screen

All elements visible on gameplay screen.

- 6x6 grid with colored pieces and exits
- Section-specific warehouse backgrounds
- UI Elements:
    - Section name at top
    - Level number
    - Move counter with best score (based on min moves needed to solve the puzzle)
    - Restart button (top right)
    - Eraser booster button (bottom center)

### Level Complete

Sequence of events when a level is complete.

- "LEVEL X COMPLETE!" message
- Confetti particle effect
- Post-level dialogue popup
    - Marty reveals what was shipped and try to figure out what's happening
- And icon of the shipped item pops is visible
- NEXT button with pulse animation (appears after delay)

### Chapter Complete Screen

Screen shown when a new chapter ends.

**Part 1**

- Players are shown a truck with an open door
- They are prompted to slide the door to dispatch the shipment.
- Once they close the door, they proceed to Part 2

**Part 2**

- Animation of the truck leaves the warehouse
- "ALL DELIVERIES CLEARED" header animatin
- Animated score counter (levels x 100 + eraser bonus)
- Score breakdown display
- Marty reveals what the story was really about
- "Read the full story ->" link to actual news article
- CONTINUE button to next section

---

## Core Mechanics

Below is the description of all core mechanics of the game.

### The Grid

This is the gameplay board.

- Default size: 6x6
- Acts as a bounded play area
- Walls on all four sides with colored exits at specific positions

### Pieces (Blocks)

These are the gameplay elements (shapes) players slide on the board.

- Polyomino shapes: DOT, I2, I3, I4, L, J, T, O (2x2), rectangles
- Each piece has a single color category
- Fixed orientation per level (no rotation)
- Multiple pieces of the same color can exist

### Movement (Swipe-Based / Ice-Puzzle)

Description of piece movements on the grid.

- **Swipe to slide**: Swipe a piece in any direction
- Piece slides until it hits a wall, another piece, or exits
- **Ice-puzzle mechanic**: Pieces don't stop mid-slide
- Move counter increments on each successful move

### Exits

- Colored gates positioned on grid edges with house icons
- Each exit spans 1 or more cells (configurable)
- Exit color must match piece color for exit to occur
- Pieces animate sliding out and fading when exiting

### Exit Rule (Physical Fit)

A piece can only exit if its **perpendicular width** fits through the exit opening.

**Example:**

`A 1x3 horizontal piece:
---

Moving UP/DOWN -> perpendicular width = 3 cells
Moving LEFT/RIGHT -> perpendicular width = 1 cell

Exit on top wall (2 cells wide):
- Piece moving UP: 3 cells > 2 cells -> WON'T FIT
- Piece moving LEFT to left wall exit (3+ cells): 1 cell <= 3 cells -> FITS`

### Win Condition

Clear all pieces from the grid by guiding them to their matching exits.

---

## Boosters

Below is the boosters players can use to progress in levels:

### Eraser Booster

The eraser can remove any piece from the grid.

- 2 uses per chapter (resets at chapter start)
- Tap eraser button to activate eraser mode
- Tap any piece to remove it instantly (no exit required)
- Visual feedback: pieces become semi-transparent in eraser mode
- Unused erasers contribute to section score bonus

---

## Chapter & Level System

Difficulty progression resets on every new chapter.

### Chapter Structure

- Variable size (5-10 levels each)
- Each section tells a cohesive local news story

### Difficulty Progression

Within each section, levels follow a difficulty curve:

- **Easy**: Fewer pieces, simpler shapes
- **Medium**: More pieces, varied shapes
- **Hard**: Complex arrangements, more blocking

**Distribution per section size:**

| Section Size | Easy | Medium | Hard |
| --- | --- | --- | --- |
| 5 levels | 1 | 3 | 1 |
| 6 levels | 2 | 2 | 2 |
| 7 levels | 2 | 3 | 2 |
| 8 levels | 2 | 3 | 3 |
| 9 levels | 3 | 3 | 3 |
| 10 levels | 3 | 4 | 3 |

### Scoring

- Section Score = (Levels Completed x 100) + (Unused Erasers x 100)
- Best moves per level saved to localStorage

---

## Narrative Layer: Warehouse Distribution

Players work in a warehouse helping Dale sort and dispatch packages. Each section's packages relate to a real local news story, revealed through post-level dialogue.

### Current Story Sections

**Section 1: Fishtown in Lights**

- Setting: Leland, Michigan's historic fishing village
- Story: Community effort to save and illuminate Fishtown
- Packages: String lights, electrical supplies, hot cocoa, signage, sound equipment

**Section 2: The Spread**

- Setting: University of Michigan basketball
- Story: Sports betting's impact on college athletics
- Packages: Team equipment, training materials, compliance materials

### Character/Host

This is the host character introducing the game to the player. He is the authority figure and gives player's directions as well as revealing clues about news stories.

**Marty the Warehouse Manager**

- Thirty-two years on the warehouse floor.
- Old, cool, stylish. Does his job right.
- Seen enough to stop asking questions--but still gets curious despite himself.

**How he talks:**

- Short sentences. Punchy. No fluff.
- Trails off with "..." when thinking or connecting dots
- Rhetorical questions: "For what?" "But throwing what?"
- Dry, not warm. But not mean.
- Light roasting. Calls they player "rookie" and "hotshot." Doesn't comfort the player.
- When he's impressed, he doesn't say it directly. He just moves on.

**What he sounds like:**

- A guy who's heard every story and stopped being surprised
- Slightly tired, but shows up anyway
- The coworker who seems gruff but remembers your birthday
- Someone narrating true crime but it's about shipping boxes

**Signature patterns:**

- "Let's see what they need."
- "Something's happening out there."
- "Wait. No. They're not."
- "Oh. Now I see it."
- "Only in [place]."
- "[State/Town], man."

**What he's NOT:**

- Enthusiastic or bubbly
- Mean or bitter
- Wordy or rambling
- Overly helpful or hand-holdy

**His Introduction:**

- "Hey there. I'm Marty. Managing this floor for the last 32 years."
- "You're the new help? Alright, we'll see."
- "You wouldn't believe the stuff people ship to each other. Wedding cakes. Live bees once. I don't ask anymore."
- "Rules are simple: ship the boxes, clear my dock. Don't make me look bad."

### Marty's Narrative Arc (per section)

Each chapter, Marty discovers bits and pieces of a new story. He starts detached but as he keeps seeing the shipped items, he gets more and more curious. The goal here is to relay that curiosity to players through Marty.

**PHASE 1: DETACHED (Section Start)**

He's just doing his job. Another shipment, another day. Doesn't care yet.

Voice: Flat, factual, slightly bored.

Examples:

- "Big shipment. Old mall in East Brunswick. Something's happening."
- "Shipments to Prairie du Sac, Wisconsin. Small town. Labor Day weekend. Let's see what they need."
- "Eight shipments. Some fishing village up north. Never heard of it."

He's not invested yet. He's clocking in.

---

**PHASE 2: CURIOUS**

Something doesn't add up. He notices it but doesn't chase it yet.

Voice: Short observations. Questions to himself. First signs of interest.

Examples:

- "Flags. Lots of them. Something's getting measured out there."
- "Medical gear? To a shopping center?"
- "Custom engraved. 'Longest Throw.' Throw of what?"

He's not asking YOU--he's muttering to himself. The questions are rhetorical. He's starting to pay attention.

---

**PHASE 3: PIECING TOGETHER**

Now he's actively connecting dots. Items start talking to each other.

Voice: Shorter. Fragmented. Trailing off. Thinking out loud.

Examples:

- "Hand sanitizer. Pallets of it. And a note: 'No gloves allowed.' What are people touching?"
- "Wagons? For a competition? This doesn't add up."
- "Skylights. But there's already a roof. Unless..."

The ellipses are key. He's mid-thought. He doesn't have the answer yet but he's circling it.

---

**PHASE 4: THE CLICK**

The final piece lands. He gets it--sometimes with disbelief, sometimes with amusement.

Voice: A beat of realization. Often starts with "Wait" or "Oh."

Examples:

- "For curing something. Drying it out. Flipping it daily. Wait. No. They're not."
- "Full-grown trees. For indoors. Oh. The roof's not staying."
- "Backup stuffed animals. Why would an airport need-- oh."

This is the "aha" before the reveal. He figured it out just before you did.

---

**PHASE 5: THE REVEAL (Section Complete)**

Now he tells you what it all meant. But he doesn't explain it like a teacher--he delivers it like a guy who just witnessed something and wants you to appreciate it too.

Voice: Fuller sentences. A little warmth sneaks in. Often ends with a regional tag or dry observation.

Examples:

- "Cow chips. Dried cow manure. Cured in the sun, flipped for a month, then thrown for distance. Forty-three years running. State record's 248 feet. Only in Wisconsin."
- "Mall was a ghost town. Stores weren't paying rent. So they're tearing it open. East Brunswick never had a downtown. Now it does."
- "Forty years, one bad inspection, and it all went dark. New owner brought it back the right way. Love to see it."

He's not sentimental but you can tell he respects it. The reveal is him letting you in on something he now cares about, even if he'd never admit it.

---

## Level Generation

### Procedural Generation System

Levels are generated procedurally with seeded randomness for consistency:

1. **Anchor Placement**: Place 1-2 anchor pieces in grid corners
2. **Exit Assignment**: Create exits based on anchor positions
3. **Anchor Scramble**: Move anchors away from exits (4 moves)
4. **Dependent Placement**: Add smaller pieces touching anchors
5. **Dependent Scramble**: Scramble dependents (2 moves each)

### Shape Library

- **Anchor shapes**: I3_H, I3_V, I2_H, I2_V, O4
- **Dependent shapes**: DOT, I-pieces, L/J/T/S/Z rotations, rectangles

---

## Audio

### Sound Effects

- `sfx-press.wav`: Piece slide
- `delivered-1.mp3`: Piece exits successfully
- `level-end-1.mp3`: Level complete
- `whoosh.wav`: Eraser use

### Background Music

- `daily-dispatch-music-1.mp3`: Main game BGM
- Starts on first user interaction (title screen tap)

---

## Technical Details

### Responsive Design

- Mobile-first (portrait orientation)
- Aspect ratio: 9:16 (360x640 base)
- Proportional scaling with letterboxing
- All UI uses percentage-based sizing

### Controls

- **Mobile/Desktop**: Swipe/drag pieces to move
- **Debug Keys** (development only):
    - Arrow keys: Previous/next level
    - E: Jump to section complete screen

---

## UX/UI Considerations

During level/gameplay introduction, we can break up Marty's messages more to accompany what the player is seeing on the screen. We can also simplify Marty's messages to avoid large multiple blocks of text. We should also show a second level that explains how to use shapes to position other shapes to solve the puzzle.

Level 1 Example

- Dale says "See those colored boxes? Swipe the red one towards the matching dock." at the same time the red box and dock highlights.
    - When player swipes the first one in, Dale says "Great! Now move the other one." at the same time the blue box and dock highlights.
- Integrating the messages with the highlights prevents a situation where the player closes the dialogue boxes and forgets what they needed to do.

Level 2 Example

- New puzzle shows while Dale says "Things get cluttered here a lot, but you can use that to your advantage. Slide that red box up." The red box is highlighted.
- When player swipes the box up Dale says "Perfect. Now slide that yellow box to the right." The yellow box highlights.
- When player swipes the box to the right, Dale says "And just like that, you can get that yellow box on the dock." The yellow block and dock highlight.
- When player removes the yellow box, Dale says "Now you've got it! Go ahead and finish the job." Player completes level.
- Including this second example teaches the player a critical part of future puzzle solving: that they'll need to make use of other shapes to clear the board.

### Player Feedback

- Docks should should react to receiving the correct shape AND change state to show they've "closed"
- When shapes collide, we should include some kind of physics effect and sound, like a slight wobble to the shape that's hit and a thump sound, for extra feedback and delight.

### General

- More clarity around puzzle reset and erase buttons
- Consider including an undo button
- More clearly convey this is a swipe/ click and drag game with swipe animations
- On complete screen, show the object in question (in general more imagery and less text)
- Show a progress bar or meter to indicate when sections are complete/reset to easy
- More celebration when player beats a level in Best or less moves
- Boxes should look more like boxes

### TBD @Elle Opitz

---

## Content Pipeline

### AI-Generated Content (Future)

1. AI scans top local stories
2. Maps stories to regions/themes
3. Generates post-level dialogue connecting packages to story
4. Creates solvable level layouts with appropriate difficulty curve
5. *Human editor reviews before publish(?)*

### Content Structure

- *N new sections per week -> TBD*
- Each section = story theme + 5-10 levels + dialogue
- Story revealed progressively through post-level dialogue
