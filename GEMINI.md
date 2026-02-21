# Instructions Gemini — Moteur TCG/JDR (tgc)

## Identite agent

- **Nom**: `gemini`
- **Branches**: `gemini/*`
- **Prefixe PR**: `gemini: ...`
- **Worktree isole**: `/tmp/tgc-gemini-worktree` (fixe, reutilise entre les taches)

## Tronc commun obligatoire

**Lire ces fichiers EN PREMIER au debut de chaque tache** (source de verite pour le style, les regles critiques, la branch safety, la verification, le mode autonome, et le travail concurrent):

1. `doc/ai-agent-instructions.md`
2. `doc/ai-code-style.md`

Au debut de chaque session, confirmer la lecture de ces instructions.

## References projet

1. `doc/prompts/` pour la spec metier du moteur.
2. `doc/stack.md` pour la stack technique.
3. `doc/ai-changelog.md` pour le format du changelog.
