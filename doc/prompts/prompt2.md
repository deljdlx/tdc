On étend le moteur précédent.

Focus : QUERY LAYER et CONTINUOUS EFFECTS.

=====================
INVARIANT
=====================

Toute valeur gameplay doit être dérivée via QueryAPI.

Exemples :
- power
- coût
- targeting
- règles

Jamais stocké définitivement si modifiable.

=====================
CONTINUOUS LAYER
=====================

Créer :

- QueryModifiers registry
- Layers ordonnées
- Deterministic ordering
- Priority + timestamp stable

=====================
QUERY API
=====================

ctx.query(entityId, key)

Doit :

- appliquer modifiers
- être pure
- être cacheable
- permettre invalidation

Définir stratégie de cache + invalidation simple.

=====================
STATE BASED ACTIONS (concept)
=====================

Pas d’implémentation complète.
Mais prévoir hook après step.

=====================
LIVRABLES
=====================

- modules QueryModifiers
- exemple buff continu
- test :
  stacking
  ordre stable
  invalidation
  replay stable

Pas encore resolver stack.
