# Stack technique — TGC Engine

## Runtime

| Outil | Version | Rôle |
|---|---|---|
| Vite | 7.3 | Dev server, bundler, HMR |
| Sass | 1.97 | Préprocesseur CSS (API modern-compiler) |
| Vitest | 4.0 | Framework de test (ES modules natif) |
| ESLint | 10.0 | Linter JS (flat config) |

## ES Modules

Le projet utilise `"type": "module"` dans `package.json`.
Tous les imports/exports utilisent la syntaxe ESM (`import`/`export`).

## Scripts npm

| Commande | Action |
|---|---|
| `npm run dev` | Lance le dev server Vite avec HMR |
| `npm run build` | Build de production dans `dist/` |
| `npm run preview` | Prévisualise le build de production |
| `npm run test` | Lance les tests Vitest (single run) |
| `npm run test:watch` | Lance les tests en watch mode |

## Structure des fichiers

```
tgc/
├── index.html                      ← point d'entrée Vite
├── package.json
├── vite.config.js                  ← config Vite + Vitest + SCSS
├── eslint.config.js                ← config ESLint (flat config)
├── src/
│   ├── main.js                     ← entry point JS → charge l'UI dev
│   ├── core/
│   │   ├── engine/
│   │   │   ├── Engine.js           ← orchestrateur principal
│   │   │   ├── IntentResolver.js
│   │   │   ├── PausePolicy.js
│   │   │   ├── CycleDetector.js
│   │   │   ├── IdGenerator.js
│   │   │   └── ZoneTypeRegistry.js
│   │   ├── state/
│   │   │   └── PatchApplier.js
│   │   ├── commands/
│   │   │   ├── CommandLog.js
│   │   │   └── CommandRegistry.js
│   │   ├── rng/
│   │   │   └── RandomTape.js
│   │   ├── events/
│   │   │   ├── DomainEventBus.js
│   │   │   └── RuntimeBus.js
│   │   ├── effects/
│   │   │   ├── TriggerEngine.js
│   │   │   ├── ReplacementPipeline.js
│   │   │   ├── Resolver.js
│   │   │   └── ChoiceSystem.js
│   │   └── query/
│   │       ├── QueryAPI.js
│   │       └── ModifierRegistry.js
│   ├── gameplay/
│   │   ├── setup.js                ← crée et configure une partie
│   │   ├── definitions/
│   │   │   └── cards.js            ← 7 card definitions
│   │   └── commands/
│   │       ├── StartGameCommand.js
│   │       ├── StartTurnCommand.js
│   │       ├── DrawCardsCommand.js
│   │       ├── PlayCreatureCommand.js
│   │       ├── PlaySpellCommand.js
│   │       ├── AttackCommand.js
│   │       ├── EndTurnCommand.js
│   │       ├── DestroyCreatureCommand.js
│   │       ├── DealDamageCommand.js
│   │       ├── RestoreHpCommand.js
│   │       └── CheckWinConditionCommand.js
│   └── adapters/
│       └── ui-dev/
│           ├── UiAdapter.js        ← UI DOM interactive
│           └── styles.scss         ← styles de l'UI dev
├── tests/
│   ├── core/
│   │   ├── engine/Engine.test.js
│   │   ├── state/PatchApplier.test.js
│   │   ├── events/DomainEventBus.test.js
│   │   ├── rng/RandomTape.test.js
│   │   ├── query/QueryAPI.test.js
│   │   └── effects/Effects.test.js
│   └── gameplay/
│       └── scenario.test.js
└── doc/
    ├── stack.md                    ← ce fichier
    └── prompts/                    ← spécification du moteur
```

## SCSS

- Compilé par Vite via le package `sass` (dart-sass)
- API `modern-compiler` activée dans `vite.config.js`
- Utiliser `@use 'sass:color'` pour les fonctions de couleur modernes
- Import depuis JS : `import './adapters/ui-dev/styles.scss'`

## Tests (Vitest)

- Pattern : `tests/**/*.test.js`
- Config dans `vite.config.js` (section `test`)
- Pas de globals : utiliser `import { describe, it, expect } from 'vitest'`
- Conventions détaillées dans `doc/prompts/prompt0-conventions.md`

## ESLint

- Flat config (`eslint.config.js`) avec `@eslint/js` recommended
- Globals browser déclarés manuellement (pas de plugin `globals`)
- `no-unused-vars` : erreur, sauf args/vars préfixés `_`
- Dossier `dist/` ignoré
- Vérification obligatoire après chaque modification JS (voir `.CLAUDE`)
