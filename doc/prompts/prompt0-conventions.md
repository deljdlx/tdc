Conventions techniques du moteur TCG.

Ce document complète le .CLAUDE avec les conventions
spécifiques au moteur (tests, erreurs, patches, nommage).

=====================
FRAMEWORK DE TEST
=====================

Vitest (ES modules natif).

Structure :
  tests/
    core/
      engine/
      state/
      commands/
      rng/
      events/
    query/
    effects/

Conventions :
  - Un fichier test par module : MonModule.test.js
  - Nommage des tests : describe('MonModule') > it('should ...')
  - Fixtures dans tests/fixtures/ si partagées
  - Pas de mocks sauf pour le RuntimeBus
  - Le déterminisme se teste par double exécution + deep equal

Commande :
  npx vitest run          (CI)
  npx vitest              (watch mode dev)

=====================
FORMAT DES PATCHES
=====================

Patches custom typés (pas JSON Patch, pas Immer).

Chaque patch est un objet avec :
  - type     (string : nom de l'opération)
  - target   (string : entityId ou path concerné)
  - payload  (object : données spécifiques au type)

Types de patches du core :

  SET_ATTRIBUTE
    target: entityId
    payload: {key, value}

  MOVE_CARD
    target: cardId
    payload: {fromZoneId, toZoneId, index?}

  CREATE_ENTITY
    target: entityId
    payload: {entityType, data}

  REMOVE_ENTITY
    target: entityId
    payload: {}

  SET_TURN_STATE
    target: 'turnState'
    payload: {field, value}

  SET_VISIBILITY_OVERRIDE
    target: cardId
    payload: {visibility: 'hidden' | 'public' | null}

Le gameplay peut définir des types supplémentaires.
PatchApplier doit refuser les types inconnus (throw).

Tous les patches sont sérialisables en JSON.

=====================
FORMAT DES DOMAIN EVENTS
=====================

DomainEvent = fait passé, immuable, sérialisable.

Structure :
  - type       (string : PAST_TENSE, ex: CARD_PLAYED)
  - payload    (object : IDs only, jamais d'entités complètes)
  - sourceCommandType (string : la commande qui l'a émis)

Convention de nommage :
  - UPPER_SNAKE_CASE
  - Passé composé anglais : CARD_DRAWN, DAMAGE_DEALT, TURN_STARTED
  - Préfixe par domaine si besoin : COMBAT_DAMAGE_DEALT

Les events ne contiennent JAMAIS :
  - de données dérivées (valeurs modifiées)
  - de références à des objets vivants
  - de logique conditionnelle

=====================
FORMAT DES COMMANDS
=====================

Convention de nommage :
  - PascalCase : PlayCardCommand, DrawCardCommand
  - Suffixe Command obligatoire
  - Verbe impératif : Play, Draw, Attack, EndTurn

Structure d'une Command :

  class PlayCardCommand {
    static type = 'PLAY_CARD'

    constructor(payload) {
      this.payload = payload
    }

    validate(state, ctx) {
      // Retourne {valid: true} ou {valid: false, reason: string}
    }

    apply(state, ctx) {
      // Retourne {patches[], domainEvents[], intents[]}
    }
  }

Le type est UPPER_SNAKE_CASE, le nom de classe PascalCase.

=====================
VALIDATION & ERREURS
=====================

Stratégie : validate + reject.

Cycle de vie d'une Command :

  1. engine reçoit la command
  2. engine appelle command.validate(state, ctx)
  3. Si invalide :
     - émet DomainEvent COMMAND_REJECTED {commandType, reason}
     - skip la command
     - le jeu continue
  4. Si valide :
     - appelle command.apply(state, ctx)
     - applique les patches
     - émet les domainEvents
     - enqueue les intents

COMMAND_REJECTED est loggé dans le CommandLog.
Le replay le rejoue (skip identique).

Erreurs fatales (bugs moteur) :
  - PatchApplier reçoit un type inconnu → throw
  - State corrompu détecté → throw
  - Ces erreurs ne sont PAS des rejets gameplay

=====================
FORMAT DES INTENTS
=====================

Intent = demande d'action future émise par une Command.

Structure :
  - type     (string : ce qui doit être fait)
  - payload  (object : paramètres)
  - source   (string : commandType qui l'a émis)

Exemples :
  - {type: 'DRAW_CARD', payload: {playerId, count: 1}, source: 'START_TURN'}
  - {type: 'ROLL_RANDOM', payload: {min: 1, max: 6, tag: 'damage'}, source: 'ATTACK'}

Les intents sont convertis en Commands par l'IntentResolver.
L'IntentResolver est un registry configurable par le gameplay.

=====================
NOMMAGE DES FICHIERS
=====================

Complément au .CLAUDE :

  src/core/engine/Engine.js           (classe principale)
  src/core/state/PatchApplier.js      (applique les patches)
  src/core/commands/PlayCardCommand.js (une command par fichier)
  src/core/rng/RandomTape.js          (tape déterministe)
  src/core/events/DomainEventBus.js   (bus d'events)

  tests/core/engine/Engine.test.js    (miroir de src/)

Un fichier = une responsabilité.
Un fichier = un export principal.
