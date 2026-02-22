# Changelog Agents IA

Historique des changements effectues par les agents IA sur ce projet.
Format defini dans `doc/ai-changelog.md`.

## 2026-02-22

### docs(ai): conventions JavaScript detaillees pour le projet TGC

**Agent**: `claude` | **PR**: #69

Creation de `doc/ai-javascript-conventions.md` (~280 lignes, 14 sections) couvrant
les patterns specifiques du projet: Command pattern (validate/apply), Domain Events,
Patches immutables, QueryAPI, event buses, registries, tests Vitest, et anti-patterns.
Reference ajoutee dans les sources de verite de `ai-agent-instructions.md`.

### style(ui): template d'ecran uniforme avec cadre skinnable

**Agent**: `claude` | **PR**: #68

Mise en place d'un systeme de theming via CSS custom properties
(`--theme-*` pour la palette, `--frame-*` pour le cadre) et d'un
template d'ecran uniforme partage par les 4 ecrans de menu.

Le template comprend : cadre decoratif (`frame()`) avec double
bordure, coins ornementes L-shape et lisere gradient tri-couleur ;
barre de navigation avec logo et titre ; bandeau "hero section"
avec ornement losange ; zone de contenu scrollable. Changer de
skin revient a redefinir les custom properties sur `:root`.

**Impact**: les classes CSS `.screen-header`, `.screen-back-btn`,
`.screen-title` sont remplacees par `.screen-nav`, `.screen-nav-back`,
`.screen-nav-title`. Nouvelle classe `.screen-frame` avec 12
custom properties `--frame-*`.

## 2026-02-21

### feat(engine): systeme de heros avec compteurs AP et mana

**Agent**: `claude` | **PR**: —

Ajout du concept de hero au moteur. Chaque joueur recoit 2 heros
aleatoires parmi 4 archetypes (Warrior, Mage, Ranger, Priest). Les
heros ont des compteurs AP (action points) et mana independants.
L'AP se recharge a chaque debut de tour selon la stat speed du hero,
le mana croit de 1 par tour (cap 10). L'UI affiche les barres AP/mana
de chaque hero dans le HUD joueur.

**Impact**: nouvelle collection `heroes` dans le state, extension de
PatchApplier et QueryAPI pour supporter les entites hero, 7 nouveaux
tests, affichage dans PlayerHud.

### style(ui): couleur corail distincte pour les elements interactifs

**Agent**: `claude` | **PR**: —

Les boutons d'action, l'onglet actif et les sliders utilisent maintenant
la couleur secondaire corail (#E8927C) au lieu du vert primaire, pour
mieux se distinguer du reste de l'interface.

### style(ui): tab bar en footer dans le flux

**Agent**: `claude` | **PR**: —

Tab bar retiree du positionnement fixe et integree dans le flux normal
du document. Le conteneur #app utilise un layout flex column avec
min-height 100dvh, le panel actif prend l'espace restant (flex: 1),
et la tab bar reste naturellement en bas sans position fixed.

### feat(fx): petales avec brise legere et rendu pseudo-3D

**Agent**: `codex` | **PR**: —

Le systeme CherryBlossoms simule maintenant une brise plus organique
(vent progressif, micro-rafales, derive variable) et un rendu plus
naturel avec profondeur, flutter, ombrage doux et highlights.

### fix(ui): layer petales place en vrai background page

**Agent**: `codex` | **PR**: —

Le canvas fullscreen des petales est maintenant monte sur `document.body`
avec un z-index de fond dedie, afin qu'il reste derriere toute l'UI
(cartes, HUD, tabs) et se comporte comme un vrai background anime.

### style(ui): polish command graph panel design

**Agent**: `claude` | **PR**: —

Amelioration du design du panneau graphe de commandes pour un
rendu plus professionnel et coherent avec le theme nature de l'app.

### style(ui): redesign global — nature enrichie

**Agent**: `claude` | **PR**: —

Refonte design globale : palette desaturee (sauge, foret profond, ambre
antique), boutons modernises (Cinzel, bords arrondis, sans bevel),
ombres reduites partout, et couleurs PlayerHud harmonisees.

**Impact**: aspect plus mature et coherent, moins d'effet « monochrome vert ».

### style(ui): Material Design printanier — refonte complete

**Agent**: `claude` | **PR**: —

Refonte complete vers un style Material Design printanier : police
unique Inter (sans-serif), palette 3 couleurs (sauge, corail, ciel),
ombres Material a 5 niveaux uniformes, cartes sur fond blanc, suppression
de tous les effets (glows, text-shadows, shimmer, scanlines, pulses).
9 fichiers modifies.

**Impact**: UI professionnelle, propre et coherente sur tous les composants.

- Noeuds : ombres, bordures colorees par categorie, texte lisible
  (blanc avec outline categorie, doré fonce sur nœuds jaunes),
  police Orbitron, taille agrandie (130×44)
- Aretes : couleur vert nature (#8fb08d), labels avec fond pill
  semi-transparent, aretes conditionnelles rose saumon
- Panneau : barre de titre "Command Graph" + legende des categories
  avec pastilles colorees et indicateur de trait conditionnel
- Donnees : CATEGORY_COLORS et CATEGORY_LABELS exportes depuis
  commandGraphData.js pour reutilisation dans la legende

### fix(ui): reinitialiser les petales apres reset FX

**Agent**: `codex` | **PR**: —

Le reset du canvas FX supprimait aussi les effets de fond permanents.
Le flux de demarrage reattache maintenant explicitement l'effet
CherryBlossoms juste apres le `clear()` pour garantir son affichage.

### fix(fx): pétales de cerisiers maintenant visibles au démarrage

**Agent**: `copilot` | **PR**: #41

Correction du bug d'affichage des pétales de cerisiers : les dimensions
du canvas sont maintenant transmises à la méthode `update()` de tous les
effets, permettant à CherryBlossoms de synchroniser ses dimensions dès
le premier frame. Le timer de spawn initial est également réglé à 1.0s
pour forcer la création de pétales dès le premier cycle.

**Impact**: modification de `FxCanvas._loop()` pour passer le canvas à
`update(dt, canvas)` (rétrocompatible avec tous les effets existants).

### style(ui): HUD joueur printanier et harmonise

**Agent**: `codex` | **PR**: —

Le HUD joueur adopte une direction printaniere plus lumineuse
(fond vegetal clair, accents feuille et floral, compteurs adoucis)
et la barre de vie arcade suit des variables de theme pour rester
coherente avec la palette globale.

### feat(fx): fond animé discret avec pétales de cerisiers

**Agent**: `copilot` | **PR**: #39

Ajout d'un effet de fond permanent de pétales de cerisiers animés sur le
canvas. L'effet utilise un système physique avec chute verticale (20-50px/s),
oscillation horizontale sinusoïdale et rotation progressive. Chaque pétale a
une taille aléatoire (3-7px), une opacité variable (0.4-0.8) et une couleur
parmi 5 variations rose/blanc. La densité est contrôlée (0.3 pétales par
10k px²) pour un rendu discret qui n'interfère pas avec le gameplay.

**Impact**: nouvel effet `CherryBlossoms.js` compatible avec le système FxCanvas
existant, spawn automatique dans `UiAdapter` au démarrage.

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
