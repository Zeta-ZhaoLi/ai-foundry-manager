# Azure AI Foundry Manager

Languages: [English](README.md) | [中文](README.zh-CN.md) | [日本語](README.ja.md) | [Français](README.fr.md) | [Deutsch](README.de.md) | [Español](README.es.md) | [Português (Brasil)](README.pt-BR.md) | [한국어](README.ko.md)

Painel local-first para gerenciar contas, regioes, selecao de modelos e exportacao de template de implantacao no Azure AI Foundry/OpenAI.

## Visao geral

- Aplicacao frontend pura (React + Vite), sem backend obrigatorio
- Dados armazenados no `localStorage` do navegador
- Valores sensiveis criptografados antes do armazenamento local
- Voltado para operacao multi-conta e multi-regiao

## Recursos principais

### Gestao de contas e regioes

- Gestao de tipo de conta, cota e uso
- Varias regioes por conta
- Endpoints Foundry/OpenAI/AI Services/Anthropic por regiao
- API Key e Resource Name por regiao
- Ativar/desativar e ordenar com drag-and-drop

### Gestao de modelos

- Diretorio mestre global de modelos
- Selecao de modelos por regiao com clique, busca e filtro
- Graficos de cobertura e estatisticas
- Copia rapida de listas de modelos

### Exportacao de template de implantacao

- Tabela de implantacao por regiao
- Campos editaveis: incluir, modelo, nome de implantacao, versao, capacidade
- Copia de template ARM com validacoes

### Produtividade e privacidade

- Command palette e atalhos de teclado
- Modo de privacidade para mascarar dados sensiveis
- Importacao/exportacao JSON de configuracao
- Tema escuro/claro/sistema e UI multilingue

## Inicio rapido

### Requisitos

- Node.js 18+
- npm

### Instalacao

```bash
git clone https://github.com/Zeta-ZhaoLi/ai-foundry-manager.git
cd ai-foundry-manager
npm install
```

### Desenvolvimento

```bash
npm run dev
```

URL padrao: `http://localhost:5174`

### Build e preview

```bash
npm run build
npm run preview
```

## Fluxo de uso

1. Manter modelos no **Global Model Directory**.
2. Criar contas e depois regioes.
3. Configurar Endpoint / API Key / Resource Name por regiao.
4. Ajustar a tabela de implantacao.
5. Copiar lista de modelos ou template de implantacao.

## Dados e seguranca

- Chaves principais do localStorage:
  - `ai-foundry-manager:accounts`
  - `ai-foundry-manager:master-models`
  - `ai-foundry-manager:theme`
  - `ai-foundry-manager:lang`
- Campos sensiveis (ex.: API keys) sao armazenados de forma criptografada.
- O modo de privacidade mascara valores sensiveis na tela.

## Notas opcionais/internas

- O repositorio pode conter configuracoes de integracao opcionais/internas para desenvolvimento local.
- O uso principal nao exige conexao com backend.

## Idiomas de UI suportados

- `zh`, `en`, `ja`, `fr`, `de`, `es`, `pt-BR`, `ko`

## Comandos de desenvolvimento

```bash
npm run dev
npm run lint
npm run test
npm run build
```

## Estrutura principal

```text
src/
  components/      modulos de UI e dashboard
  hooks/           estado local e persistencia
  i18n/            recursos de traducao
  utils/           utilitarios compartilhados
  contexts/        contextos React
openspec/          propostas de mudanca e especificacoes
```

## Licenca

MIT License. Veja `LICENSE`.

## Autor

- 赵利利 (ZetaTechs)
- Repository: https://github.com/Zeta-ZhaoLi/ai-foundry-manager
- Issues: https://github.com/Zeta-ZhaoLi/ai-foundry-manager/issues
