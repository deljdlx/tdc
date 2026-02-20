# Changelog Agents IA

Historique des changements effectues par les agents IA sur ce projet.
Format defini dans `doc/ai-changelog.md`.

## 2026-02-20

### feat(ui): controles de parametres trail FX dans l'onglet Trail FX

**Agent**: `claude` | **PR**: —

Ajout d'un panneau "Parameters" dans l'onglet Trail FX permettant de
configurer en temps reel: couleurs (color pickers), forme, duree,
taille, intensite du glow et nombre de sparkles. Les surcharges se
combinent avec le preset selectionne et se reinitialise au changement
de preset ou via "Reset params".

### docs(agents): blinder les instructions pour le travail autonome concurrent

**Agent**: `claude` | **PR**: —

Renforcement complet de la couche d'instructions multi-agents pour permettre
le travail totalement autonome et concurrent. Ajout de 3 nouvelles sections
au tronc commun: bootstrap autonome (procedure de demarrage step-by-step),
travail concurrent multi-agents (sync, detection de conflits, isolation),
gestion d'erreurs et recovery. Harmonisation des 3 fichiers agents sur la
meme structure exacte.

### style(ui): animation HP avec gradient vert-rouge et glow adaptatif

**Agent**: `codex` | **PR**: —

La barre de vie anime maintenant explicitement les variations de points de vie
(impact en perte, pulse en soin) pour rendre les changements plus lisibles en
combat. La couleur evolue en continu du vert vers le rouge selon le
pourcentage de HP, et l'intensite du glow augmente automatiquement quand la
vie devient basse.

### style(ui): palette champetre pour HUD et theme global

**Agent**: `copilot` | **PR**: #19

Rechauffe les teintes de l'interface avec des verts et bruns inspirés nature,
pour une ambiance plus accueillante tout en gardant la lisibilite du HUD.

### style(ui): barre de vie "tube en verre" avec palette HP

**Agent**: `codex` | **PR**: —

Refonte visuelle de la barre de vie avec un rendu tube en verre (contour vitre,
reflets et effet de liquide interne). La couleur du fluide suit maintenant une
lecture intuitive des HP: vert quand la vie est haute, jaune au palier moyen,
puis rouge en zone critique.

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
