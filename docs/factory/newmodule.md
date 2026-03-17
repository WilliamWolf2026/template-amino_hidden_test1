## 🧩 New Module

Scaffold a new module in `src/modules/`.

Constraints {
  - Only creates files inside `src/modules/<category>/<name>/`
  - Never modifies core/ or game/
  - Templates live in `docs/factory/templates/modules/`
  - All naming derived from a single kebab-case input
}

Naming {
  From the kebab-case module name, derive all variants:

  | Token                  | Example (`sprite-button`)  |
  |------------------------|---------------------------|
  | `__MODULE_NAME__`      | sprite-button             |
  | `__PASCAL_NAME__`      | SpriteButton              |
  | `__UPPER_SNAKE_NAME__` | SPRITE_BUTTON             |
  | `__CAMEL_NAME__`       | spriteButton              |
  | `__DISPLAY_NAME__`     | Sprite Button             |
}

Process {
  1. **Ask**: module name (kebab-case) and category (primitive / logic / prefab)
  2. **Derive** all naming tokens from the kebab-case name
  3. **Create directory**: `src/modules/<category>/<name>/`
  4. **Copy templates**: Read from `docs/factory/templates/modules/<category>.*.ts`,
     replace all `__TOKEN__` placeholders, write to the module directory:

     Primitive & Prefab:
     - `<category>.index.ts`          → `index.ts`
     - `<category>.defaults.ts`       → `defaults.ts`
     - `<category>.tuning.ts`         → `tuning.ts`
     - `<category>.renderer.pixi.ts`  → `renderers/pixi.ts`

     Logic:
     - `logic.index.ts`               → `index.ts`
     - `logic.defaults.ts`            → `defaults.ts`
     - `logic.tuning.ts`              → `tuning.ts`

  5. **Verify**: confirm all files compile with `npx tsc --noEmit`
  6. **Update INDEX**: add the new module row to `src/modules/INDEX.md`
     in the correct category table (Primitives / Logic / Prefabs)
}

Output {
  Created `src/modules/<category>/<name>/`:
  - index.ts
  - defaults.ts
  - tuning.ts
  - renderers/pixi.ts (primitive and prefab only)

  Updated: `src/modules/INDEX.md`
}

Where to put it {
  - Single-purpose visual component → `primitives/`
  - Pure logic, no rendering → `logic/`
  - Assembles multiple primitives → `prefabs/`
  - Reusable across games? It belongs in modules. Game-specific? It goes in `game/`.
}
