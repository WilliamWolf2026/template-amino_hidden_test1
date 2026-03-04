/**
 * Builds a semantic router index from the entire project,
 * categorized by architectural role for precise querying.
 * Serializes to scripts/router-index.json for fast loading.
 *
 * Usage: npx tsx scripts/build-index.ts
 */
import { SemanticRouter, indexFiles, createOramaEmbedFn } from '@wolfgames/semantic-router'
import { writeFile } from 'node:fs/promises'
import { join } from 'node:path'

const ROOT = join(import.meta.dirname, '..')
const OUTPUT = join(ROOT, 'scripts', 'router-index.json')

/** Each source maps a type label to a directory + extensions. */
const sources = [
  // --- Documentation & Rules ---
  { type: 'rule', path: 'ai/rules', ext: ['.mdc', '.md'] },
  { type: 'doc', path: 'docs', ext: ['.md'] },
  { type: 'command', path: 'docs/factory', ext: ['.md'] },

  // --- Scaffold (read-only framework) ---
  { type: 'scaffold-system', path: 'src/scaffold/systems', ext: ['.ts', '.tsx'] },
  { type: 'scaffold-ui', path: 'src/scaffold/ui', ext: ['.ts', '.tsx'] },
  { type: 'scaffold-config', path: 'src/scaffold/config', ext: ['.ts'] },
  { type: 'scaffold-dev', path: 'src/scaffold/dev', ext: ['.ts', '.tsx'] },
  { type: 'scaffold-lib', path: 'src/scaffold/lib', ext: ['.ts'] },
  { type: 'scaffold-util', path: 'src/scaffold/utils', ext: ['.ts', '.tsx'] },

  // --- Game (shared across variants) ---
  { type: 'game-screen', path: 'src/game/screens', ext: ['.ts', '.tsx'] },
  { type: 'game-component', path: 'src/game/shared/components', ext: ['.ts'] },
  { type: 'game-controller', path: 'src/game/shared/controllers', ext: ['.ts'] },
  { type: 'game-audio', path: 'src/game/audio', ext: ['.ts'] },
  { type: 'game-service', path: 'src/game/services', ext: ['.ts'] },
  { type: 'game-config', path: 'src/game/config', ext: ['.ts'] },
  { type: 'game-type', path: 'src/game/types', ext: ['.ts'] },
  { type: 'game-tuning', path: 'src/game/tuning', ext: ['.ts'] },
  { type: 'game-hook', path: 'src/game/hooks', ext: ['.ts'] },
  { type: 'game-analytics', path: 'src/game/analytics', ext: ['.ts'] },

  // --- CityLines variant ---
  { type: 'citylines-core', path: 'src/game/citylines/core', ext: ['.ts'] },
  { type: 'citylines-ui', path: 'src/game/citylines/ui', ext: ['.ts'] },
  { type: 'citylines-data', path: 'src/game/citylines/data', ext: ['.ts'] },
  { type: 'citylines-type', path: 'src/game/citylines/types', ext: ['.ts'] },
  { type: 'citylines-service', path: 'src/game/citylines/services', ext: ['.ts'] },
  { type: 'citylines-animation', path: 'src/game/citylines/animations', ext: ['.ts'] },
  { type: 'citylines-system', path: 'src/game/citylines/systems', ext: ['.ts'] },
  { type: 'citylines-controller', path: 'src/game/citylines/controllers', ext: ['.ts'] },
  { type: 'citylines-screen', path: 'src/game/citylines/screens', ext: ['.ts'] },
  { type: 'citylines-util', path: 'src/game/citylines/utils', ext: ['.ts'] },

  // --- Daily Dispatch variant ---
  { type: 'dispatch-core', path: 'src/game/dailydispatch/core', ext: ['.ts'] },
  { type: 'dispatch-ui', path: 'src/game/dailydispatch/ui', ext: ['.ts'] },
  { type: 'dispatch-data', path: 'src/game/dailydispatch/data', ext: ['.ts'] },
  { type: 'dispatch-type', path: 'src/game/dailydispatch/types', ext: ['.ts'] },
  { type: 'dispatch-service', path: 'src/game/dailydispatch/services', ext: ['.ts'] },
  { type: 'dispatch-animation', path: 'src/game/dailydispatch/animations', ext: ['.ts'] },
  { type: 'dispatch-system', path: 'src/game/dailydispatch/systems', ext: ['.ts'] },
  { type: 'dispatch-controller', path: 'src/game/dailydispatch/controllers', ext: ['.ts'] },
  { type: 'dispatch-screen', path: 'src/game/dailydispatch/screens', ext: ['.ts'] },
  { type: 'dispatch-util', path: 'src/game/dailydispatch/utils', ext: ['.ts'] },

  // --- Public data ---
  { type: 'tuning', path: 'public/config/tuning', ext: ['.json'] },
  { type: 'level', path: 'public/chapters', ext: ['.json'] },
] as const

async function build() {
  console.log('Loading embedding model...')
  const embedFn = await createOramaEmbedFn()
  const router = new SemanticRouter(embedFn)
  await router.init()

  const counts: Record<string, number> = {}
  let total = 0

  for (const { type, path, ext } of sources) {
    const files = await indexFiles(join(ROOT, path), {
      type,
      extensions: [...ext],
    })
    await router.addMany(files)
    counts[type] = files.length
    total += files.length
  }

  const data = await router.serialize()
  await writeFile(OUTPUT, JSON.stringify(data))

  console.log(`\nIndexed ${total} files across ${sources.length} categories:\n`)
  for (const [type, count] of Object.entries(counts)) {
    if (count > 0) console.log(`  ${String(count).padStart(4)}  ${type}`)
  }
  console.log(`\nSaved to ${OUTPUT}`)
}

build().catch(console.error)
