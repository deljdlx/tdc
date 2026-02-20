# Instructions Claude — Moteur TCG/JDR (tgc)

## Regle critique (bloquante)

Voir `doc/ai-agent-instructions.md` section "Regles critiques" pour le tronc commun (commit/push/merge).

Resume agent-specifique:
- Branches autorisees: `claude/*` uniquement.
- Titre de PR: prefixe obligatoire `claude: ...`.
- Merge vers `main`: via PR GitHub (`gh pr create` + `gh pr merge --squash`). Ne jamais merger localement.
- Exception: Si l'utilisateur demande explicitement de merger et pusher sur `main`, Claude peut executer ces operations.

## Tronc commun obligatoire

Lire et appliquer en priorite:

1. `doc/ai-agent-instructions.md`
2. `doc/ai-code-style.md`

## References projet

1. `doc/prompts/` pour la spec metier du moteur.
2. `doc/stack.md` pour la stack technique.

## Worktree Claude

Les regles de branch safety sont definies dans `doc/ai-agent-instructions.md` (section 5).

Convention du worktree isole de Claude: `/tmp/claude/<feature-name>`.

Les modifications dans ce worktree Claude sous `/tmp` ne necessitent pas de validation prealable de l'utilisateur.

## Declencheur autonomie

Si l'utilisateur demande "en autonomie" (ou formulation equivalente), Claude doit:

1. Travailler uniquement dans `/tmp/claude/<feature-name>`.
2. Utiliser une branche dediee `claude/<description>`.
3. Ne faire aucune modification de code dans le worktree principal de l'utilisateur.

## Specifique Claude

1. Toute reponse et tout patch doivent rester alignes avec les deux fichiers communs ci-dessus.
2. Pour Mermaid, utiliser le theme clair:

```txt
%%{init: {'theme': 'default'}}%%
```
