# Instructions Changelog Agents IA

Ce document definit le format commun pour documenter les changements dans `CHANGELOG-AGENT.md`.
Tous les agents (claude, copilot, codex) doivent suivre ce format.

## Principes

1. **Ne pas dupliquer git**: le hash de commit, la liste des fichiers modifies et le diff sont deja dans l'historique git. Le changelog sert a expliquer le **pourquoi** et l'**impact** en langage humain.
2. **Concision**: une entree doit etre lisible en 10 secondes.
3. **Structure commune**: tous les agents utilisent le meme format pour faciliter la lecture croisee.

## Format d'une entree

```markdown
### type(scope): description courte

**Agent**: `nom` | **PR**: #numero

Explication en 1-3 phrases: pourquoi ce changement, contexte si necessaire.

**Impact**: consequence notable (seulement si applicable).
```

### Champs obligatoires

| Champ | Description | Exemple |
|-------|-------------|---------|
| `type` | Categorie du changement (voir types ci-dessous) | `feat`, `fix` |
| `scope` | Module ou zone affectee (court) | `fx`, `ui`, `core`, `docs` |
| `description courte` | Resume en < 70 caracteres | `particules configurables` |
| `Agent` | Identifiant de l'agent, minuscules, sans espace | `claude`, `copilot`, `codex` |
| `PR` | Numero de la PR ou `—` si pas de PR | `#25`, `—` |
| Description libre | 1-3 phrases: pourquoi, contexte | texte libre |

### Champ optionnel

| Champ | Quand l'utiliser |
|-------|-----------------|
| `Impact` | Breaking change, regression possible, effet sur la performance, dependance modifiee |

## Types de changements

| Type | Usage |
|------|-------|
| `feat` | Nouvelle fonctionnalite |
| `fix` | Correction de bug |
| `style` | Changement CSS/visuel sans logique metier |
| `refactor` | Restructuration sans changement de comportement |
| `docs` | Documentation uniquement |
| `chore` | Maintenance, tooling, dependencies |

## Structure du fichier CHANGELOG-AGENT.md

Les entrees sont groupees par date (ISO 8601), les plus recentes en premier.

```markdown
## 2026-02-20

### feat(fx): particules configurables pour le mouse trail

**Agent**: `copilot` | **PR**: #25

Refactored le systeme de particules pour accepter des presets JSON.
Permet la reconfiguration runtime sans reload.

### fix(ui): correction du z-index du HUD

**Agent**: `claude` | **PR**: #24

Le HUD passait sous les modales en mode inspection.

**Impact**: les composants qui utilisent z-index > 1000 doivent etre verifies.

## 2026-02-19

### style(ui): palette de couleurs printaniere

**Agent**: `copilot` | **PR**: #14

Adoucissement des teintes pour un rendu plus agreable.
```

## Regles

1. **Identification obligatoire**: chaque entree doit contenir le champ `Agent` avec l'identifiant exact de l'agent (`claude`, `copilot`, `codex`). Jamais d'agent anonyme.
2. **Placement**: inserer l'entree sous la section de date du jour. Si la date n'existe pas, creer la section en haut du fichier.
3. **Quand documenter**:
   - Apres un squash merge de PR vers `main`.
   - Apres un changement significatif (feature, fix majeur, refactor notable).
   - **Pas** pour les commits intermediaires, rebases, ou cherry-picks internes.
4. **Langue**: meme langue que le reste du fichier (francais par defaut).
5. **Un agent ne modifie que ses propres entrees**, sauf reorganisation demandee par l'utilisateur.

## Verification avant ecriture

- [ ] L'identifiant agent est correct et en minuscules
- [ ] Le type est un des types autorises
- [ ] La description explique le **pourquoi**, pas juste le **quoi**
- [ ] Le champ Impact est present si le changement a des effets notables
- [ ] L'entree est placee sous la bonne date, en haut de la section
