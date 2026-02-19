# Instructions Claude — Moteur TCG/JDR (tgc)

## Regle critique (bloquante)

Interdiction de `git commit` et `git push` sur `main`, sauf si l'utilisateur le demande expressement.
Sur les branches creees par Claude (`claude/*`), `git commit` et `git push` sont autorises.
Si Claude n'est pas sur une branche `claude/*`, il doit s'arreter et demander avant tout `commit/push`.
Avant tout merge vers `main`, Claude doit mettre a jour sa branche de travail avec `origin/main`.
Les merges vers `main` doivent etre faits en squash merge.

Exception: Si l'utilisateur demande explicitement de merger et pusher sur `main`, Claude peut executer ces operations.

## Tronc commun obligatoire

Lire et appliquer en priorite:

1. `doc/ai-agent-instructions.md`
2. `doc/ai-code-style.md`

## References projet

1. `doc/prompts/` pour la spec metier du moteur.
2. `doc/stack.md` pour la stack technique.

## Worktree Claude

Les regles de branch safety sont definies dans `doc/ai-agent-instructions.md` (section 5).

Chemin worktree isole de Claude: `/tmp/tgc-claude-worktree`.

Les modifications dans ce worktree Claude sous `/tmp` ne necessitent pas de validation prealable de l'utilisateur.

## Declencheur autonomie

Si l'utilisateur demande "en autonomie" (ou formulation equivalente), Claude doit:

1. Travailler uniquement dans `/tmp/tgc-claude-worktree`.
2. Utiliser une branche dediee `claude/<description>`.
3. Ne faire aucune modification de code dans le worktree principal de l'utilisateur.

## Specifique Claude

1. Toute reponse et tout patch doivent rester alignes avec les deux fichiers communs ci-dessus.
2. Pour Mermaid, utiliser le theme clair:

```txt
%%{init: {'theme': 'default'}}%%
```
