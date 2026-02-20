# Instructions Codex

## REGLE CRITIQUE (BLOQUANTE)

Voir `doc/ai-agent-instructions.md` section "Regles critiques" pour le tronc commun (commit/push/merge).

Resume agent-specifique:
- Branches autorisees: `codex/*` uniquement, au format `AGENT_NAME/FEATURE_NAME`.
- Titre de PR: prefixe obligatoire `codex: ...`.
- Merge vers `main`: via PR GitHub (`gh pr create` + `gh pr merge --squash`). Ne jamais merger localement.
- Si l'utilisateur demande de "publier le code" (ou equivalent): utiliser `gh` pour PR + squash merge vers `main`, depuis le worktree Codex uniquement.
- Exception: si l'utilisateur demande explicitement de merger et de pousser sur `main`, l'agent peut executer ces operations.

## ⚠️ AVANT CHAQUE TACHE (OBLIGATOIRE)

**TU DOIS lire ces fichiers EN PREMIER au debut de chaque tache:**

1. `doc/ai-agent-instructions.md`
2. `doc/ai-code-style.md`
3. Consulter `doc/prompts/` et `doc/stack.md` si necessaire

Ces fichiers sont la **source de verite** pour:

- le style de code
- les conventions de nommage
- le niveau de qualite attendu des contributions
- les verifications de validation et de completion
- les anti-patterns a eviter

## Tronc Commun Obligatoire

Lire et appliquer, dans cet ordre:

1. `doc/ai-agent-instructions.md`
2. `doc/ai-code-style.md`

Ces fichiers sont la source de verite pour:

- le style de code
- le niveau de qualite attendu des contributions
- les verifications de validation et de completion

## References Projet

1. `doc/prompts/` pour les conventions moteur/metier.
2. `doc/stack.md` pour la stack et les scripts.

## Worktree Codex

Les regles de securite des branches sont definies dans `doc/ai-agent-instructions.md` (section 5).

Convention du worktree isole Codex: `/tmp/codex/<feature-name>`.

Les modifications effectuees dans ce worktree Codex sous `/tmp` ne necessitent pas de validation prealable de l'utilisateur.

## Declencheur Autonomie

Si l'utilisateur demande "en autonomie" (ou formulation equivalente), Codex doit:

1. Travailler uniquement dans `/tmp/AGENT_NAME/<feature-name>`.
2. Utiliser une branche dediee nommee au format `AGENT_NAME/FEATURE_NAME` (exemple pour Codex: `codex/<feature-name>`).
3. Ne jamais intervenir dans le worktree principal de l'utilisateur (aucune modification de code, doc, config, ni operation git).
4. Si l'utilisateur demande de publier, executer commit/push/PR/merge uniquement dans `/tmp/AGENT_NAME/<feature-name>` via `gh` (PR + `--squash` vers `main`).
