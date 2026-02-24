/**
 * Builds a semantic router index from ai/rules, docs/, and factory commands.
 * Serializes to scripts/router-index.json for fast loading.
 *
 * Usage: npx tsx scripts/build-index.ts
 */
import { SemanticRouter, indexFiles, createOramaEmbedFn } from '@wolfgames/semantic-router'
import { writeFile } from 'node:fs/promises'
import { join } from 'node:path'

const ROOT = join(import.meta.dirname, '..')
const OUTPUT = join(ROOT, 'scripts', 'router-index.json')

async function build() {
  console.log('Loading embedding model...')
  const embedFn = await createOramaEmbedFn()
  const router = new SemanticRouter(embedFn)
  await router.init()

  // Index AI rules (.mdc + .md)
  const rules = await indexFiles(join(ROOT, 'ai/rules'), {
    type: 'rule',
    extensions: ['.mdc', '.md'],
  })

  // Index docs (guides, scaffold docs, game docs)
  const docs = await indexFiles(join(ROOT, 'docs'), {
    type: 'doc',
    extensions: ['.md'],
  })

  // Index factory commands separately for command dispatch
  const commands = await indexFiles(join(ROOT, 'docs/factory'), {
    type: 'command',
    extensions: ['.md'],
  })

  await router.addMany(rules)
  await router.addMany(docs)
  await router.addMany(commands)

  const data = await router.serialize()
  await writeFile(OUTPUT, JSON.stringify(data))

  console.log(`Indexed ${rules.length} rules, ${docs.length} docs, ${commands.length} commands`)
  console.log(`Saved to ${OUTPUT}`)
}

build().catch(console.error)
