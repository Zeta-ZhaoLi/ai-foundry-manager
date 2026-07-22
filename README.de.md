# Azure AI Foundry Manager

Languages: [English](README.md) | [中文](README.zh-CN.md) | [日本語](README.ja.md) | [Français](README.fr.md) | [Deutsch](README.de.md) | [Español](README.es.md) | [Português (Brasil)](README.pt-BR.md) | [한국어](README.ko.md)

Local-first Dashboard zur Verwaltung von Azure AI Foundry/OpenAI Accounts, Regionen, Modellauswahl und Deployment-Template-Export.

## Ubersicht

- Reine Frontend-App (React + Vite), kein Backend erforderlich
- Daten werden im Browser-`localStorage` gespeichert
- Sensitive Werte werden vor lokaler Speicherung verschlusselt
- Fur Multi-Account- und Multi-Region-Betrieb ausgelegt

## Kernfunktionen

### Account- und Regionenverwaltung

- Verwaltung von Tier, Quota und Nutzungsdaten pro Account
- Mehrere Regionen pro Account
- Foundry/OpenAI/AI Services/Anthropic Endpoints pro Region
- API Key und Resource Name pro Region
- Aktivieren/Deaktivieren und Drag-and-Drop Sortierung

### Modellverwaltung

- Globales Master-Modellverzeichnis
- Modellauswahl pro Region per Klick mit Suche/Filter
- Coverage-Charts und Modellstatistiken
- Ein-Klick-Kopie fur Modelllisten

### Deployment-Template-Export

- Regionsbezogene Modell-Deployment-Tabelle
- Editierbare Felder: Einbeziehen, Modell, Bereitstellungsname, Version, Kapazitat
- ARM-Template-Kopie mit Validierung

### Produktivitat und Datenschutz

- Command Palette und Tastatur-Shortcuts
- Datenschutzmodus zum Maskieren sensibler Daten
- JSON Import/Export fur Konfiguration
- Hell/Dunkel/System Theme und mehrsprachige UI

## Schnellstart

### Voraussetzungen

- Node.js 22.12+
- npm

### Installation

```bash
git clone https://github.com/Zeta-ZhaoLi/ai-foundry-manager.git
cd ai-foundry-manager
npm install
```

### Start

```bash
npm run dev
```

Standard-URL: `http://localhost:5174`

### Build und Preview

```bash
npm run build
npm run preview
```

## Nutzungsablauf

1. Modelle im **Global Model Directory** pflegen.
2. Accounts und darunter Regionen anlegen.
3. Endpoint / API Key / Resource Name pro Region setzen.
4. Deployment-Tabelle anpassen.
5. Modelllisten oder Deployment-Template kopieren.

## Daten und Sicherheit

- Wichtige localStorage-Keys:
  - `ai-foundry-manager:accounts`
  - `ai-foundry-manager:master-models`
  - `ai-foundry-manager:theme`
  - `ai-foundry-manager:lang`
- Sensitive Felder (z. B. API Keys) werden verschlusselt gespeichert.
- Datenschutzmodus maskiert sensible UI-Werte.

## Optionale/interne Hinweise

- Das Repository kann optionale/interne Integrationskonfigurationen fur lokale Entwicklung enthalten.
- Die Kernnutzung erfordert keine Backend-Anbindung.

## Unterstutzte UI-Sprachen

- `zh`, `en`, `ja`, `fr`, `de`, `es`, `pt-BR`, `ko`

## Entwicklungsbefehle

```bash
npm run dev
npm run lint
npm run test
npm run build
```

## Hauptstruktur

```text
src/
  components/      UI- und Dashboard-Module
  hooks/           lokaler Zustand und Persistenz
  i18n/            Ubersetzungsressourcen
  utils/           gemeinsame Utilities
  contexts/        React Contexts
openspec/          Change Proposals und Specs
```

## Lizenz

MIT License. Siehe `LICENSE`.

## Autor

- 赵利利 (ZetaTechs)
- Repository: https://github.com/Zeta-ZhaoLi/ai-foundry-manager
- Issues: https://github.com/Zeta-ZhaoLi/ai-foundry-manager/issues
