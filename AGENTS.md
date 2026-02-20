# Instructions Codex — Moteur TCG/JDR (tgc)

## Identite agent

- **Nom**: `codex`
- **Branches**: `codex/*`
- **Prefixe PR**: `codex: ...`
- **Worktree isole**: `/tmp/tgc-codex-worktree` (fixe, reutilise entre les taches)

## Tronc commun obligatoire

**Lire ces fichiers EN PREMIER au debut de chaque tache** (source de verite pour le style, les regles critiques, la branch safety, la verification, et le mode autonome):

1. `doc/ai-agent-instructions.md`
2. `doc/ai-code-style.md`

## References projet

1. `doc/prompts/` pour les conventions moteur/metier.
2. `doc/stack.md` pour la stack et les scripts.
