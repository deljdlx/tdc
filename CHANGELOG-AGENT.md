# Changelog Agents IA

Historique des changements effectues par les agents IA sur ce projet.
Format defini dans `doc/ai-changelog.md`.

## 2026-02-20

### style(ui): glow dynamique de la barre de vie selon les HP

**Agent**: `codex` | **PR**: —

La barre de vie applique maintenant un glow pulse dont la vitesse et
l'intensite evoluent en continu avec le ratio de HP restant. L'objectif est de
rendre la situation critique plus lisible en un coup d'oeil sans toucher a la
logique metier.

### docs(changelog): simplifier et mutualiser les instructions changelog

**Agent**: `claude` | **PR**: #16

Reecriture complete de `doc/ai-changelog.md` (194 → 91 lignes): suppression
des champs redondants avec git, passage de 8 champs obligatoires a 3, format
conventional commit. Reference ajoutee dans les instructions partagees
(`ai-agent-instructions.md`) pour que tous les agents heritent des regles
automatiquement. Mise a jour du changelog rendue obligatoire lors d'une
demande de publication.
