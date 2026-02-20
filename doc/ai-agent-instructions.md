# AI Agent Instructions (Shared)

Ce fichier est le socle commun pour tous les agents (Claude, Copilot, Codex).
Objectif: mutualiser les regles communes et eviter les divergences.

## Regles critiques (bloquantes)

1. Interdiction de `git commit` et `git push` sur la branche `main`, sauf si l'utilisateur le demande expressement.
2. `git commit` et `git push` sont autorises uniquement sur une branche dediee d'agent (`codex/*`, `claude/*`, `copilot/*`).
3. Si l'agent n'est pas sur une branche dediee d'agent, il doit s'arreter et demander avant toute operation `commit/push`.
4. Exception: Si l'utilisateur demande explicitement de merger et pusher sur `main`, l'agent peut executer ces operations.
5. Avant tout merge vers `main`, l'agent doit mettre a jour sa branche de travail avec `origin/main` (rebase).
6. Le merge vers `main` passe par une **Pull Request** via `gh pr create`, puis squash merge via `gh pr merge --squash`.
7. Le titre de la PR doit etre prefixe par le nom de l'agent (`codex: ...`, `claude: ...`, `copilot: ...`).
8. Ne jamais merger localement vers `main`. Toujours utiliser le workflow PR GitHub.
9. Apres merge reussi de la PR, l'agent doit supprimer sa branche de travail locale (`git branch -d`). La branche remote est supprimee automatiquement par GitHub (via `--delete-branch`). Ne pas faire de `git push origin --delete` ni de `git fetch -p` manuellement.
10. Si l'utilisateur demande de "publier le code" (ou formulation equivalente), suivre le **workflow de publication** (section 7).

## 1. Sources de verite

1. Lire `doc/ai-code-style.md` avant toute modification de code.
2. Lire `doc/prompts/` pour les conventions et le modele metier.
3. Lire `doc/stack.md` pour la stack et les scripts.
4. Lire `doc/ai-changelog.md` pour le format de documentation des changements.

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
6. Chaque agent utilise un **worktree fixe unique** defini dans son fichier d'instructions specifique (ex: `/tmp/tgc-claude-worktree`). Ne pas creer un nouveau worktree par feature: reutiliser le meme worktree en changeant de branche entre les taches. Cela preserve `node_modules` et permet de lancer build/test/lint sans reinstallation.
7. Convention de nommage des branches: `AGENT_NAME/FEATURE_NAME` (ex: `claude/fix-drag-drop`, `codex/add-tests`, `copilot/refactor-ui`).
8. Convention de titre de PR: prefixer par `AGENT_NAME:` (ex: `claude: fix drag and drop`, `codex: improve button design`, `copilot: refactor ui adapter`).
9. Un agent ne travaille que dans ses propres branches. Interdit d'editer ou merger une branche d'un autre agent.
10. Si l'utilisateur demande "en autonomie" (ou formulation equivalente: "mode autonome", "travaille en autonome", "fais-le en autonomie"), l'agent DOIT travailler dans son worktree isole uniquement.
11. En mode autonome, l'agent DOIT utiliser une branche dediee a son nom au format `AGENT_NAME/FEATURE_NAME` dans son worktree isole.
12. En mode autonome, l'agent NE DOIT JAMAIS intervenir dans le working tree principal de l'utilisateur (aucune modification de code, de documentation, de config, ni d'operations git).
13. Si le contexte courant n'est pas le worktree isole de l'agent lors d'une demande autonome, l'agent doit s'arreter et demander avant toute modification.
14. Les modifications de code dans les worktrees isoles des agents sous `/tmp` ne necessitent pas de validation prealable de l'utilisateur.
15. Si l'utilisateur demande de "publier le code" en mode autonome, toutes les operations git/gh (commit, push, PR, merge) doivent etre executees uniquement depuis le worktree isole de l'agent.
16. **Nettoyage du worktree entre deux taches**: avant de commencer une nouvelle feature dans le worktree fixe, l'agent doit:
    - S'assurer qu'il n'y a pas de changements non commites (`git status`). Si oui, demander a l'utilisateur.
    - Creer la nouvelle branche depuis `origin/main` a jour: `git fetch origin && git checkout -b AGENT_NAME/FEATURE_NAME origin/main`.

## 6. Documentation

1. Toute evolution de stack doit mettre a jour `doc/stack.md`.
2. Toute nouvelle regle de style doit etre ajoutee a `doc/ai-code-style.md`.
3. Documenter dans `CHANGELOG-AGENT.md` en suivant le format defini dans `doc/ai-changelog.md`:
   - **Obligatoire** quand l'utilisateur demande de "publier" (ou equivalent: "publish", "merge", "envoie la PR"). L'agent doit mettre a jour le changelog **avant** de creer la PR.
   - Recommande apres tout changement significatif (feature, fix majeur, refactor).

## 7. Workflow de publication (obligatoire)

Quand l'utilisateur demande de "publier", "publish", "merge", "envoie la PR" (ou formulation equivalente), l'agent doit executer les etapes suivantes **dans cet ordre exact**:

### Etape 1 — Verification

Si le worktree n'a pas `node_modules`, executer `npm install` d'abord.

```bash
npm run build
npm test
npx eslint src tests
```

**Si un check echoue, corriger avant de continuer. Ne jamais publier du code qui ne passe pas les checks.**

### Etape 2 — Changelog

Mettre a jour `CHANGELOG-AGENT.md` selon le format de `doc/ai-changelog.md`.
Commiter le changelog avec le reste des changements.

### Etape 3 — Push et PR

```bash
git push -u origin AGENT_NAME/FEATURE_NAME
gh pr create --title "AGENT_NAME: description courte" --body "..."
```

Le body de la PR doit contenir au minimum:
- `## Summary` avec 1-3 bullet points
- `## Test plan` avec les resultats de build/test/lint

### Etape 4 — Merge

```bash
gh pr merge NUMBER --squash --delete-branch
```

`--delete-branch` supprime la branche remote automatiquement. **Ne pas** executer `git push origin --delete` ni `git fetch -p` apres: c'est redondant.

### Etape 5 — Nettoyage local

```bash
git branch -d AGENT_NAME/FEATURE_NAME
```

Supprimer la branche locale uniquement. Le worktree peut etre conserve ou supprime selon les besoins.
