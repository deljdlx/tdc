# AI Code Style Guardrails

Ce document definit un contrat de style pour les contributions IA sur ce repo.
Objectif: produire un code tres lisible, coherent, et facile a review pour un humain.

## 1. Priorites

1. Correctness first: pas de regression runtime, test, ou build.
2. Readability second: un humain doit comprendre rapidement.
3. Consistency third: suivre le style deja en place.
4. Scope control: patch minimal, pas de refactor opportuniste non demande.

## 2. Regles non negociables

1. `npm run build` doit passer avant livraison.
2. `npm test` doit passer avant livraison.
3. `npx eslint src tests` doit passer avant livraison.
4. Interdit de laisser du code mort:
   - imports inutilises
   - params inutilises non prefixes `_`
   - fonctions/helpers non utilises
5. Interdit de casser une API interne existante sans mise a jour de tous les callsites.
6. Interdit de melanger 2 implementations concurrentes du meme flux dans un meme patch.

## 3. Style JavaScript

1. ESM seulement (`import` / `export`), pas de CommonJS.
2. Preferer `const`, puis `let`. Jamais `var`.
3. Fonctions courtes et monotaches. Cible: <= 40 lignes par methode.
4. Early return pour eviter les blocs imbriques profonds.
5. Pas de "magic values" inline si elles ont un sens metier:
   - extraire en constante nommee
6. Nommage explicite:
   - variable: `camelCase`
   - classe: `PascalCase`
   - constantes globales: `UPPER_SNAKE_CASE`
7. IDs et types metier en anglais (`playerId`, `targetId`, `ATTACK_DECLARED`).
8. Une seule convention de langue par fichier pour les commentaires.

## 4. Structure et responsabilites

1. Un fichier = une responsabilite principale.
2. Eviter les fichiers "god object" (>500 lignes) sans raison forte.
3. Si une classe depasse 300-400 lignes, extraire:
   - rendering pur
   - orchestration
   - IO / side effects
4. Les modules "adapters/ui-dev" ne doivent pas repliquer la logique metier.
5. Le moteur (`core/`) reste la source de verite des regles de jeu.

## 5. Commentaires et docs in-code

1. Commentaires uniquement si la logique n'est pas evidente.
2. Interdit de commenter l'evidence ("increment i").
3. Les JSDoc doivent decrire:
   - contrat d'entree
   - contrat de sortie
   - contraintes importantes
4. Garder les commentaires synchronises avec le code reel.

## 6. Event/Command style (specifique repo)

1. `Command`:
   - `static type` en `UPPER_SNAKE_CASE`
   - `validate(state, ctx)` puis `apply(state, ctx)`
2. `DomainEvent`:
   - nom au passe (`*_STARTED`, `*_PLAYED`, `*_DAMAGED`)
   - payload avec IDs et primitives seulement
3. `Intent`:
   - type explicite
   - payload minimal necessaire

## 7. Anti-patterns a eviter (vus dans l'audit)

1. Build cassable par erreur de syntaxe triviale (ligne separateur non commentee).
2. API mismatch entre modules (signature declaree != appel reel).
3. Imports utilises partiellement apres refactor.
4. Gros module UI monolithique qui reconcentre plusieurs couches.
5. Methodes tres longues avec logique heterogene (render + DnD + FX + replay).

## 8. Checklist IA avant PR

1. Le patch repond-il exactement a la demande utilisateur?
2. Ai-je introduit un import/parametre inutilise?
3. Ai-je conserve les contrats des APIs appelees ailleurs?
4. Ai-je ajoute des tests si comportement modifie?
5. Build, tests, lint sont-ils verts?
6. Le diff est-il lisible sans connaitre tout le repo?

## 9. Definition of Done (DoD)

Une contribution IA est "done" seulement si:

1. Elle compile.
2. Elle est testee.
3. Elle est lint-clean.
4. Elle est comprehensible en lecture lineaire.
5. Elle ne laisse pas de dette de style evidente.

## 10. Prompt court a reutiliser pour IA

Utiliser ce bloc comme prefixe:

```txt
Respecte strictement doc/ai-code-style.md.
Fais un patch minimal, lisible, et coherent avec le style existant.
Interdit: code mort, API mismatch, commentaires inutiles.
Avant de livrer: npm run build, npm test, npx eslint src tests.
Si un check echoue, corrige avant de conclure.
```
