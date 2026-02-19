Modèle de données du moteur TCG.

Ce document définit les entités, le state, et les règles
qui manquent aux prompts 1-4 pour être exploitables.

=====================
ENTITÉS
=====================

Le moteur manipule 3 types d'entités :

1. Player
   - id          (string, unique)
   - name        (string)
   - attributes  (Map clé-valeur générique)

   Le moteur ne connaît pas les clés d'attributs.
   Le gameplay les définit (hp, mana, score...).

2. Card
   - id            (string, unique, généré par le moteur)
   - definitionId  (string, réfère à un template externe)
   - ownerId       (string, réfère à un Player.id)
   - zoneId        (string, réfère à une Zone.id)
   - attributes    (Map clé-valeur générique)

   Les attributs sont les valeurs BASE.
   Les valeurs effectives passent par QueryAPI + modifiers.

   Exemples d'attributs gameplay (non connus du moteur) :
   power, cost, hp, type, keywords...

3. Zone
   - id            (string, unique)
   - zoneTypeId    (string, réfère à un ZoneType)
   - ownerId       (string | null, réfère à un Player.id)

   Une Zone est une instance d'un ZoneType.
   Elle hérite des propriétés par défaut du type.

=====================
ZONE TYPE REGISTRY
=====================

Le moteur fournit un registre de ZoneTypes.
Chaque ZoneType déclare des propriétés par défaut.

ZoneType :
  - id              (string, unique)
  - ordered         (boolean : les cartes ont-elles un index ?)
  - visibility      (enum: 'public' | 'owner' | 'hidden')
  - maxSize         (number | null : limite de cartes)

Le gameplay enregistre ses types au setup :

  zoneTypeRegistry.register({
    id: 'deck',
    ordered: true,
    visibility: 'hidden',
    maxSize: null
  })

  zoneTypeRegistry.register({
    id: 'hand',
    ordered: true,
    visibility: 'owner',
    maxSize: null
  })

  zoneTypeRegistry.register({
    id: 'board',
    ordered: false,
    visibility: 'public',
    maxSize: 5
  })

Les ZoneTypes sont enregistrés AVANT le début de la partie.
Ils sont immuables pendant le jeu.

=====================
VISIBILITÉ
=====================

Modèle combiné zone + entité :

1. Chaque ZoneType définit une visibilité par défaut.
2. Une Card peut override sa visibilité :
   card.visibilityOverride = 'hidden' | 'public' | null

Règles de résolution :
  - Si card.visibilityOverride != null → utiliser l'override
  - Sinon → utiliser la visibilité du ZoneType

Signification des valeurs :
  - 'public'  : visible par tous les joueurs
  - 'owner'   : visible uniquement par le propriétaire de la zone
  - 'hidden'  : invisible pour tous (top of deck, face-down)

Le moteur expose :
  ctx.isVisibleTo(cardId, playerId) → boolean

L'UI utilise cette méthode pour filtrer les informations.

=====================
SHAPE DU STATE
=====================

state = {
  players: Map<playerId, Player>,
  cards: Map<cardId, Card>,
  zones: Map<zoneId, Zone>,
  turnState: {
    activePlayerId: string,
    turnNumber: number,
    phase: string | null
  }
}

Toutes les collections sont des Maps indexées par ID.
Pas de tableaux pour les entités principales.

turnState.phase est opaque pour le moteur.
Le gameplay le définit (draw, main, combat, end...).

=====================
SÉRIALISATION
=====================

Format : JSON pur.

Règles :
  - Toutes les entités sont sérialisables en JSON
  - Les Maps sont sérialisées en objets {id: entity}
  - Pas de références circulaires
  - Pas de fonctions dans le state
  - Pas de classes : le state est un plain object

Versionning :
  - state.version = number (incrémenté à chaque patch)
  - Pas de migration de schema pour l'instant

CommandLog :
  - Array d'objets {type, payload, timestamp}
  - Chaque entrée est auto-suffisante

RandomTape :
  - Array de résultats RNG consommés
  - Index de lecture courant

Export replay = {commandLog, randomTape, initialState}

=====================
OWNERSHIP
=====================

Règles :
  - Chaque Card a un ownerId (le joueur qui la possède)
  - Chaque Zone a un ownerId (null = zone partagée)
  - Le changement d'owner passe par une Command
  - Le déplacement de zone passe par une Command
  - La QueryAPI expose ctx.getOwner(entityId)

=====================
IDENTIFIANTS
=====================

Format des IDs :
  - Players : fournis au setup (ex: 'player1', 'player2')
  - Cards   : générés par le moteur (ex: 'card_001', 'card_002')
  - Zones   : composés type + owner (ex: 'deck_player1', 'hand_player2')

Le moteur fournit un IdGenerator déterministe
(compteur, pas d'UUID) pour garantir le replay.
