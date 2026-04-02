# Epic: Renderable Primitive Base & Component Architecture

Status: **brainstorming**

---

## The Problem

Every visual module (`SpriteButton`, `DialogueBox`, `CharacterSprite`, `ProgressBar`, `AvatarPopup`, `HeroHostDialogue`) directly extends `Container` and re-implements the same boilerplate:

```typescript
// This pattern repeats in every single visual module:
constructor() {
  super();
  this.label = 'name';
}
resize() { /* ad-hoc or missing */ }
update() { /* ad-hoc or missing */ }
destroy() {
  gsap.killTweensOf(this);
  gsap.killTweensOf(this.scale);
  this.removeAllListeners();
  super.destroy(options);
}
```

There's no shared contract for lifecycle (`update`, `resize`, `destroy`), no renderer abstraction, and prefabs rebuild primitives from raw Pixi objects instead of composing them.

---

## Vision

A `RenderableComponent` base that:
1. Standardizes lifecycle across all visual modules
2. Abstracts the renderer backend (Pixi, Phaser, Three.js)
3. Enables prefabs to compose primitives cleanly
4. Keeps the existing module folder structure (`defaults.ts`, `tuning.ts`, `renderers/`)

---

## Open Questions (Brainstorming)

### Q1: How does the renderer abstraction work?

Today `sprite-button` has `renderers/pixi.ts`, `renderers/phaser.ts`, `renderers/three.ts` — but each is a completely independent class. There's no shared interface between them.

**Option A: Abstract base per renderer backend**

```
RenderableComponent (abstract, renderer-agnostic interface)
  ├── PixiRenderable extends Container    ← pixi modules extend this
  ├── PhaserRenderable extends Phaser.GameObjects.Container
  └── ThreeRenderable extends THREE.Group
```

Each backend gets its own base that implements the shared contract using that engine's primitives. A `SpriteButton` pixi renderer extends `PixiRenderable`, a phaser one extends `PhaserRenderable`.

**Option B: Interface-only contract, no base classes**

```typescript
interface RenderableComponent {
  label: string;
  update(dt: number): void;
  resize(width: number, height: number): void;
  destroy(): void;
}
```

Each renderer implements the interface. No inheritance chain. Shared destroy logic lives in utility functions (`destroyPixiRenderable(component)`).

**Option C: Mixin approach**

```typescript
// A mixin that adds lifecycle to any Container subclass
function withLifecycle<T extends Constructor<Container>>(Base: T) {
  return class extends Base {
    update(dt: number) {}
    resize(w: number, h: number) {}
    destroy() { gsap.killTweensOf(this); ... }
  }
}

class SpriteButton extends withLifecycle(Container) { ... }
```

No deep inheritance, works with any engine's base class.

**Leaning toward:** Option A — it's the most explicit, keeps type safety, and maps 1:1 to the existing `renderers/` folder pattern. The three backends have fundamentally different primitives (Sprite vs Phaser.Sprite vs THREE.Mesh), so a shared abstract base per backend makes more sense than trying to unify them.

### Q2: What goes in the base vs. what stays in the component?

The base should handle:
- `label` assignment
- `destroy()` boilerplate (GSAP cleanup, listener removal)
- `update(dt)` and `resize(w, h)` as overridable no-ops
- Show/hide animation helpers (alpha + scale — used by almost every component)

The base should NOT handle:
- Constructor logic (too varied — some need `gpuLoader`, some don't)
- Specific child creation (sprites, graphics, text)
- Event binding (pointer handlers are component-specific)
- Animation specifics beyond show/hide

### Q3: How do components that need "parts" work?

Example: `AvatarPopup` needs a character sprite + a dialogue box. Today it rebuilds both from raw Pixi objects. It *should* compose the primitives.

**Proposed pattern: Slot-based composition**

```typescript
class AvatarPopup extends PixiRenderable {
  private character: CharacterSprite;
  private dialogue: DialogueBox;

  constructor(gpuLoader: PixiLoader, config: AvatarPopupConfig) {
    super('avatar-popup');

    // Compose primitives as "parts"
    this.character = new CharacterSprite(gpuLoader, {
      type: config.characterType,
      spriteMap: config.spriteMap,
      atlasName: config.atlasName,
      baseSize: config.characterBaseSize,
    });

    this.dialogue = new DialogueBox(gpuLoader, {
      atlasName: config.atlasName,
      spriteName: config.dialogueSpriteName,
      positioning: config.dialoguePositioning,
    });

    this.addChild(this.character, this.dialogue);
  }

  // Lifecycle cascades to parts automatically via Container.destroy({ children: true })
  // resize() can delegate to parts:
  resize(w: number, h: number) {
    this.dialogue.resize(w, h);
  }
}
```

**Key insight:** if primitives extend `PixiRenderable` and implement `resize()` and `update()`, a prefab can just iterate its children and call those methods. No special wiring needed.

### Q4: Can we auto-cascade `update` and `resize` to children?

```typescript
class PixiRenderable extends Container {
  update(dt: number): void {
    // Override point for this component's own logic
  }

  /** Called by game loop — ticks self then children */
  tick(dt: number): void {
    this.update(dt);
    for (const child of this.children) {
      if (child instanceof PixiRenderable) {
        child.tick(dt);
      }
    }
  }
}
```

This means the game loop calls `tick()` on the root, and it cascades. Components only override `update()` for their own logic. Same pattern for `resize()`.

**Risk:** not all children are RenderableComponents (raw Sprites, Graphics, etc.). The `instanceof` check handles this, but it's worth noting.

### Q5: What about extension for specialized needs?

Some components need more than the basic lifecycle. Examples:
- `ProgressBar` needs an `animationTime` tick
- `SpriteButton` needs pointer state management
- `HeroHostDialogue` needs show/hide with callbacks

**Proposed:** Keep the base thin. Specialized behavior stays in the component. The base provides hooks, not full implementations.

```
PixiRenderable (label, destroy, update, resize, show/hide)
  ├── SpriteButton        adds: pointer state, enable/disable
  ├── DialogueBox         adds: setText, auto-resize
  ├── CharacterSprite     adds: setScale, type mapping
  ├── ProgressBar         adds: animated fill, milestone dots
  └── AvatarPopup         adds: show/dismiss with timeout, composes CharacterSprite + DialogueBox
```

One level of inheritance. No deep chains. Components own their specialization.

---

## Tickets

### Ticket 1: `PixiRenderable` base class

Create `modules/primitives/_base/PixiRenderable.ts`:
- Extends `Container`
- Constructor takes `label: string`
- `update(dt: number)` — overridable no-op
- `resize(width: number, height: number)` — overridable no-op
- `tick(dt)` — calls `update` then cascades to renderable children
- `destroy()` — GSAP cleanup, listener removal, `super.destroy({ children: true })`
- `show()` / `hide()` — basic alpha+scale animation helpers (optional, used by most)

Scope: ~60 lines. No tests needed yet (it's a base class, tested through consumers).

### Ticket 2: Migrate existing primitives to extend `PixiRenderable`

- `SpriteButton` — remove manual label/destroy, extend base, add `dt` to existing no-op
- `DialogueBox` — add `update(dt)` no-op, standardize `resize` signature
- `CharacterSprite` — remove manual destroy, extend base
- `ProgressBar` — replace hardcoded `0.016` delta with `dt` from `update(dt)`

Each primitive is a small diff. Keep behavior identical, just deduplicate.

### Ticket 3: Migrate prefabs to compose primitives

- `AvatarPopup` — import and use `CharacterSprite` + `DialogueBox` instead of raw Pixi objects
- `HeroHostDialogue` — import and use `CharacterSprite` + `DialogueBox`
- Validate that lifecycle cascades correctly (resize, destroy)

This is the harder ticket. The prefabs have custom layout logic that may need the primitives to expose more configuration.

### Ticket 4: Phaser and Three.js base stubs

Create `modules/primitives/_base/PhaserRenderable.ts` and `ThreeRenderable.ts`:
- Same lifecycle interface as `PixiRenderable`
- Extend `Phaser.GameObjects.Container` / `THREE.Group` respectively
- Stub implementations — fleshed out when a game needs them

### Ticket 5: Game loop integration

Wire the `tick(dt)` cascade into the game loop so renderable trees auto-update:
- Identify where the game loop lives today
- Call `root.tick(dt)` instead of manually updating individual components
- Verify `ProgressBar` animation works with real delta time

---

## Non-Goals

- **Not a scene graph rewrite.** The game's existing layer system (BackgroundLayer, GridLayer, HudLayer) stays. Those are game-specific, not reusable modules.
- **Not an ECS.** This is lightweight OOP composition, not entity-component-system architecture.
- **Not forcing all Pixi objects through the base.** Raw `Sprite`, `Graphics`, `Text` stay as leaf nodes. Only reusable *components* extend `PixiRenderable`.

---

### Ticket 6: Universal skills repo

AI skills (custom slash commands, workflows, agent guidance) are currently scattered across every repo — `aidd-custom/`, `ai/`, `.claude/` folders in template-amino, game-kit, game-components, etc. Each repo has its own copy, they drift out of sync, and updating a skill means touching every project.

**Goal:** Single `skills/` repo (or package) that all projects pull from. Update once, propagate everywhere.

Open questions:
- **Delivery mechanism** — git submodule? `@wolfgames/skills` package? symlinked folder? Submodule is simplest but has DX friction. A package means a publish cycle for skill changes. Symlinks break in CI.
- **Override layer** — projects may need project-specific skill overrides (e.g. template-amino has game-specific scaffolding skills). How do local overrides compose with the shared set? Convention: shared skills in `skills/`, local overrides in `skills/local/` that take precedence?
- **Inventory needed** — audit what skills exist across all repos today, deduplicate, decide what's universal vs. project-specific
- **Versioning** — do all projects pin the same skills version, or can they float independently?
- **Skill lifecycle / taxonomy** — skills fall into different categories that need product input:
  - **Permanent skills** — always available, core to the workflow (e.g. commit, review, plan)
  - **Temporary/scaffolding skills** — used during project setup then retired (e.g. "assemble game", "create game", "scaffold screen")
  - **Domain skills** — tied to a specific product concern (e.g. analytics wiring, asset generation, game balancing)
  - Which skills are which? This needs a conversation with product to audit and classify.
- **Naming convergence** — we have overlapping intent across skills ("assemble game", "create game", "make game", "build game"). Product needs to define the canonical verbs and what each one actually means in our workflow.
- **Cross-team collaboration required** — this ticket is heavy on alignment, not just engineering. Need product input on: what skills exist today, which are worth keeping, what the canonical set should be, and how they map to actual team workflows. This is a discovery/alignment ticket before it's an implementation ticket.

### Ticket 7: Renderer guardrails skill

A skill (or set of guardrails) that enforces renderer discipline throughout development. It reads from the GDD and the chosen renderer backend, then gates decisions about what gets rendered where and how.

**What it does:**

1. **Renderer selection gate** — at project kickoff, the GDD describes the game. The guardrails evaluate what the game needs and recommend (or validate) the renderer:
   - 2D sprite-based, no physics → Pixi.js
   - 2D with physics (collisions, gravity, ragdoll) → Phaser (Arcade/Matter.js) or Pixi + a physics lib
   - 3D objects, camera, depth → Three.js
   - Hybrid (3D scene with 2D UI) → Three.js renderer + Pixi/DOM overlay layer
   
   This is a one-time decision at project start, but the guardrails enforce it for the life of the project.

2. **Renderer purity enforcement** — once a renderer is chosen, the guardrails prevent drift:
   - No CSS transitions/animations for gameplay elements (use GSAP or the renderer's native animation)
   - No DOM elements for in-game items (grid cells, characters, particles, game objects)
   - No mixing renderers mid-scene without explicit justification
   - Flag performance anti-patterns: DOM layout thrashing during gameplay, CSS transforms on elements that should be sprites, `requestAnimationFrame` competing with the renderer's own loop

3. **DOM vs. renderer decision tree** — not everything belongs in the renderer. The guardrails codify when DOM is the right call:

   ```
   Is it a gameplay element (moves, animates, interacts with game objects)?
     → Renderer. Always.
   
   Is it a UI overlay (menu, settings, modal, pause screen)?
     → Does it need to interlace with game objects (appear behind/between sprites)?
       → Yes: Renderer. Build it as a renderable component.
       → No: Does it have complex text layout, forms, or accessibility needs?
         → Yes: DOM overlay. Positioned above the canvas.
         → No: Either works. Prefer renderer for visual consistency.
   
   Is it a HUD element (score, timer, progress)?
     → Does it need effects (particles behind it, glow, shake)?
       → Yes: Renderer.
       → No: Either works. Renderer preferred for frame-sync.
   ```

4. **Physics engine selection** — if the game needs physics, the guardrails point to compatible libraries per renderer:

   | Renderer | Physics options | Notes |
   |----------|----------------|-------|
   | Pixi.js | matter.js, planck.js, p2.js | Pixi has no built-in physics; bring your own. matter.js is most common. |
   | Phaser | Arcade Physics, Matter.js (built-in), Impact | Arcade for simple AABB. Matter for complex shapes/joints. |
   | Three.js | cannon-es, rapier, ammo.js (Bullet) | rapier is fastest (WASM). cannon-es is most accessible. |

   The guardrails recommend based on GDD complexity: "your game has simple collision boxes" → Arcade/matter.js. "Your game has joints, springs, ragdoll" → Matter/rapier.

5. **Ongoing enforcement** — the guardrails aren't just a one-time check. They run as part of the development workflow:
   - Flag PRs that introduce DOM elements inside game containers
   - Flag CSS animation properties on elements that should be renderer-managed
   - Flag new dependencies that conflict with the chosen renderer (e.g. importing Three.js in a Pixi project)
   - Flag performance concerns: large DOM subtrees updating per-frame, layout recalculations during gameplay

**How this becomes a skill:**

This ticket is about *building* the skill, not the skill itself. The work is:

- Audit existing games to catalog where DOM vs. renderer decisions were made (and which ones were wrong / caused perf issues)
- Distill the decision tree above into a compact, queryable format the skill can reference
- Write the skill as a guardrail that runs during planning and review — it reads the GDD, knows the chosen renderer, and flags violations or recommends corrections
- Include a library reference (physics engines, animation libs, UI toolkits) per renderer so the skill can point devs to the right tool instead of just saying "don't do that"
- Test against past projects: would this guardrail have caught the DOM-grid-items mistake? The CSS-transition-as-animation mistake? If not, refine.

**This is a living document** — as we hit new edge cases (e.g. "we need a DOM input field inside a Pixi scene for a text entry game"), the guardrails get updated with the approved pattern.

---

## File Structure After

```
src/modules/primitives/
  _base/
    PixiRenderable.ts         ← Ticket 1
    PhaserRenderable.ts       ← Ticket 4 (stub)
    ThreeRenderable.ts        ← Ticket 4 (stub)
    index.ts                  ← barrel export
  sprite-button/
    renderers/
      pixi.ts                 ← extends PixiRenderable (Ticket 2)
      phaser.ts               ← extends PhaserRenderable (future)
      three.ts                ← extends ThreeRenderable (future)
    ...
  dialogue-box/
    renderers/
      pixi.ts                 ← extends PixiRenderable (Ticket 2)
    ...
  ...

src/modules/prefabs/
  avatar-popup/
    renderers/
      pixi.ts                 ← composes CharacterSprite + DialogueBox (Ticket 3)
    ...
```
