Créer un adapter UI DEV minimal DOM + Canvas.

=====================
CONTRAINTES
=====================

UI ne touche jamais state interne.

Le core expose :

- getView()
- getViewHash()
- exportReplay()
- importReplay()
- enqueueCommand
- step
- runUntilIdle

View = IDs only.

=====================
UX
=====================

- 2 joueurs
- deck + hand
- timeline DomainEventBatch
- boutons Step / Run / Replay
- clic carte → PlayCardCommand
- canvas → animation pauseHint

=====================
REPLAY
=====================

- export log + tape
- import
- viewHash identique

=====================
LIVRABLES
=====================

src/gameplay/ui/

- index.html
- main.js
- styles.css
- server.js

+ tests replay UI
