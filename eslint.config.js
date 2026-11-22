// @ts-check
import { builtinModules } from 'node:module'
import js from '@eslint/js'
import { defineConfig } from 'eslint/config'
import tseslint from 'typescript-eslint'

// Module boundaries from .kiro/steering/tech.md, enforced on import
// specifiers. A relative import that climbs out of one module directory into
// a sibling it may not use is an error, and so is a package or Node builtin
// the module may not use.
//
// | Module      | May import                           | Must not import                  |
// |-------------|--------------------------------------|----------------------------------|
// | src/engine  | nothing outside src/engine           | render, ssh, web, Node, DOM      |
// | src/render  | engine                               | ssh, web, Node, DOM              |
// | src/bots    | engine                               | render, ssh, web                 |
// | src/ssh     | engine, render, bots, ssh2, Node     | web                              |
// | src/web     | engine, render, bots, xterm          | ssh, Node                        |

const ALL_MODULES = ['engine', 'render', 'bots', 'ssh', 'web']

/** Packages that belong to exactly one module. */
const OWNED_PACKAGES = {
  ssh2: 'ssh',
  '@xterm/xterm': 'web',
}

/**
 * @type {Record<string, { mayImport: string[]; node: boolean }>}
 * `node`: whether Node builtins are allowed. bots is held to the same rule as
 * engine and render because design.md says botMove is pure.
 */
const RULES = {
  engine: { mayImport: [], node: false },
  render: { mayImport: ['engine'], node: false },
  bots: { mayImport: ['engine'], node: false },
  ssh: { mayImport: ['engine', 'render', 'bots'], node: true },
  web: { mayImport: ['engine', 'render', 'bots'], node: false },
}

/** @param {string[]} modules */
function climbsInto(modules) {
  return `^(\\.\\./)+(${modules.join('|')})(/|$)`
}

/** @param {string} name */
function boundary(name) {
  const { mayImport, node } = RULES[name]
  const forbidden = ALL_MODULES.filter((m) => m !== name && !mayImport.includes(m))
  const allowedText =
    mayImport.length > 0 ? mayImport.map((m) => `src/${m}`).join(', ') : 'nothing outside itself'

  /** @type {{ regex: string; message: string }[]} */
  const patterns = [
    {
      regex: climbsInto(forbidden),
      message: `src/${name} may import ${allowedText} (tech.md, module boundaries).`,
    },
  ]
  /** @type {{ name: string; message: string }[]} */
  const paths = []

  for (const [pkg, owner] of Object.entries(OWNED_PACKAGES)) {
    if (owner !== name) {
      paths.push({ name: pkg, message: `${pkg} belongs to src/${owner} only (tech.md).` })
    }
  }
  if (!node) {
    const message = `src/${name} must not use Node APIs (tech.md).`
    patterns.push({ regex: '^node:', message })
    for (const mod of builtinModules) {
      if (!mod.startsWith('node:')) paths.push({ name: mod, message })
    }
  }
  return { paths, patterns }
}

// Invariant 1 in tech.md: the engine is a pure function of (state, inputs).
// No clocks and no Math.random. render and bots are held to the same rule,
// since both must give the same output for the same state.
const PURE_MODULES = ['engine', 'render', 'bots']
const impure = 'not allowed in a pure module (tech.md, invariant 1); take time and randomness from the game state.'

export default defineConfig([
  { ignores: ['node_modules/', 'dist/', 'coverage/', '.kiro/', '.git/', '.data/'] },

  { extends: [js.configs.recommended] },

  {
    files: ['**/*.ts'],
    extends: [tseslint.configs.recommended],
  },

  {
    files: ['src/**/*.ts'],
    extends: [tseslint.configs.recommendedTypeChecked],
    languageOptions: { parserOptions: { project: './tsconfig.json' } },
  },

  ...ALL_MODULES.map((name) => ({
    files: [`src/${name}/**/*.ts`],
    rules: {
      '@typescript-eslint/no-restricted-imports': ['error', boundary(name)],
    },
  })),

  {
    files: PURE_MODULES.map((m) => `src/${m}/**/*.ts`),
    ignores: ['src/**/*.test.ts'],
    rules: {
      'no-restricted-properties': [
        'error',
        { object: 'Math', property: 'random', message: `Math.random is ${impure}` },
        { object: 'Date', property: 'now', message: `Date.now is ${impure}` },
        { object: 'performance', property: 'now', message: `performance.now is ${impure}` },
      ],
      'no-restricted-globals': [
        'error',
        ...['Date', 'performance', 'setTimeout', 'setInterval', 'setImmediate', 'process', 'window', 'document', 'navigator', 'crypto'].map(
          (name) => ({ name, message: `${name} is ${impure}` }),
        ),
      ],
    },
  },
])
