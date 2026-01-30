# readme-documentation

## ADDED Requirements

### Requirement: Localized README Variants

The repository MUST provide localized README files aligned to the canonical `README.md`.

**Files:**

- `README.md` (canonical)
- `README.zh-CN.md`
- `README.ja.md`
- `README.fr.md`
- `README.de.md`
- `README.es.md`
- `README.pt-BR.md`
- `README.ko.md`

#### Scenario: Localized READMEs exist

**Given** a user visits the repository

**When** they look for documentation in a common language

**Then** the repository MUST provide localized README files for Chinese, Japanese, French, and German

---

### Requirement: README Language Index

Each README file MUST include a language index block at the top linking to the other README language variants.

#### Scenario: README provides language links

**Given** a user opens any README variant

**When** they view the first section of the README

**Then** the README MUST include links to the other language versions

---

### Requirement: README Documents Supported UI Languages

The canonical `README.md` MUST list the supported UI languages.

#### Scenario: README lists supported languages

**Given** a user reads the Features section

**When** they reach the internationalization/language feature bullets

**Then** the README MUST list `zh`, `en`, `ja`, `fr`, `de`, `es`, `pt-BR`, and `ko` as supported UI languages
