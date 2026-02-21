# AI Agent Instructions (Shared)

Ce fichier est le socle commun pour tous les agents (Claude, Copilot, Codex, Gemini).
Objectif: mutualiser les regles communes et eviter les divergences.

## Regles critiques (bloquantes)

1. Interdiction de `git commit` et `git push` sur la branche `main`, sauf si l'utilisateur le demande expressement.
2. `git commit` et `git push` sont autorises uniquement sur une branche dediee d'agent (`codex/*`, `claude/*`, `copilot/*`, `gemini/*`).
3. Si l'agent n'est pas sur une branche dediee d'agent, il doit s'arreter et demander avant toute operation `commit/push`.
4. Exception: Si l'utilisateur demande explicitement de merger et pusher sur `main`, l'agent peut executer ces operations.
5. Avant tout merge vers `main`, l'agent doit mettre a jour sa branche de travail avec `origin/main` (rebase).
6. Le merge vers `main` passe par une **Pull Request** via `gh pr create`, puis squash merge via `gh pr merge --squash`.
7. Le titre de la PR doit etre prefixe par le nom de l'agent (`codex: ...`, `claude: ...`, `copilot: ...`, `gemini: ...`).
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
7. Convention de nommage des branches: `AGENT_NAME/FEATURE_NAME` (ex: `claude/fix-drag-drop`, `codex/add-tests`, `copilot/refactor-ui`, `gemini/add-feature`).
8. Convention de titre de PR: prefixer par `AGENT_NAME:` (ex: `claude: fix drag and drop`, `codex: improve button design`, `copilot: refactor ui adapter`, `gemini: add feature`).
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
17. **Rebase obligatoire avant push**: avant tout `git push`, toujours executer `git fetch origin && git rebase origin/main`. Si le rebase echoue (conflit), executer `git rebase --abort` et signaler a l'utilisateur.
18. **Recovery HEAD detache**: si le worktree est en etat "detached HEAD", executer `git checkout -b AGENT_NAME/FEATURE_NAME` pour reattacher, ou `git checkout origin/main` pour repartir d'une base propre.
19. En mode non-autonome, le working tree principal est en **lecture seule** sauf demande explicite de l'utilisateur. Toute modification de code se fait dans le worktree isole.

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

### Etape 3 — Synchronisation avec main

```bash
git fetch origin
git rebase origin/main
```

Si le rebase echoue (conflit), executer `git rebase --abort` et signaler a l'utilisateur. **Ne jamais forcer un push avec `--force` sans validation utilisateur.**

### Etape 4 — Push et PR

Verifier qu'aucune PR ouverte n'existe deja pour cette branche:

```bash
gh pr list --head AGENT_NAME/FEATURE_NAME
```

Si une PR existe deja, la mettre a jour avec un push au lieu d'en creer une nouvelle.

```bash
git push -u origin AGENT_NAME/FEATURE_NAME
gh pr create --title "AGENT_NAME: description courte" --body "..."
```

Le body de la PR doit contenir au minimum:
- `## Summary` avec 1-3 bullet points
- `## Test plan` avec les resultats de build/test/lint

### Etape 5 — Merge

```bash
gh pr merge NUMBER --squash --delete-branch
```

`--delete-branch` supprime la branche remote automatiquement. **Ne pas** executer `git push origin --delete` ni `git fetch -p` apres: c'est redondant.

Si le merge echoue (conflit, checks en echec), ne pas retenter en boucle. Signaler a l'utilisateur avec le numero de PR et l'erreur exacte.

### Etape 6 — Nettoyage local

```bash
git checkout main
git branch -d AGENT_NAME/FEATURE_NAME
```

Supprimer la branche locale uniquement. Le worktree reste en place pour la prochaine tache.

## 8. Bootstrap autonome (procedure de demarrage)

Quand un agent recoit une tache en mode autonome, il execute les etapes suivantes **dans cet ordre exact** avant de commencer le travail:

### Etape 1 — Lecture des instructions

1. Lire son fichier d'instructions specifique (`CLAUDE.md`, `AGENTS.md`, `.github/copilot-instructions.md`, ou `GEMINI.md`).
2. Lire `doc/ai-agent-instructions.md` (ce fichier).
3. Lire `doc/ai-code-style.md`.
4. Confirmer la lecture de ces fichiers dans la reponse.

### Etape 2 — Preparation du worktree

```bash
# Verifier que le worktree existe
git worktree list
```

Si le worktree isole n'apparait pas dans la liste:

```bash
git worktree add /tmp/tgc-AGENT_NAME-worktree origin/main
```

Se placer dans le worktree:

```bash
cd /tmp/tgc-AGENT_NAME-worktree
```

### Etape 3 — Verification de l'etat du worktree

```bash
git status
```

**Changements non commites?** Stash les changements (`git stash`) ou demander a l'utilisateur si les changements semblent importants (fichiers de code modifies, pas juste des fichiers de build).

**HEAD detache?** `git checkout origin/main` pour repartir d'une base propre.

**Ancienne branche de l'agent encore presente?** La supprimer si elle a deja ete mergee:

```bash
git branch -d AGENT_NAME/ancienne-branche
```

### Etape 4 — Creation de la branche de travail

```bash
git fetch origin
git checkout -b AGENT_NAME/FEATURE_NAME origin/main
```

### Etape 5 — Verification des dependances

```bash
# Si node_modules absent ou si package-lock.json a change depuis le dernier install
npm install
```

### Etape 6 — Validation de l'environnement

```bash
npm run build
```

Si le build echoue a ce stade (avant toute modification), le probleme est sur `main`. Signaler a l'utilisateur et ne pas tenter de corriger.

L'agent est pret a travailler.

## 9. Travail concurrent multi-agents

Plusieurs agents peuvent travailler simultanement sur le meme repo. Ces regles evitent les conflits:

### 9.1 Synchronisation avec `origin/main`

1. **Fetch obligatoire** avant: creation de branche, push, creation de PR, merge.
2. **Rebase avant push**: `git fetch origin && git rebase origin/main` (cf. section 5 regle 17).
3. Si `main` a avance pendant le travail de l'agent (un autre agent a merge), l'agent doit rebaser sa branche de travail sur le nouveau `origin/main` avant de continuer les verifications (build/test/lint).

### 9.2 Detection de modifications concurrentes

Avant de modifier un fichier critique partage (ex: `Engine.js`, `setup.js`, `UiAdapter.js`, `styles.scss`), l'agent doit verifier si un autre agent l'a modifie recemment:

```bash
git fetch origin
git log --oneline origin/main -5 -- chemin/vers/fichier.js
```

Si le fichier a ete modifie dans les 5 derniers commits de `main`, l'agent doit:
1. Lire la version actuelle sur `origin/main` avant de commencer ses modifications.
2. Baser ses modifications sur la version la plus recente.

### 9.3 Isolation stricte entre agents

1. Un agent ne travaille que dans ses propres branches (`AGENT_NAME/*`).
2. Un agent n'edite jamais une branche, PR, ou fichier de changelog d'un autre agent.
3. Un agent ne commente pas et ne review pas les PRs d'un autre agent, sauf demande explicite de l'utilisateur.
4. Si un agent detecte un probleme dans le code d'un autre agent (sur `main`), il le signale a l'utilisateur au lieu de le corriger lui-meme.

### 9.4 Ordre de merge des PRs

1. Premier arrive, premier merge (FIFO). Pas de priorite entre agents.
2. Si deux PRs sont en conflit, le second agent doit rebaser apres le merge du premier.
3. Le rebase est toujours prefere au merge commit.

## 10. Gestion d'erreurs et recovery

### 10.1 Build, test, ou lint en echec

1. **Erreur dans le code de l'agent**: corriger et relancer les checks.
2. **Erreur pre-existante** (deja presente sur `main`): signaler a l'utilisateur avec la commande exacte et la sortie d'erreur. Ne pas tenter de corriger du code qu'un autre agent ou l'utilisateur a ecrit.
3. **Bloque apres 2 tentatives**: escalader a l'utilisateur avec un diagnostic complet:
   - Commande executee
   - Sortie d'erreur complete
   - Fichier et ligne concernes
   - Hypothese sur la cause

### 10.2 Conflit lors du rebase

```bash
git rebase --abort
```

Signaler a l'utilisateur avec:
- La branche source et la branche cible
- Les fichiers en conflit (`git diff --name-only --diff-filter=U`)
- Ne jamais resoudre un conflit de merge manuellement sans validation utilisateur

### 10.3 Worktree corrompu ou inutilisable

Si le worktree est dans un etat incoherent (`.git` corrompu, branche inexistante, erreurs git persistantes):

```bash
# Depuis le working tree principal
git worktree remove /tmp/tgc-AGENT_NAME-worktree --force
git worktree add /tmp/tgc-AGENT_NAME-worktree origin/main
cd /tmp/tgc-AGENT_NAME-worktree
npm install
```

### 10.4 Echec reseau (git fetch, git push, gh)

1. Retenter une fois apres quelques secondes.
2. Si l'echec persiste: signaler a l'utilisateur. Ne pas boucler indefiniment.

### 10.5 Echec de merge de PR

Si `gh pr merge` echoue:
1. Verifier les checks CI: `gh pr checks NUMBER`
2. Verifier les conflits: `gh pr view NUMBER`
3. Si conflit: rebaser, re-pusher, et retenter le merge.
4. Si checks en echec: corriger le code, re-pusher, attendre les checks, retenter.
5. Si l'echec persiste apres 2 tentatives: signaler a l'utilisateur avec le numero de PR et l'erreur.
