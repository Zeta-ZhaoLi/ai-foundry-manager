# Azure AI Foundry Manager

Languages: [English](README.md) | [中文](README.zh-CN.md) | [日本語](README.ja.md) | [Français](README.fr.md) | [Deutsch](README.de.md) | [Español](README.es.md) | [Português (Brasil)](README.pt-BR.md) | [한국어](README.ko.md)

Tableau de bord local-first pour gerer comptes, regions, selection de modeles et export de template de deploiement Azure AI Foundry/OpenAI.

## Vue d'ensemble

- Application frontend pure (React + Vite), sans backend requis
- Donnees stockees dans le `localStorage` du navigateur
- Valeurs sensibles chiffrees avant stockage local
- Concu pour des operations multi-comptes et multi-regions

## Fonctions principales

### Gestion des comptes et regions

- Gestion du type de compte, quota et usage
- Plusieurs regions par compte
- Endpoints Foundry/OpenAI/AI Services/Anthropic par region
- API Key et Resource Name configures par region
- Activation/desactivation et tri par glisser-deposer

### Gestion des modeles

- Repertoire global de modeles
- Selection des modeles par region avec recherche/filtre
- Graphiques de couverture et statistiques
- Copie rapide des listes de modeles

### Export de template de deploiement

- Tableau de deploiement par region
- Champs editables: inclure, modele, nom de deploiement, version, capacite
- Copie du template ARM avec validations

### Productivite et confidentialite

- Palette de commandes et raccourcis clavier
- Mode confidentialite pour masquer les donnees sensibles
- Import/export JSON de configuration
- Theme sombre/clair/systeme et interface multilingue

## Demarrage rapide

### Prerequis

- Node.js 22.12+
- npm

### Installation

```bash
git clone https://github.com/Zeta-ZhaoLi/ai-foundry-manager.git
cd ai-foundry-manager
npm install
```

### Lancement

```bash
npm run dev
```

URL par defaut: `http://localhost:5174`

### Build et preview

```bash
npm run build
npm run preview
```

## Flux d'utilisation

1. Maintenir les modeles dans **Global Model Directory**.
2. Ajouter des comptes puis des regions.
3. Configurer Endpoint / API Key / Resource Name par region.
4. Ajuster la table de deploiement.
5. Copier la liste de modeles ou le template de deploiement.

## Donnees et securite

- Cles localStorage principales:
  - `ai-foundry-manager:accounts`
  - `ai-foundry-manager:master-models`
  - `ai-foundry-manager:theme`
  - `ai-foundry-manager:lang`
- Les champs sensibles (ex: API keys) sont stockes de facon chiffree.
- Le mode confidentialite masque les informations sensibles a l'ecran.

## Notes optionnelles/internes

- Le depot peut contenir des configurations d'integration optionnelles/internes pour le developpement local.
- L'utilisation principale ne requiert aucune connexion backend.

## Langues UI supportees

- `zh`, `en`, `ja`, `fr`, `de`, `es`, `pt-BR`, `ko`

## Commandes de developpement

```bash
npm run dev
npm run lint
npm run test
npm run build
```

## Structure principale

```text
src/
  components/      UI et dashboard
  hooks/           etat local et persistance
  i18n/            ressources de traduction
  utils/           utilitaires partages
  contexts/        contextes React
openspec/          propositions et specifications
```

## Licence

MIT License. Voir `LICENSE`.

## Auteur

- 赵利利 (ZetaTechs)
- Repository: https://github.com/Zeta-ZhaoLi/ai-foundry-manager
- Issues: https://github.com/Zeta-ZhaoLi/ai-foundry-manager/issues
