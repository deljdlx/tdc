# AI Agent Changelog Instructions

Ce document définit le processus pour que les agents IA documentent leurs changements dans `CHANGELOG-AGENT.md`.

## Règle obligatoire: Identification d'agent

**CHAQUE changement doit inclure l'identification de l'agent responsable.**

- **Agent responsable**: Identifiant unique de l'agent (`claude`, `copilot`, `codex`, etc.)
- **Location**: Toujours dans le champ `Agent` de l'entrée changelog
- **Format**: Nom parfaitement unique de l'agent (en minuscules, pas d'espaces)

## Procédure: Ajouter un changement au changelog

### 1. Lire le changelog existant

Avant de modifier:
```bash
cat CHANGELOG-AGENT.md | head -100
```

### 2. Identifier les informations de votre changement

Collecter:
- `COMMIT_HASH` (7-8 cars, ex: `a1b2c3d`)
- `PR_NUMBER` (ex: `#15`) ou `Non` si pas de PR
- `CHANGED_FILES` (liste des fichiers modifiés)
- `MODULE` (module principal affecté, ex: `src/fx/`, `src/components/`)
- `DESCRIPTION_COURTE` (1-2 lignes, clair et concis)
- `DESCRIPTION_LONGUE` (contexte, justification, détails)
- `IMPACT` (effets, dépendances, risques si applicables)
- `TAGS` (classification: `#feat`, `#fix`, `#style`, `#docs`, `#refactor`, `#chore`, etc.)

### 3. Créer l'entrée changelog

Format obligatoire:

```markdown
### [TYPE]: [MODULE] — [DESCRIPTION_COURTE]

- **Agent**: `[AGENT_NAME]`
- **Commit**: `[HASH]`
- **PR**: #[NUMÉRO] ou Non
- **Changed Files**: [fichiers]
- **Module**: [module]
- **Details**: [description longue]
- **Impact**: [risques, dépendances]
- **Tags**: `#tag1` `#tag2` `#tag3`
```

### 4. Placer l'entrée dans le bon endroit

**Important**: Les changements les PLUS RÉCENTS doivent être EN PREMIER dans la section date.

- Ouvrir `CHANGELOG-AGENT.md`
- Chercher la section `## [DATE_ACTUELLE]` au format ISO 8601 (ex: `## 2026-02-20`)
- Si la date n'existe pas, créer une nouvelle section au début du fichier (après le front matter)
- **Ajouter l'entrée SANS numéro de section**, juste avant la première `###` existante

Exemple d'insertion (ajout en haut du fichier antes les autres entries de la même date):

```markdown
## 2026-02-20

### feat: New Module — Add new feature

- **Agent**: `copilot`
- **Commit**: `xyz1234`
...

### feat: Previous Feature — Older change

- **Agent**: `claude`
...
```

## Règles d'identification d'agent

### Format accepté

- ✅ `claude` — Claude agent
- ✅ `copilot` — Copilot agent
- ✅ `codex` — Codex agent
- ✅ `[agent-name]` — Tout agent avec identifiant unique

### Format rejeté

- ❌ `Claude` (cap)
- ❌ `CoPiLoT` (mixed case)
- ❌ `copilot-v2` (avec tirets, sauf si c'est l'identifiant exact)
- ❌ `unknown` (jamais d'agent anonyme)

**Règle**: Un agent doit TOUJOURS connaître son identifiant. S'il ne le connaît pas, il doit chercher dans ses instructions personnelles (`CLAUDE.md`, `AGENTS.md`, `COPILOT.md`, etc.) ou demander avant de documenter.

## Template markdown à copier-coller

```markdown
### [TYPE]: [MODULE] — [DESCRIPTION_COURTE]

- **Agent**: `[claude|copilot|codex]`
- **Commit**: `[7-char hash]`
- **PR**: #[numero] ou Non
- **Changed Files**: [fichier1], [fichier2], [fichier3]
- **Module**: [src/path/to/module]
- **Details**: 
  - Point clé 1
  - Point clé 2
  - Point clé 3
- **Impact**: 
  - Conséquence 1
  - Conséquence 2
- **Tags**: `#feat` `#tag2` `#tag3`
```

## Types de changements (exigés)

Choisir une et une seule catégorie:

- `feat` — Nouvelle fonctionnalité
- `fix` — Correction de bug  
- `style` — Changement CSS/visuel (sans logique métier)
- `refactor` — Restructuration sans changement comportement
- `docs` — Documentation uniquement
- `chore` — Maintenance, tooling, dependencies

## Tags optionnels mais recommandés

Ajouter des tags supplémentaires pour classification:

- `#breaking-change` — API change non compatible
- `#a11y` — Accessibilité
- `#mobile-support` — Support mobile
- `#performance` — Optimisation performance
- `#test-coverage` — Ajout de tests
- `#ui-redesign` — Redesign UI majeur
- `#config-driven` — Configuration externalisée
- Etc. (créer des tags pertinents pour le changement)

## Checklist avant de documenter

- [ ] Je suis connecté sous l'identité d'agent correcte (vérifier dans instructions perso)
- [ ] Le commit hash est correctement formalisé (7-8 caractères)
- [ ] Le numéro PR est correct ou `Non` si pas applicable
- [ ] Les fichiers modifiés sont listés (au moins les 3 principaux)
- [ ] Le module est identifié avec le chemin relatif
- [ ] La description longue explique POURQUOI, pas juste QUOI
- [ ] L'impact liste les dépendances et effets secondaires potentiels
- [ ] Au moins 2 tags sont présents
- [ ] L'agent est identifié dans le champ `Agent`

## Exemple complet

```markdown
### feat: FX Système — Configurable mouse trail particles

- **Agent**: `copilot`
- **Commit**: `a1b2c3d`
- **PR**: #25
- **Changed Files**: `src/fx/MouseTrail.js`, `src/fx/trail-presets.json`, `src/adapters/ui-dev/UiAdapter.js`
- **Module**: `src/fx/` (particle effects system)
- **Details**: 
  - Refactored particle system pour accepter presets JSON
  - Permet runtime reconfiguration sans reload
  - Presets supportés: sparkles, embers, auras
- **Impact**: 
  - MouseTrail charge les presets au startup
  - Aucun breaking change sur l'API publique
  - Performance: +2ms startup (presets loading) negligible
- **Tags**: `#feat` `#config-driven` `#performance` `#fx-system`
```

## Integration automatisée (Agents)

Les agents peuvent parser ce document pour:

1. **Lire les instructions**: chercher pattern `### [TYPE]:`
2. **Extraire métadonnées**: regex `^\- \*\*Agent\*\*: \`([^`]+)\`$`
3. **Valider agent**: s'assurer que l'agent dans le changelog correspond au contexte d'exécution
4. **Analyser impact**: lire `Impact` avant modification d'un module

## Quand documenter?

- ✅ Après un commit significatif (feature, fix majeur)
- ✅ Après squash merge d'une PR
- ✅ Après refactor ou restructuration
- ❌ Pas de documentation pour chaque petit commit intermédiaire
- ❌ Pas de documentation pour rebase ou cherry-pick interne

---

**Document version**: 1.0
**Date de création**: 2026-02-20
**Maintenu par**: Agent process owneragent-process
