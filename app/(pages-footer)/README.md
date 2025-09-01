# (pages-footer)

## Estructura
```
├── README.md
├── _ejemplos/                    # Plantillas y ejemplos para LLMs
│   ├── page-template.tsx         # Plantilla con ayudas
│   ├── page.tsx                  # Plantilla sin ayudas
│   ├── contenido-template.tsx    # Plantilla de contenido
│   └── instrucciones-llm.md      # Guías para LLMs
├── web-aviso-legal/              # Página de aviso legal
├── web-condiciones-venta/        # Página de condiciones de venta
├── web-contactar/                # Página de contacto
├── web-politica-cookies/         # Página de política de cookies
├── web-politica-privacidad/      # Página de política de privacidad
├── web-preguntas-frecuentes/     # Página de FAQ
└── web-requisitos-tecnicos/      # Página de requisitos técnicos
```

## Archivos Principales
- **_ejemplos/**: Plantillas para generar páginas consistentes
- **page.tsx**: Componente Next.js con metadatos y layout
- **contenido.tsx**: Contenido JSX exportado como constante
- **@/styles/pages-footer.css**: Estilos específicos importados

## Para LLMs
- Patrón principal: Separación page.tsx + contenido.tsx
- Archivos clave: _ejemplos/ contiene todas las plantillas
- Convenciones: Metadatos noindex/nofollow, layout Header+Footer, max-w-4xl responsive