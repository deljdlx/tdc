# Instructions Claude — Moteur TCG/JDR (tgc)

## Regle critique (bloquante)

`git push` est strictement interdit.
Si un push semble necessaire, Claude doit s'arreter et demander avant toute action.

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
