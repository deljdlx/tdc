# Changelog Agents IA

Historique des changements effectues par les agents IA sur ce projet.
Format defini dans `doc/ai-changelog.md`.

## 2026-02-21

### refactor(commands): graphe de commandes auto-genere depuis les metadonnees

**Agent**: `claude` | **PR**: —

Ajout de `static category` et `static edges` sur les 11 commandes pour
decrire leurs dependances directement dans le code. Le fichier
`commandGraphData.js` genere maintenant le graphe dynamiquement a partir
de ces metadonnees au lieu de donnees hardcodees. Inclut le fix
d'espacement des noeuds (nodeSep/rankSep augmentes).

### style(ui): theme printanier global pour l'interface

**Agent**: `codex` | **PR**: —

Refonte de la palette principale vers des tons printaniers (verts doux,
creme et accents floraux) avec ajustement des degrades de fond et des
contrastes de navigation. L'objectif est un rendu plus lumineux, naturel
et chaleureux sans modifier le comportement du jeu.

### style(ui): bordures visibles et CSS refactoré pour les cartes

**Agent**: `copilot` | **PR**: #35

Correction du problème de bordures invisibles en remplaçant l'approche
mask CSS par une solution wrapper HTML plus robuste. Le fichier CSS a été
entièrement refactoré avec des sections clairement délimitées et commentées,
améliorant considérablement la lisibilité. La structure HTML ajoute maintenant
un wrapper `.card-border` contenant les gradients, avec la `.frame` comme
contenu intérieur, permettant des coins arrondis (16px) fonctionnels tout en
conservant les bordures dégradées animées visibles.

**Impact**: changement de structure HTML (ajout wrapper), CSS mieux organisé
avec sections commentées, résolution du problème de bordures invisibles.

### style(ui): espacement augmente sur le graphe des commandes

**Agent**: `codex` | **PR**: —

Augmente les separations `nodeSep`, `rankSep` et `edgeSep` du layout
dagre pour aerer le graphe et limiter les chevauchements visuels sur
les liens et les labels en vue d'ensemble.

### style(ui): coins arrondis pour les cartes TCG

**Agent**: `copilot` | **PR**: #34

Remplacement de l'approche `border-image` par un pseudo-element masque
pour permettre des coins veritablement arrondis (16px) sur les cartes.
Les bordures en degrade conservent leur animation et leurs couleurs tout
en beneficiant maintenant d'un border-radius fonctionnel. Tous les etats
interactifs (playable/can-attack/selected/drop-hint/drop-target) ont ete
adaptes pour utiliser le nouveau systeme.

**Impact**: meilleure compatibilite visuelle, les coins carrés avec
border-image sont remplaces par des coins arrondis elegants.

### feat(ui): graphe oriente des commandes avec Cytoscape.js

**Agent**: `claude` | **PR**: —

Ajout d'un 4e onglet "Graph" affichant le graphe de dependances entre les
11 commandes du moteur. Les noeuds sont colores par categorie (game flow,
player action, effect, terminal) et les aretes conditionnelles sont en
pointilles. Utilise Cytoscape.js avec layout dagre hierarchique (top-down).

**Impact**: ajout de 2 dependances runtime (cytoscape, cytoscape-dagre).

### style(ui): boutons plus sobres et moins arrondis

**Agent**: `codex` | **PR**: —

Ajustement de la direction visuelle des boutons pour reduire l'aspect
"jouet": angles plus nets, suppression des effets trop brillants, et
contrastes plus maitrises sur les etats hover/active. Le comportement
reste identique, seul le rendu est rendu plus mature.

### style(ui): tabs basses plus compactes avec rendu premium

**Agent**: `codex` | **PR**: —

Refonte de la tab bar mobile pour reduire l'encombrement vertical et
ameliorer la qualite percue: conteneur flottant plus compact, boutons
horizontaux icone + label, et etats hover/active plus nets. L'objectif
est d'augmenter la lisibilite et le confort d'usage sans toucher a la
logique de navigation.

### style(ui): refonte premium des bordures et design des cartes

**Agent**: `copilot` | **PR**: #30

Amelioration complete du design visuel des cartes TCG avec des bordures
en degrade animes (or pour creatures, violet pour sorts), effets de
relief multicouches, et transitions interactives enrichies. Les etats
playable/can-attack/selected beneficient maintenant de glows animes et
d'effets de surbrillance. Les elements (cout, stats, illustration) ont
ete rehausses avec plus de profondeur et de contraste pour un rendu
premium et plus immersif.

**Impact**: les bordures utilisent maintenant `border-image` avec des
degrades, et plusieurs animations CSS ont ete ajoutees.

## 2026-02-20

### feat(fx): parametres complets et inertie pour le trail FX

**Agent**: `claude` | **PR**: —

Ajout de l'inertie au MouseTrail: les particules heritent de l'elan du
curseur et derivent dans la direction du mouvement, ce qui donne un
rendu organique et fluide. Exposition de tous les parametres restants
dans l'onglet Trail FX (nombre de particules, taille min, epaisseur
ruban, vitesse des sparkles) pour un controle complet de l'effet.

### feat(fx): parametre spread pour effet trail diffus et granulaire

**Agent**: `claude` | **PR**: —

Ajout du parametre `spread` au MouseTrail: disperse les particules
aleatoirement autour du curseur pour un rendu nuage/brume. Le ribbon
est auto-desactive quand spread > 0 pour eviter l'effet "gros pate",
et la taille des particules varie par grain pour un rendu granulaire.

### style(ui): refonte fantasy de la barre de vie joueur

**Agent**: `codex` | **PR**: —

Nettoyage du rendu de la barre de vie pour supprimer les effets de bordure
agressifs et remplacer le mode "ribbon" par une base rectangulaire arrondie
plus lisible. Application d'une direction visuelle fantasy (palette chaud
bois/or, ombres plus organiques) tout en conservant les animations utiles.

### feat(ui): controles de parametres trail FX dans l'onglet Trail FX

**Agent**: `claude` | **PR**: —

Ajout d'un panneau "Parameters" dans l'onglet Trail FX permettant de
configurer en temps reel: couleurs (color pickers), forme, duree,
taille, intensite du glow et nombre de sparkles. Les surcharges se
combinent avec le preset selectionne et se reinitialise au changement
de preset ou via "Reset params".

### style(ui): palette joyeuse et variee pour le HUD

**Agent**: `copilot` | **PR**: #23

Ajoute des teintes plus chaudes et naturelles avec des accents plus vifs pour
les elements interactifs, tout en conservant une bonne lisibilite globale.

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
