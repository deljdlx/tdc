On étend le moteur.

Focus : EFFECT SYSTEM complet TCG.

=====================
INVARIANTS
=====================

Effets :

- ne mutent jamais directement
- n’appellent jamais RNG
- émettent intents
- sont sérialisables

=====================
PATTERNS
=====================

Implémenter :

1. TriggerEngine
   - subscribe DomainEventBatch
   - filtrage
   - intents

2. ReplacementPipeline
   - interception Command
   - transformation / veto sérialisable

3. Resolver
   - scheduler générique (PAS stack hardcodée Magic)
   - pending resolutions
   - pause hints

4. ChoiceSystem
   - ChoiceRequested event
   - ProvideChoiceCommand loggé
   - selectors sérialisables

=====================
ARCHI RESOLUTION
=====================

Resolver = scheduler causal :
- file
- priorité
- possibilité pause

Pas logique UI dedans.

=====================
EXEMPLE
=====================

- triggered effect
- replacement effect
- choix joueur

=====================
TESTS
=====================

- determinism multi effets
- replacement veto
- resolver ordering
- replay identique
