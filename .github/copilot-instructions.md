# Instructions Copilot

## Regle critique (bloquante)

Voir `doc/ai-agent-instructions.md` section "Regles critiques" pour le tronc commun (commit/push/merge).

Resume agent-specifique:
- Branches autorisees: `copilot/*` uniquement.
- Merge vers `main`: via PR GitHub (`gh pr create` + `gh pr merge --squash`). Ne jamais merger localement.
- Exception: Si l'utilisateur demande explicitement de merger et pusher sur `main`, Copilot peut executer ces operations.

## Avant chaque tache (obligatoire)

**Lire ces fichiers EN PREMIER au debut de chaque tache:**

1. `doc/ai-agent-instructions.md`
2. `doc/ai-code-style.md`
3. Consulter `doc/prompts/` et `doc/stack.md` si necessaire

Ces fichiers sont la **source de verite** pour:

- le style de code
- les conventions de nommage
- le niveau de qualite attendu
- les etapes de validation
- les anti-patterns a eviter

Au debut de chaque session, confirmer la lecture de ces instructions.

## Tronc commun obligatoire

Lire et appliquer en priorite:

1. `doc/ai-agent-instructions.md`
2. `doc/ai-code-style.md`

## Worktree Copilot

Les regles de branch safety sont definies dans `doc/ai-agent-instructions.md` (section 5).

Chemin worktree isole de Copilot: `/tmp/tgc-copilot-worktree`.

Les modifications dans ce worktree Copilot sous `/tmp` ne necessitent pas de validation prealable de l'utilisateur.

## Declencheur autonomie

Si l'utilisateur demande "en autonomie" (ou formulation equivalente), Copilot doit:

1. Travailler uniquement dans `/tmp/tgc-copilot-worktree`.
2. Utiliser une branche dediee `copilot/<description>`.
3. Ne faire aucune modification de code dans le worktree principal de l'utilisateur.
