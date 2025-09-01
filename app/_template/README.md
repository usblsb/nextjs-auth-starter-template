# _template

## Estructura
```
├── README.md
├── components/                   # Componentes del template Clerk
│   ├── clerk-logo.tsx           # Logo SVG de Clerk
│   ├── deploy-button.tsx        # Botón de deploy
│   ├── footer.tsx               # Footer con enlaces legales
│   ├── header.tsx               # Header con branding
│   └── next-logo.tsx            # Logo de Next.js
├── content/
│   └── metadata.ts              # Metadatos del template y defaults
├── images/                      # Imágenes del template
│   ├── logo.png                 # Logo principal
│   └── *.webp                   # Screenshots de funcionalidades
└── styles/
    └── landing.css              # Estilos específicos del landing
```

## Archivos Principales
- **components/**: Componentes UI específicos del template Clerk
- **content/metadata.ts**: Configuración de metadatos SEO
- **images/**: Assets visuales del template
- **styles/landing.css**: Estilos del template

## Para LLMs
- Patrón principal: Template removible para starter de Clerk + Next.js
- Archivos clave: components/ contiene UI reutilizable
- Convenciones: Prefijo _ indica directorio privado, fácil eliminación
