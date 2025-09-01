# Guía de Migración: Carpeta `_template`

## Índice

1. [¿Qué es la carpeta `_template`?](#qué-es-la-carpeta-_template)
2. [Funcionamiento actual](#funcionamiento-actual)
3. [Estructura de la carpeta `_template`](#estructura-de-la-carpeta-_template)
4. [Pasos para eliminar la dependencia](#pasos-para-eliminar-la-dependencia)
5. [Estructura recomendada para componentes propios](#estructura-recomendada-para-componentes-propios)
6. [Migración paso a paso](#migración-paso-a-paso)
7. [Verificación post-migración](#verificación-post-migración)

---

## ¿Qué es la carpeta `_template`?

La carpeta `_template` es una **carpeta privada** de Next.js (indicada por el prefijo `_`) que contiene:

- **Componentes reutilizables** del starter template de Clerk + Next.js
- **Recursos auxiliares** (estilos, imágenes, contenido)
- **Código de ejemplo** diseñado para ser usado temporalmente

### Características importantes:

- ✅ **No genera rutas**: Next.js ignora carpetas con `_` en el enrutamiento
- ✅ **Completamente funcional**: Los componentes están listos para usar
- ✅ **Fácilmente removible**: Diseñada para ser eliminada cuando no se necesite
- ✅ **Código de referencia**: Sirve como ejemplo de mejores prácticas

---

## Funcionamiento actual

### Uso típico en el proyecto

```typescript
// Ejemplo de uso actual en páginas
import Header from "../../_template/components/header";
import { Footer } from "../../_template/components/footer";
import "@/styles/pages-footer.css";
```

### Dependencias identificadas

Las páginas que actualmente dependen de `_template`:

- `app/(pages-footer)/*/page.tsx` - Usan Header y Footer
- Cualquier archivo que importe desde `_template/`

---

## Estructura de la carpeta `_template`

```
app/_template/
├── README.md                    # Documentación del template
├── components/                  # Componentes reutilizables
│   ├── header.tsx              # Componente Header principal
│   ├── footer.tsx              # Componente Footer principal
│   ├── clerk-logo.tsx          # Logo de Clerk
│   ├── deploy-button.tsx       # Botón de deploy
│   └── next-logo.tsx           # Logo de Next.js
├── content/                     # Contenido y metadatos
│   └── metadata.ts             # Metadatos del template
├── images/                      # Imágenes del template
│   ├── logo.png
│   ├── sign-in@2xrl.webp
│   ├── sign-up@2xrl.webp
│   ├── user-button-2@2xrl.webp
│   ├── user-button@2xrl.webp
│   └── verify@2xrl.webp
└── styles/                      # Estilos específicos
    └── landing.css             # Estilos de la landing page
```

---

## Pasos para eliminar la dependencia de la carpeta \_templates

### Fase 1: Análisis y preparación

1. **Identificar todas las dependencias**

   ```bash
   # Buscar todos los imports de _template
   grep -r "_template" app/ --include="*.tsx" --include="*.ts"
   ```

2. **Listar archivos que usan componentes de \_template**

   - Anotar qué componentes usa cada archivo
   - Identificar personalizaciones necesarias

3. **Crear backup de seguridad**
   ```bash
   cp -r app/_template /backup/_template_$(date +%Y%m%d_%H%M%S)
   ```

### Fase 2: Migración de componentes

4. **Crear estructura de componentes propios** (ver sección siguiente)

5. **Migrar componentes uno por uno**

   - Copiar componente de `_template/components/` a `app/components/layout/`
   - Personalizar según necesidades
   - Actualizar imports en archivos que lo usan

6. **Migrar recursos auxiliares**
   - Mover imágenes necesarias a `public/images/`
   - Integrar estilos en tu sistema de estilos
   - Migrar contenido/metadatos necesarios

### Fase 3: Actualización de imports

7. **Actualizar todos los imports**

   ```typescript
   // Antes
   import Header from "../../_template/components/header";

   // Después
   import Header from "@/components/layout/Header";
   ```

8. **Verificar funcionamiento**
   - Probar todas las páginas que usaban componentes de \_template
   - Verificar que no hay errores de compilación

### Fase 4: Limpieza

9. **Eliminar carpeta \_template**

   ```bash
   rm -rf app/_template
   ```

10. **Limpiar dependencias no utilizadas**
    - Revisar y limpiar imports no utilizados
    - Actualizar documentación

---

## Estructura recomendada para componentes propios

```
app/
├── components/                           # Componentes globales reutilizables
│   ├── ui/                              # Componentes básicos de UI
│   │   ├── Button/
│   │   │   ├── Button.tsx
│   │   │   ├── Button.module.css
│   │   │   └── index.ts
│   │   ├── Input/
│   │   │   ├── Input.tsx
│   │   │   ├── Input.module.css
│   │   │   └── index.ts
│   │   ├── Modal/
│   │   ├── Card/
│   │   └── index.ts                     # Barrel exports
│   ├── layout/                          # Componentes de layout
│   │   ├── Header/
│   │   │   ├── Header.tsx
│   │   │   ├── Header.module.css
│   │   │   └── index.ts
│   │   ├── Footer/
│   │   │   ├── Footer.tsx
│   │   │   ├── Footer.module.css
│   │   │   └── index.ts
│   │   ├── Navigation/
│   │   ├── Sidebar/
│   │   └── index.ts
│   ├── shared/                          # Componentes compartidos específicos
│   │   ├── UserProfile/
│   │   ├── SearchBar/
│   │   ├── LoadingSpinner/
│   │   └── index.ts
│   ├── forms/                           # Componentes de formularios
│   │   ├── ContactForm/
│   │   ├── LoginForm/
│   │   └── index.ts
│   └── index.ts                         # Barrel export principal
├── hooks/                               # Custom hooks
│   ├── useAuth.ts
│   ├── useLocalStorage.ts
│   └── index.ts
├── lib/                                 # Utilidades y configuraciones
│   ├── utils.ts
│   ├── constants.ts
│   ├── validations.ts
│   └── api.ts
├── types/                               # Definiciones de tipos TypeScript
│   ├── auth.ts
│   ├── api.ts
│   └── index.ts
├── styles/                              # Estilos globales
│   ├── globals.css
│   ├── components.css
│   └── variables.css
└── (pages-footer)/                      # Grupos de rutas específicas
    └── components/                      # Componentes específicos del grupo
        ├── PageFooterLayout/
        └── index.ts
```

### Convenciones de nomenclatura

- **Componentes**: PascalCase (`Header.tsx`, `UserProfile.tsx`)
- **Archivos**: kebab-case para utilidades (`use-auth.ts`, `api-client.ts`)
- **Carpetas**: PascalCase para componentes, kebab-case para otros
- **CSS Modules**: `ComponentName.module.css`

### Barrel exports (index.ts)

```typescript
// app/components/ui/index.ts
export { default as Button } from "./Button";
export { default as Input } from "./Input";
export { default as Modal } from "./Modal";

// app/components/layout/index.ts
export { default as Header } from "./Header";
export { default as Footer } from "./Footer";
export { default as Navigation } from "./Navigation";

// app/components/index.ts
export * from "./ui";
export * from "./layout";
export * from "./shared";
export * from "./forms";
```

---

## Migración paso a paso

### Ejemplo práctico: Migrar Header

#### Paso 1: Crear estructura

```bash
mkdir -p app/components/layout/Header
```

#### Paso 2: Copiar y personalizar

```typescript
// app/components/layout/Header/Header.tsx
import React from "react";
import styles from "./Header.module.css";

// Copiar contenido de _template/components/header.tsx
// Personalizar según necesidades

const Header: React.FC = () => {
	// Tu implementación personalizada
};

export default Header;
```

#### Paso 3: Crear barrel export

```typescript
// app/components/layout/Header/index.ts
export { default } from "./Header";
```

#### Paso 4: Actualizar imports

```typescript
// Antes
import Header from "../../_template/components/header";

// Después
import Header from "@/components/layout/Header";
// O usando barrel export
import { Header } from "@/components/layout";
```

### Configuración de alias (tsconfig.json)

```json
{
	"compilerOptions": {
		"paths": {
			"@/*": ["./*"],
			"@/components/*": ["./app/components/*"],
			"@/lib/*": ["./app/lib/*"],
			"@/hooks/*": ["./app/hooks/*"],
			"@/types/*": ["./app/types/*"]
		}
	}
}
```

---

## Verificación post-migración

### Checklist de verificación

- [ ] **Compilación exitosa**: `pnpm build` sin errores
- [ ] **Desarrollo funcional**: `pnpm dev` funciona correctamente
- [ ] **Todas las páginas cargan**: Verificar rutas que usaban \_template
- [ ] **Estilos correctos**: Los componentes se ven como antes
- [ ] **Funcionalidad intacta**: Todas las funciones siguen funcionando
- [ ] **No hay imports rotos**: No quedan referencias a \_template
- [ ] **Tests pasan**: Si tienes tests, deben seguir pasando

### Comandos de verificación

```bash
# Verificar que no quedan referencias a _template
grep -r "_template" app/ --include="*.tsx" --include="*.ts"

# Verificar compilación
pnpm build

# Verificar desarrollo
pnpm dev

# Verificar tipos TypeScript
pnpm type-check  # Si tienes este script
```

### Solución de problemas comunes

1. **Error de imports**: Verificar rutas y alias en tsconfig.json
2. **Estilos rotos**: Asegurar que los CSS modules están correctamente importados
3. **Tipos faltantes**: Migrar definiciones de tipos de \_template si es necesario
4. **Imágenes no cargan**: Verificar que las imágenes están en public/ y las rutas son correctas

---

## Notas para LLMs

### Cuándo usar este documento

- Cuando un proyecto tenga una carpeta `_template` y se quiera independizar
- Para entender la estructura de un starter template de Next.js + Clerk
- Al migrar de código de ejemplo a código de producción

### Puntos clave para recordar

1. La carpeta `_template` es **temporal** y **removible**
2. Los componentes son **funcionales** pero están pensados como **ejemplos**
3. La migración debe ser **gradual** y **verificada** en cada paso
4. La nueva estructura debe seguir **convenciones de Next.js** y **mejores prácticas**
5. Siempre hacer **backup** antes de eliminar \_template

### Comandos esenciales

```bash
# Buscar dependencias
grep -r "_template" app/

# Crear backup
cp -r app/_template /backup/_template_$(date +%Y%m%d_%H%M%S)

# Verificar migración
pnpm build && pnpm dev
```

Este documento debe ser actualizado según las necesidades específicas del proyecto y las personalizaciones realizadas.
