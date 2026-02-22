# Conventions JavaScript — TGC

Ce document detaille les conventions JavaScript specifiques au projet TGC.
Il complete `ai-code-style.md` (regles generales) avec des regles concretes et des exemples tires du code existant.

## 1. Modules et imports

1. ESM uniquement (`import` / `export`). Jamais de CommonJS (`require`, `module.exports`).
2. Extensions `.js` obligatoires dans les imports relatifs:
   ```js
   import Engine from '../core/engine/Engine.js'
   ```
3. Un `export default` par fichier pour les classes. Exports nommes pour les constantes et fonctions utilitaires:
   ```js
   export default class PlaySpellCommand { /* ... */ }
   export const CARD_DEFINITIONS = Object.freeze([...])
   export function getCardDefinition(definitionId) { /* ... */ }
   ```
4. Grouper les imports en haut du fichier:
   - imports `core/` en premier
   - imports `gameplay/` ensuite
   - imports de definitions/constantes en dernier
5. Pas d'import dynamique (`import()`) sauf pour le code-splitting intentionnel.

## 2. Variables et constantes

1. Preferer `const`, puis `let`. Jamais `var`.
2. Nommage:
   - Variables et proprietes: `camelCase`
   - Classes: `PascalCase`
   - Constantes globales et types statiques: `UPPER_SNAKE_CASE`
   - Parametres inutilises: prefixer par `_` (requis par ESLint)
3. IDs et types metier en anglais: `playerId`, `targetId`, `ATTACK_DECLARED`.
4. Pas de "magic values" inline — extraire en constante nommee:
   ```js
   // Mauvais
   const newMaxMana = Math.min(current + 1, 10)

   // Bon
   const MANA_CAP = 10
   const newMaxMana = Math.min(current + 1, MANA_CAP)
   ```
5. `Object.freeze()` obligatoire pour les constantes de definitions:
   ```js
   export const HERO_DEFINITIONS = Object.freeze([
       { id: 'WARRIOR', name: 'Warrior', speed: 3, hp: 30 },
       { id: 'MAGE', name: 'Mage', speed: 2, hp: 15 }
   ])
   ```
6. Fonctions d'acces pour les lookups sur les definitions:
   ```js
   export function getHeroDefinition(definitionId) {
       return HERO_DEFINITIONS.find(d => d.id === definitionId)
   }
   ```

## 3. Fonctions et methodes

1. Cible: <= 40 lignes par methode. Au-dela, extraire une sous-fonction.
2. Early return pour eviter les blocs imbriques:
   ```js
   validate(state) {
       if (state.turnState.activePlayerId !== playerId) {
           return { valid: false, reason: 'Not your turn' }
       }
       const attacker = state.heroes[attackerId]
       if (!attacker) {
           return { valid: false, reason: `Attacker "${attackerId}" not found` }
       }
       return { valid: true }
   }
   ```
3. Proprietes privees prefixees par `_`:
   ```js
   export default class Engine {
       /** @type {PatchApplier} */
       _patchApplier;
       /** @type {DomainEventBus} */
       _domainEventBus;
   }
   ```
4. Destructuring en tete de methode pour les payloads:
   ```js
   apply(state, ctx) {
       const { playerId, cardId } = this.payload
       // ...
   }
   ```

## 4. Command pattern

Chaque Command suit un contrat strict:

### Structure

```js
export default class StartTurnCommand {
    static type = 'START_TURN'               // UPPER_SNAKE_CASE, obligatoire
    static category = 'game_flow'            // optionnel: metadata
    static edges = [                         // optionnel: visualise dans le DAG
        { target: 'DRAW_CARDS', label: 'DRAW_CARDS' }
    ]

    constructor(payload) {
        this.payload = payload               // minimal: {playerId, ...}
    }

    validate(state, ctx) { /* ... */ }
    apply(state, ctx) { /* ... */ }
}
```

### validate()

- Retourne toujours `{ valid: boolean, reason?: string }`.
- Pas de side effects, pas d'exceptions.
- Logique de rejet gracieuse (jamais `throw` pour la logique de jeu).

### apply()

- Retourne toujours `{ patches: [], domainEvents: [], intents: [] }`.
- Ne mute jamais `state` directement.
- Les Commands sont stateless: le payload est passe via le constructeur.

### Nommage

- Suffixe `Command` obligatoire: `PlaySpellCommand`, `DrawCardsCommand`.
- Nom d'action au present: `PLAY_SPELL`, `START_TURN`, `DRAW_CARDS`.
- Un fichier par Command: `src/gameplay/commands/PlaySpellCommand.js`.

## 5. Domain Events

1. Nom au passe en `UPPER_SNAKE_CASE`: `SPELL_PLAYED`, `CARD_DRAWN`, `DAMAGE_DEALT`, `TURN_STARTED`.
2. Payload avec IDs et primitives uniquement. Jamais d'objets complets:
   ```js
   domainEvents.push({
       type: 'SPELL_PLAYED',
       payload: { cardId, playerId },          // IDs seulement
       sourceCommandType: 'PLAY_SPELL'         // toujours present
   })
   ```
3. Prefixer par domaine si necessaire: `COMBAT_RESOLVED`, `DECK_EMPTY`.
4. Events framework reserves: `COMMAND_REJECTED`, `COMMAND_VETOED`.
5. Ne jamais inclure de donnees derivees ou d'entites entieres dans le payload.

## 6. Patches et state

### Immutabilite stricte

Le state ne doit jamais etre mute directement. Toutes les modifications passent par des patches traites par `PatchApplier`:

```js
patches.push({
    type: 'SET_ATTRIBUTE',
    target: playerId,
    payload: { key: 'mana', value: currentMana - manaCost }
})
```

### Types de patches

| Type | Target | Payload |
|------|--------|---------|
| `SET_ATTRIBUTE` | entityId | `{ key, value }` |
| `MOVE_CARD` | cardId | `{ fromZoneId, toZoneId, index? }` |
| `CREATE_ENTITY` | entityId | `{ entityType, data }` |
| `REMOVE_ENTITY` | entityId | `{}` |
| `SET_TURN_STATE` | `'turnState'` | `{ field, value }` |
| `SET_VISIBILITY_OVERRIDE` | cardId | `{ visibility }` |

### Handlers de patches

Chaque handler est une fonction pure qui retourne un nouvel objet state via spread:

```js
SET_ATTRIBUTE(state, target, { key, value }) {
    return {
        ...state,
        players: {
            ...state.players,
            [target]: {
                ...state.players[target],
                attributes: {
                    ...state.players[target].attributes,
                    [key]: value
                }
            }
        }
    }
}
```

### QueryAPI

Pour lire les attributs effectifs (base + modifiers), toujours passer par `QueryAPI`:

```js
const manaCost = ctx.query.query(cardId, 'cost')
const heroPower = ctx.query.query(heroId, 'power')
```

Ne jamais acceder directement a `state.players[id].attributes[key]` dans les Commands — utiliser `QueryAPI` pour respecter les modifiers.

## 7. Event buses

Le projet utilise deux bus d'events distincts:

### DomainEventBus — faits de jeu (replayed)

- Batch processing: `emit()` accumule, `flush()` notifie les listeners.
- Les events sont immutables et archives dans `_history`.
- Usage: reactions de gameplay (triggers, effects).

### RuntimeBus — events techniques (non replayed)

- Fire-and-forget: `emit(eventType, data)`.
- Listeners par type: `on(eventType, listener)`.
- Usage: UI, debug, logging.
- Events types: `'step:start'`, `'step:end'`, `'command:rejected'`.

### Desinscription

Les deux bus retournent une fonction `unsubscribe`:

```js
const unsub = bus.on('step:end', (data) => { /* ... */ })
// Plus tard:
unsub()
```

## 8. Registries et factories

### CommandRegistry

- `register(CommandClass)` — enregistre une classe avec `static type`.
- `create(type, payload)` — instancie une Command par type (pour le replay).
- `has(type)` — verifie l'existence d'un type.

### IntentResolver

- `register(intentType, factory)` — `factory: (intent, ctx) => Command`.
- `resolve(intent, ctx)` — retourne une instance de Command ou `null`.

### TriggerEngine

- `register(trigger)` — trigger = `{ id, eventType, condition, createIntent }`.
- `processBatch(eventBatch, state)` — evalue les triggers sur chaque event.
- `flush()` — retourne et vide les intents en attente.

## 9. Gestion d'erreurs

### Logique de jeu: validation gracieuse

Ne jamais `throw` pour une erreur de jeu. Utiliser le pattern validate/reject:

```js
return { valid: false, reason: 'Not enough mana' }
```

Le moteur emet `COMMAND_REJECTED` et continue.

### Erreurs framework: throw

Les erreurs framework (bugs, etat corrompu) utilisent `throw`:

```js
throw new Error(`PatchApplier: unknown patch type "${patch.type}"`)
throw new Error(`RandomTape: tape exhausted (replay mismatch)`)
throw new Error(`CommandRegistry: type "${type}" is already registered`)
```

Format du message: `NomModule: description` avec les valeurs en quotes.

### Escalade apres 2 tentatives

Si un probleme persiste apres 2 tentatives de correction, signaler a l'utilisateur avec:
- Commande executee
- Sortie d'erreur complete
- Fichier et ligne concernes
- Hypothese sur la cause

## 10. Tests (Vitest)

1. Fichiers: `tests/**/*.test.js`, miroir de `src/`.
2. Structure: `describe()` par classe/module, `it()` par comportement.
3. Noms descriptifs en anglais:
   ```js
   it('should SET_ATTRIBUTE on a player', () => { /* ... */ })
   it('should return IDLE when no commands queued', () => { /* ... */ })
   ```
4. Helper `makeState()` pour creer un state minimal de test:
   ```js
   function makeState() {
       return {
           players: { p1: { id: 'p1', name: 'Alice', attributes: { hp: 20 } } },
           cards: {},
           zones: {},
           turnState: { activePlayerId: 'p1', turnNumber: 1, phase: 'main' },
           version: 0
       }
   }
   ```
5. Toujours verifier l'immutabilite: l'etat original ne doit pas etre mute:
   ```js
   expect(next.players.p1.attributes.hp).toBe(15)
   expect(state.players.p1.attributes.hp).toBe(20) // original intact
   ```
6. Pas de mocks pour la logique metier. Mocker uniquement les IO (fetch, timers, DOM).
7. Pas de dependance a l'ordre d'execution entre tests.
8. Pour les tests de Commands, creer des stubs minimaux avec `static type` + `validate` + `apply`.

## 11. Structure de fichiers

```
src/
├── core/                       # Framework, ne depend d'aucun gameplay
│   ├── engine/                # Engine, IntentResolver, ZoneTypeRegistry
│   ├── state/                 # PatchApplier (state immutable)
│   ├── commands/              # CommandLog, CommandRegistry
│   ├── rng/                   # RandomTape (determinisme)
│   ├── events/                # DomainEventBus, RuntimeBus
│   ├── effects/               # TriggerEngine, ReplacementPipeline, ChoiceSystem
│   └── query/                 # QueryAPI, ModifierRegistry
└── gameplay/                  # Logique specifique au jeu
    ├── setup.js               # createGame(), enregistrement des Commands
    ├── definitions/           # Constantes: Cards, Heroes, Powers
    ├── commands/              # Commands de jeu (PlaySpellCommand, etc.)
    └── ui/                    # Integration UI (UiAdapter)
tests/
    └── (miroir de src/)
```

Regles:
- `core/` ne doit jamais importer depuis `gameplay/`.
- `gameplay/` importe librement depuis `core/`.
- Un fichier = une responsabilite principale.
- Limite: 300-400 lignes par classe. Au-dela, extraire rendering, orchestration, ou IO.

## 12. JSDoc

JSDoc obligatoire pour:
- Methodes publiques de classes
- Fonctions exportees
- Types complexes (utiliser `@typedef`)

```js
/**
 * @typedef {Object} Patch
 * @property {string} type    - Nom de l'operation (ex: SET_ATTRIBUTE)
 * @property {string} target  - entityId ou path concerne
 * @property {Object} payload - Donnees specifiques au type
 */

/**
 * Applique un patch sur le state et retourne un nouveau state.
 *
 * @param {Object} state - Le state courant (ne sera pas mute)
 * @param {Patch}  patch - Le patch a appliquer
 * @returns {Object} Nouveau state avec le patch applique
 * @throws {Error} Si le type de patch est inconnu
 */
apply(state, patch) { /* ... */ }
```

JSDoc optionnel pour:
- Methodes privees (`_method`) triviales
- Getters/setters evidents
- Fonctions internes courtes dans un module

## 13. ESLint

Configuration: flat config (`eslint.config.js`), ESLint 10+, `@eslint/js` recommended.

Regles principales:
- `no-unused-vars`: pattern `^_` autorise pour args, vars, et destructuring.
- `ecmaVersion: 'latest'`, `sourceType: 'module'`.
- Globals navigateur declares manuellement (pas de `browser: true`).

Ne pas modifier `eslint.config.js` sans validation utilisateur.

## 14. Anti-patterns

1. **Mutation directe du state** — toujours passer par des patches.
2. **`throw` pour la logique de jeu** — utiliser `{ valid: false, reason }`.
3. **Acces direct aux attributs dans les Commands** — utiliser `QueryAPI`.
4. **Objets complets dans les payloads d'events** — IDs et primitives uniquement.
5. **Import sans extension `.js`** — les imports relatifs necessitent l'extension.
6. **`require()` ou `module.exports`** — ESM uniquement.
7. **`console.log` oublie** dans le code commite.
8. **Fichier god object (>500 lignes)** — extraire les responsabilites.
9. **Dependance `core/` → `gameplay/`** — le core est un framework autonome.
10. **Tests qui mutent un state partage** — chaque test cree son propre state via `makeState()`.
