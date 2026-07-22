# Azure AI Foundry Manager

Languages: [English](README.md) | [中文](README.zh-CN.md) | [日本語](README.ja.md) | [Français](README.fr.md) | [Deutsch](README.de.md) | [Español](README.es.md) | [Português (Brasil)](README.pt-BR.md) | [한국어](README.ko.md)

Panel local-first para gestionar cuentas, regiones, seleccion de modelos y exportacion de plantillas de despliegue para Azure AI Foundry/OpenAI.

## Resumen

- Aplicacion frontend pura (React + Vite), sin backend obligatorio
- Todos los datos se guardan en `localStorage` del navegador
- Los valores sensibles se cifran antes de guardarse localmente
- Pensado para operaciones multi-cuenta y multi-region

## Funcionalidades principales

### Gestion de cuentas y regiones

- Gestion de tipo de cuenta, cuota y uso
- Varias regiones por cuenta
- Endpoints Foundry/OpenAI/AI Services/Anthropic por region
- API Key y Resource Name por region
- Activar/desactivar y ordenar con arrastrar y soltar

### Gestion de modelos

- Directorio maestro global de modelos
- Seleccion de modelos por region con clic, busqueda y filtros
- Graficos de cobertura y estadisticas
- Copia rapida de listas de modelos

### Exportacion de plantilla de despliegue

- Tabla de despliegue por region
- Campos editables: incluir, modelo, nombre de despliegue, version, capacidad
- Copia de plantilla ARM con validaciones

### Productividad y privacidad

- Paleta de comandos y atajos de teclado
- Modo de privacidad para ocultar informacion sensible
- Importacion/exportacion JSON de configuracion
- Tema oscuro/claro/sistema e interfaz multilingue

## Inicio rapido

### Requisitos

- Node.js 22.12+
- npm

### Instalacion

```bash
git clone https://github.com/Zeta-ZhaoLi/ai-foundry-manager.git
cd ai-foundry-manager
npm install
```

### Desarrollo

```bash
npm run dev
```

URL por defecto: `http://localhost:5174`

### Build y preview

```bash
npm run build
npm run preview
```

## Flujo de uso

1. Mantener modelos en **Global Model Directory**.
2. Crear cuentas y luego regiones.
3. Configurar Endpoint / API Key / Resource Name por region.
4. Ajustar la tabla de despliegue.
5. Copiar lista de modelos o plantilla de despliegue.

## Datos y seguridad

- Claves principales de localStorage:
  - `ai-foundry-manager:accounts`
  - `ai-foundry-manager:master-models`
  - `ai-foundry-manager:theme`
  - `ai-foundry-manager:lang`
- Campos sensibles (por ejemplo API keys) se guardan cifrados.
- El modo de privacidad oculta valores sensibles en pantalla.

## Notas opcionales/internas

- El repositorio puede incluir configuraciones de integracion opcionales/internas para desarrollo local.
- El uso principal no requiere conexion con backend.

## Idiomas UI compatibles

- `zh`, `en`, `ja`, `fr`, `de`, `es`, `pt-BR`, `ko`

## Comandos de desarrollo

```bash
npm run dev
npm run lint
npm run test
npm run build
```

## Estructura principal

```text
src/
  components/      modulos de UI y dashboard
  hooks/           estado local y persistencia
  i18n/            recursos de traduccion
  utils/           utilidades compartidas
  contexts/        contextos de React
openspec/          propuestas de cambio y specs
```

## Licencia

MIT License. Ver `LICENSE`.

## Autor

- 赵利利 (ZetaTechs)
- Repository: https://github.com/Zeta-ZhaoLi/ai-foundry-manager
- Issues: https://github.com/Zeta-ZhaoLi/ai-foundry-manager/issues
