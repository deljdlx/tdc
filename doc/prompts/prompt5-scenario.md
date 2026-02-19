Scénario jouable minimal pour la mini UX.

Modèle : Hearthstone simplifié.
Objectif : une partie jouable à 2 joueurs en local.

=====================
SETUP DE PARTIE
=====================

2 joueurs. Decks identiques (miroir).

Chaque joueur commence avec :
  - 20 HP
  - 0 mana (max mana = 0)
  - 1 deck de 15 cartes (tirage aléatoire parmi les définitions)
  - 0 cartes en main

Tour 1 :
  - Joueur 1 pioche 3 cartes
  - Joueur 2 pioche 4 cartes
  - Joueur 1 joue en premier

=====================
DÉROULEMENT D'UN TOUR
=====================

Phases dans l'ordre :

1. START_TURN
   - mana max += 1 (cap à 10)
   - mana courant = mana max
   - piocher 1 carte (sauf tour 1 : voir setup)

2. MAIN_PHASE
   - le joueur actif peut, dans n'importe quel ordre :
     a. Jouer une carte de sa main (coûte du mana)
     b. Attaquer avec une créature sur le board
     c. Finir son tour
   - pas de limite d'actions par tour (sauf mana)

3. END_TURN
   - passe le tour à l'adversaire

Pas de phase de combat séparée.
Pas de réponse/instant pendant le tour adverse.

=====================
TYPES DE CARTES
=====================

2 types :

1. Creature
   - cost    (mana pour la jouer)
   - power   (dégâts infligés en attaque)
   - hp      (points de vie, meurt à 0)
   - Arrive sur le board.
   - Ne peut pas attaquer le tour où elle est jouée (summoning sickness).

2. Spell
   - cost    (mana pour le jouer)
   - effect  (identifiant d'effet)
   - Va directement au graveyard après résolution.

=====================
COMBAT
=====================

Règles simplifiées :

- Une créature peut attaquer UNE FOIS par tour.
- Cible : une créature adverse OU le joueur adverse.
- Si cible = créature :
    les deux s'infligent mutuellement leurs dégâts (power).
    Une créature à 0 hp est détruite (va au graveyard).
- Si cible = joueur :
    le joueur perd HP = power de l'attaquant.

Pas de bloqueurs. L'attaquant choisit sa cible.

=====================
WIN CONDITION
=====================

Un joueur gagne quand :
  - L'adversaire tombe à 0 HP ou moins
  - OU l'adversaire doit piocher mais son deck est vide

Pas de match nul.

=====================
ZONES DU SCÉNARIO
=====================

ZoneTypes à enregistrer :

  deck      ordered=true   visibility=hidden   maxSize=null
  hand      ordered=true   visibility=owner    maxSize=10
  board     ordered=false  visibility=public   maxSize=5
  graveyard ordered=true   visibility=public   maxSize=null

Si la main est pleine (10), la carte piochée va au graveyard.
Si le board est plein (5), on ne peut pas jouer de créature.

=====================
CARD DEFINITIONS (7 cartes)
=====================

Créatures (5) :

  RECRUIT
    cost: 1, power: 1, hp: 2
    Vanilla (aucun effet).

  FIGHTER
    cost: 2, power: 2, hp: 3
    Vanilla.

  ARCHER
    cost: 2, power: 3, hp: 1
    Vanilla. Glasscannon.

  GUARDIAN
    cost: 3, power: 1, hp: 5
    Vanilla. Tank.

  CHAMPION
    cost: 5, power: 4, hp: 5
    Vanilla. Finisher.

Sorts (2) :

  FIREBALL
    cost: 3
    effect: DEAL_DAMAGE {amount: 3, target: choice}
    Le joueur choisit une cible (créature ou joueur adverse).

  HEAL
    cost: 2
    effect: RESTORE_HP {amount: 4, target: owner}
    Rend 4 HP au joueur qui lance le sort.

=====================
COMMANDS DU SCÉNARIO
=====================

Le gameplay implémente ces Commands :

  StartGameCommand      (setup initial, distribue les mains)
  StartTurnCommand      (incrémente mana, pioche)
  PlayCreatureCommand   (paie mana, place sur board)
  PlaySpellCommand      (paie mana, résout effet, va au graveyard)
  AttackCommand         (créature attaque cible)
  EndTurnCommand        (passe le tour)

Chaque Command suit le contrat :
  validate() → vérifie mana, cible valide, etc.
  apply()    → patches + events + intents

=====================
EFFECTS DU SCÉNARIO
=====================

Effets minimaux à implémenter :

  DEAL_DAMAGE
    - nécessite un ChoiceRequest (cible)
    - applique les dégâts
    - vérifie mort créature / joueur

  RESTORE_HP
    - pas de choix
    - applique le heal (ne dépasse pas le max 20)

=====================
DONNÉES POUR L'UI
=====================

L'UI doit afficher :
  - HP et mana de chaque joueur
  - main du joueur actif (cartes cliquables)
  - board des deux joueurs (créatures avec power/hp)
  - graveyard (compteur)
  - deck (compteur)
  - log des derniers events
  - boutons : End Turn, Step, Run, Replay
  - indication : à qui le tour, summoning sickness
