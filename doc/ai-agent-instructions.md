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

## 5. Branch Safety (tous agents)

1. Aucun agent ne doit changer la branche active du working tree de l'utilisateur.
2. Interdit de `git checkout <autre-branche>` dans le working tree principal pour merge/rebase/cherry-pick.
3. Pour toute operation qui deplace HEAD (creation de branche, merge, rebase), utiliser un worktree isole.
4. Si aucun worktree isole n'est disponible, l'agent doit demander avant de continuer.
5. Le working tree principal est accessible en lecture/ecriture pour les edits de code uniquement, sauf demande explicite de mode autonome (voir regle 9).
6. Chaque agent definit son propre chemin worktree dans son fichier d'instructions specifique.
7. Convention de nommage des branches: `<agent>/<description>` (ex: `claude/fix-drag-drop`, `codex/add-tests`, `copilot/refactor-ui`).
8. Un agent ne travaille que dans ses propres branches. Interdit d'editer ou merger une branche d'un autre agent.
9. Si l'utilisateur demande "en autonomie" (ou formulation equivalente: "mode autonome", "travaille en autonome", "fais-le en autonomie"), l'agent DOIT travailler dans son worktree isole uniquement.
10. En mode autonome, l'agent DOIT utiliser une branche dediee a son nom (`<agent>/<description>`) dans son worktree isole.
11. En mode autonome, l'agent NE DOIT PAS modifier le working tree principal de l'utilisateur.
12. Si le contexte courant n'est pas le worktree isole de l'agent lors d'une demande autonome, l'agent doit s'arreter et demander avant toute modification.

## 6. Documentation

1. Toute evolution de stack doit mettre a jour `doc/stack.md`.
2. Toute nouvelle regle de style doit etre ajoutee a `doc/ai-code-style.md`.
