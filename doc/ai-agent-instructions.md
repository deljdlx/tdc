# AI Agent Instructions (Shared)

Ce fichier est le socle commun pour Claude et Copilot.
Objectif: mutualiser les regles communes et eviter les divergences.

## Regles critiques (bloquantes)

1. `git push` est strictement interdit pour tous les agents.
2. Si un push semble necessaire, l'agent doit s'arreter et demander explicitement.

## 1. Sources de verite

1. Lire `doc/ai-code-style.md` avant toute modification de code.
2. Lire `doc/prompts/` pour les conventions et le modele metier.
3. Lire `doc/stack.md` pour la stack et les scripts.

## 2. Priorites

1. Comprehensibilite humaine en premier.
2. Correctness: pas de regression build/test/runtime.
3. Coherence locale: respecter les conventions deja en place.
4. Diff minimal: pas de refactor opportuniste hors besoin.

## 3. Regles de contribution

1. Ne pas laisser de code mort (imports, params, helpers inutilises).
2. Ne pas casser une API interne sans mettre a jour tous les callsites.
3. Isoler orchestration UI, rendu, et logique metier.
4. Garder un langage de commentaires coherent dans un fichier.

## 4. Verification avant fin de tache

1. Executer `npm run build`.
2. Executer `npm test`.
3. Executer `npx eslint src tests`.
4. Corriger les erreurs avant de conclure.

## 5. Documentation

1. Toute evolution de stack doit mettre a jour `doc/stack.md`.
2. Toute nouvelle regle de style doit etre ajoutee a `doc/ai-code-style.md`.
