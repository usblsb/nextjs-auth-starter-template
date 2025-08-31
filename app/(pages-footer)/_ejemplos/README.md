# Ejemplos para Páginas Footer

Esta carpeta contiene archivos de ejemplo que sirven como plantillas para generar páginas similares en la sección (pages-footer).

## Estructura de Archivos

- `page-template.tsx` - Plantilla base para páginas footer con ayudas
- `page.tsx` - Plantilla base para páginas footer sin ayudas
- `contenido-template.tsx` - Plantilla para el contenido de las páginas

## Uso

Estos archivos están destinados a ser utilizados como referencia por LLMs para generar páginas consistentes que sigan el mismo patrón y estructura.

## Convenciones

1. Todas las páginas deben importar el CSS específico: `@/styles/pages-footer.css`
2. Usar la estructura de layout con Header1 y Footer1
3. Aplicar el contenedor responsive con max-w-4xl
4. Configurar metadatos apropiados con robots noindex/nofollow
5. Separar el contenido en un archivo independiente para mejor organización

## Notas

- Esta carpeta está prefijada con `_` para indicar que es privada y no debe ser ruteada por Next.js
- Estos archivos son solo para referencia y no deben ser accesibles públicamente
