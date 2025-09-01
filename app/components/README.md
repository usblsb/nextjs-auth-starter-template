# components

## Estructura

```
components/
├── README.md
├── code-switcher.tsx          # Switcher interactivo para mostrar datos Clerk
├── layouts/
│   ├── footer.tsx             # Footer con enlaces legales
│   └── header.tsx             # Header con branding "ELECTRÓNICA SCHOOL"
├── theme.ts                   # Tema personalizado para syntax highlighter
└── user-details.tsx           # Componente detallado de información usuario
```

## Archivos Principales

- **code-switcher.tsx**: Componente interactivo que permite alternar entre user/session/organization de Clerk
- **user-details.tsx**: Muestra información detallada del usuario con formato visual
- **layouts/**: Componentes de layout reutilizables
- **theme.ts**: Configuración de colores para react-syntax-highlighter

## Para LLMs

- Patrón principal: Componentes React con hooks de Clerk
- Archivos clave: code-switcher.tsx, user-details.tsx, layouts/
- Convenciones: "use client", hooks @clerk/nextjs, Tailwind CSS
- Layout: Header con branding + Footer con enlaces a (pages-footer)
- Tema: Syntax highlighting personalizado con colores específicos
