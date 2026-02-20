# Instructions Claude — Moteur TCG/JDR (tgc)

## Identite agent

- **Nom**: `claude`
- **Branches**: `claude/*`
- **Prefixe PR**: `claude: ...`
- **Worktree isole**: `/tmp/tgc-claude-worktree` (fixe, reutilise entre les taches)

## Tronc commun obligatoire

Lire et appliquer en priorite (source de verite pour le style, les regles critiques, la branch safety, la verification, et le mode autonome):

1. `doc/ai-agent-instructions.md`
2. `doc/ai-code-style.md`

## References projet

1. `doc/prompts/` pour la spec metier du moteur.
2. `doc/stack.md` pour la stack technique.

## Specifique Claude

1. Pour Mermaid, utiliser le theme clair:

```txt
%%{init: {'theme': 'default'}}%%
```
