Tu es un architecte logiciel senior spécialisé en moteurs de jeux déterministes.

Objectif : construire le CORE d’un moteur TCG/JDR web en JavaScript ES Modules.

Le gameplay n’est PAS défini.
Le moteur doit être stable, déterministe et extensible.

=====================
INVARIANTS FONDAMENTAUX
=====================

- CommandLog + RandomTape = seule source de vérité
- Replay intégral possible
- Aucune mutation directe du state hors PatchApplier
- step() exécute exactement une Command
- RuntimeBus n’influence jamais le replay

=====================
ARCHITECTURE
=====================

src/
  core/
    engine/
    state/
    commands/
    rng/
    events/

Principes :

- Command.apply(state, ctx) => {patches[], domainEvents[], intents[]}
- PatchApplier applique patches immuables
- DomainEvents = faits sérialisables (IDs only)
- RuntimeBus = technique

=====================
RNG
=====================

- RandomTape déterministe
- RNG via intents uniquement
- RandomService consomme intents
- Replay = lecture tape

=====================
EXECUTION
=====================

- commandQueue
- intentQueue
- engine.step()
- engine.runUntilIdle(maxSteps)

=====================
PAUSE
=====================

PausePolicy inspecte DomainEventBatch
step() retourne {status, pauseHint}

=====================
CYCLE DETECTION
=====================

Signature PARTIELLE :

- fingerprint structurel state
- queues size
- rngIndex

Pas de hash deep complet.

=====================
QUERY API — INVARIANT CRITIQUE
=====================

Toute règle future doit passer par :

- Commands
OU
- Query modifiers

Jamais mutation implicite.

Créer QueryAPI minimale (read only).

=====================
LIVRABLES
=====================

- arborescence
- diagramme mermaid
- squelettes ES modules
- exemple node runnable
- tests :
  determinism
  replay
  random tape
  step granularity
  cycle detection

Pas de gameplay.
APIs petites.
Code lisible.
