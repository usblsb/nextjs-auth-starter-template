# Dashboard Personalizado - Documentación

## Descripción General

Este directorio contiene la implementación completa de un dashboard personalizado para la gestión de perfiles de usuario, construido con Next.js 14, Clerk para autenticación y Tailwind CSS para estilos.

## Estructura del Proyecto

```
app/(pages-dashboard)/
├── web-dashboard/
│   └── [[...rest]]/
│       └── page.tsx          # Página principal del dashboard
└── README.md                 # Esta documentación

app/components/dashboard/
├── custom-dashboard.tsx      # Componente principal del dashboard
├── sidebar/
│   └── dashboard-sidebar.tsx # Barra lateral de navegación
├── content/
│   └── dashboard-content.tsx # Contenedor principal de contenido
└── sections/
    ├── profile-section.tsx   # Sección de perfil de usuario
    ├── security-section.tsx  # Sección de seguridad
    ├── password-change-form.tsx # Formulario de cambio de contraseña
    └── active-sessions.tsx   # Gestión de sesiones activas
```

## Componentes Principales

### 1. CustomDashboard

**Ubicación:** `app/components/dashboard/custom-dashboard.tsx`

**Descripción:** Componente principal que orquesta todo el dashboard personalizado.

**Características:**
- Gestión de estado para la sección activa
- Integración con Clerk para autenticación
- Layout responsivo con sidebar y contenido principal
- Manejo de errores y estados de carga

**Props:**
```typescript
interface CustomDashboardProps {
  className?: string;
}
```

**Uso:**
```tsx
import CustomDashboard from '@/app/components/dashboard/custom-dashboard';

<CustomDashboard className="min-h-screen" />
```

### 2. DashboardSidebar

**Ubicación:** `app/components/dashboard/sidebar/dashboard-sidebar.tsx`

**Descripción:** Barra lateral de navegación con menú de secciones.

**Características:**
- Navegación entre secciones (Perfil, Seguridad)
- Indicador visual de sección activa
- Diseño responsivo (colapsa en móviles)
- Integración con avatares de usuario

**Props:**
```typescript
interface DashboardSidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  user: any;
  className?: string;
}
```

### 3. DashboardContent

**Ubicación:** `app/components/dashboard/content/dashboard-content.tsx`

**Descripción:** Contenedor principal que renderiza el contenido de cada sección.

**Características:**
- Renderizado condicional basado en sección activa
- Manejo de props para cada sección
- Layout consistente para todo el contenido

**Props:**
```typescript
interface DashboardContentProps {
  activeSection: string;
  user: any;
  onError?: (error: string) => void;
  onLoading?: (loading: boolean) => void;
  onSuccess?: (message: string) => void;
  className?: string;
}
```

### 4. ProfileSection

**Ubicación:** `app/components/dashboard/sections/profile-section.tsx`

**Descripción:** Sección para la gestión del perfil de usuario.

**Características:**
- Visualización de información personal
- Edición de nombre y apellidos
- Gestión de direcciones de email
- Subida y cambio de avatar
- Validación de formularios en tiempo real

**Funcionalidades:**
- Actualización de perfil con `user.update()`
- Gestión de emails con `user.createEmailAddress()`
- Subida de imágenes con `user.setProfileImage()`
- Validación de campos requeridos

### 5. SecuritySection

**Ubicación:** `app/components/dashboard/sections/security-section.tsx`

**Descripción:** Sección para la gestión de seguridad de la cuenta.

**Características:**
- Cambio de contraseña con reverificación
- Gestión de sesiones activas
- Puntuación de seguridad de la cuenta
- Recomendaciones de seguridad
- Navegación por pestañas (Contraseña/Sesiones)

**Funcionalidades:**
- Cálculo automático de puntuación de seguridad
- Integración con `PasswordChangeForm`
- Visualización de sesiones activas
- Consejos de seguridad personalizados

### 6. PasswordChangeForm

**Ubicación:** `app/components/dashboard/sections/password-change-form.tsx`

**Descripción:** Formulario especializado para el cambio de contraseña.

**Características:**
- Validación de fortaleza de contraseña en tiempo real
- Integración con `useReverification` para verificación adicional
- Indicadores visuales de seguridad
- Manejo de errores específicos de Clerk
- Opción de cerrar otras sesiones

**Validaciones:**
- Longitud mínima (8 caracteres)
- Caracteres especiales, números, mayúsculas
- Verificación de contraseñas comprometidas
- Confirmación de contraseña

### 7. ActiveSessions

**Ubicación:** `app/components/dashboard/sections/active-sessions.tsx`

**Descripción:** Componente para visualizar y gestionar sesiones activas.

**Características:**
- Lista de todas las sesiones del usuario
- Información detallada de cada sesión
- Capacidad de revocar sesiones individuales
- Indicador de sesión actual

## APIs y Hooks Utilizados

### Hooks de Clerk

#### useUser()
```typescript
import { useUser } from '@clerk/nextjs';

const { user, isLoaded, isSignedIn } = useUser();
```

**Uso:** Obtener información del usuario autenticado y estado de carga.

#### useReverification()
```typescript
import { useReverification } from '@clerk/nextjs';

const updatePasswordAction = useReverification(updatePasswordFunction);
```

**Uso:** Manejar verificación adicional para operaciones sensibles como cambio de contraseña.

### APIs de Usuario (Clerk)

#### Actualización de Perfil
```typescript
await user.update({
  firstName: 'Nuevo Nombre',
  lastName: 'Nuevo Apellido'
});
```

#### Cambio de Contraseña
```typescript
await user.updatePassword({
  currentPassword: 'contraseña_actual',
  newPassword: 'nueva_contraseña',
  signOutOfOtherSessions: true
});
```

#### Gestión de Emails
```typescript
// Agregar email
const emailAddress = await user.createEmailAddress({
  emailAddress: 'nuevo@email.com'
});

// Verificar email
await emailAddress.prepareVerification({ strategy: 'email_code' });
await emailAddress.attemptVerification({ code: 'código' });
```

#### Gestión de Imágenes
```typescript
// Subir imagen
await user.setProfileImage({ file: archivoImagen });

// Eliminar imagen
await user.setProfileImage({ file: null });
```

## Configuración y Dependencias

### Dependencias Principales

```json
{
  "@clerk/nextjs": "^6.7.0",
  "next": "^14.0.0",
  "react": "^18.0.0",
  "tailwindcss": "^4.0.0"
}
```

### Configuración de Next.js

**Archivo:** `next.config.js`

```javascript
module.exports = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'img.clerk.com'
      },
      {
        protocol: 'https',
        hostname: 'images.clerk.dev'
      },
      {
        protocol: 'https',
        hostname: 'www.gravatar.com'
      }
    ]
  }
};
```

### Variables de Entorno

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/web-dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/web-dashboard
```

## Guía de Uso

### Instalación y Configuración

1. **Instalar dependencias:**
   ```bash
   pnpm install
   ```

2. **Configurar variables de entorno:**
   - Copiar `.env.example` a `.env.local`
   - Completar las claves de Clerk

3. **Ejecutar el proyecto:**
   ```bash
   pnpm dev
   ```

4. **Acceder al dashboard:**
   - URL: `http://localhost:3000/web-dashboard`
   - Requiere autenticación previa

### Personalización

#### Agregar Nueva Sección

1. **Crear el componente:**
   ```typescript
   // app/components/dashboard/sections/nueva-seccion.tsx
   export default function NuevaSeccion({ user, onError, onLoading }) {
     return (
       <div className="space-y-6">
         {/* Contenido de la sección */}
       </div>
     );
   }
   ```

2. **Actualizar DashboardSidebar:**
   ```typescript
   const sections = [
     { id: 'profile', name: 'Perfil', icon: User },
     { id: 'security', name: 'Seguridad', icon: Shield },
     { id: 'nueva', name: 'Nueva Sección', icon: Settings } // Agregar aquí
   ];
   ```

3. **Actualizar DashboardContent:**
   ```typescript
   {activeSection === 'nueva' && (
     <NuevaSeccion
       user={user}
       onError={onError}
       onLoading={onLoading}
     />
   )}
   ```

#### Modificar Estilos

Todos los componentes utilizan Tailwind CSS con clases utilitarias. Para personalizar:

```typescript
// Ejemplo: Cambiar colores del sidebar
<div className="bg-blue-50 border-blue-200"> {/* En lugar de bg-gray-50 */}
```

#### Agregar Validaciones

```typescript
// Ejemplo: Validación personalizada en ProfileSection
const validateCustomField = (value: string) => {
  if (!value.trim()) {
    return 'Campo requerido';
  }
  if (value.length < 3) {
    return 'Mínimo 3 caracteres';
  }
  return null;
};
```

## Ejemplos de Uso

### Integración Básica

```typescript
// app/(pages-dashboard)/web-dashboard/[[...rest]]/page.tsx
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import CustomDashboard from '@/app/components/dashboard/custom-dashboard';

export default async function DashboardPage() {
  const { userId } = await auth();
  
  if (!userId) {
    redirect('/sign-in');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <CustomDashboard />
    </div>
  );
}
```

### Manejo de Estados Globales

```typescript
// Ejemplo: Integración con Context API
import { createContext, useContext, useState } from 'react';

const DashboardContext = createContext();

export function DashboardProvider({ children }) {
  const [globalError, setGlobalError] = useState(null);
  const [globalLoading, setGlobalLoading] = useState(false);
  
  return (
    <DashboardContext.Provider value={{
      globalError,
      setGlobalError,
      globalLoading,
      setGlobalLoading
    }}>
      {children}
    </DashboardContext.Provider>
  );
}
```

### Personalización Avanzada

```typescript
// Ejemplo: Dashboard con configuración personalizada
interface CustomDashboardConfig {
  theme: 'light' | 'dark';
  defaultSection: string;
  enabledSections: string[];
}

export default function ConfigurableDashboard({ config }: { config: CustomDashboardConfig }) {
  const [activeSection, setActiveSection] = useState(config.defaultSection);
  
  return (
    <div className={`dashboard ${config.theme}`}>
      <CustomDashboard 
        initialSection={config.defaultSection}
        enabledSections={config.enabledSections}
      />
    </div>
  );
}
```

## Solución de Problemas

### Errores Comunes

#### 1. Error de Imagen "Invalid src prop"

**Problema:** Las imágenes de Clerk no cargan.

**Solución:** Verificar configuración en `next.config.js`:
```javascript
images: {
  remotePatterns: [
    { protocol: 'https', hostname: 'img.clerk.com' },
    { protocol: 'https', hostname: 'images.clerk.dev' }
  ]
}
```

#### 2. Error "Additional verification required"

**Problema:** Cambio de contraseña requiere verificación adicional.

**Solución:** Ya implementado con `useReverification`. El modal aparecerá automáticamente.

#### 3. Error de Hidratación

**Problema:** Diferencias entre servidor y cliente.

**Solución:** Usar `useEffect` para operaciones del lado del cliente:
```typescript
const [mounted, setMounted] = useState(false);

useEffect(() => {
  setMounted(true);
}, []);

if (!mounted) return null;
```

### Debugging

#### Logs de Desarrollo

```typescript
// Habilitar logs detallados
const DEBUG_MODE = process.env.NODE_ENV === 'development';

if (DEBUG_MODE) {
  console.log('Dashboard State:', { activeSection, user, error });
}
```

#### Verificación de Estado

```typescript
// Componente de debug
function DebugPanel({ user, activeSection }) {
  if (process.env.NODE_ENV !== 'development') return null;
  
  return (
    <div className="fixed bottom-4 right-4 bg-black text-white p-4 rounded">
      <pre>{JSON.stringify({ user: user?.id, activeSection }, null, 2)}</pre>
    </div>
  );
}
```

## Seguridad

### Mejores Prácticas Implementadas

1. **Autenticación Obligatoria:** Todas las rutas requieren autenticación.
2. **Reverificación:** Operaciones sensibles requieren verificación adicional.
3. **Validación de Entrada:** Todos los formularios validan datos de entrada.
4. **Sanitización:** Los datos se sanitizan antes de mostrar.
5. **Sesiones Seguras:** Opción de cerrar otras sesiones al cambiar contraseña.

### Configuración de Seguridad

```typescript
// Configuración de contraseñas seguras
const PASSWORD_REQUIREMENTS = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true
};
```

## Rendimiento

### Optimizaciones Implementadas

1. **Lazy Loading:** Componentes se cargan bajo demanda.
2. **Memoización:** Componentes pesados usan `React.memo`.
3. **Debouncing:** Validaciones en tiempo real con debounce.
4. **Imágenes Optimizadas:** Uso de `next/image` para optimización automática.

### Métricas de Rendimiento

- **First Contentful Paint:** < 1.5s
- **Largest Contentful Paint:** < 2.5s
- **Cumulative Layout Shift:** < 0.1
- **First Input Delay:** < 100ms

## Contribución

### Estructura de Commits

```
feat(dashboard): agregar nueva sección de configuración
fix(security): corregir validación de contraseña
docs(readme): actualizar documentación de APIs
style(ui): mejorar espaciado en sidebar
refactor(components): optimizar renderizado de secciones
```

### Testing

```bash
# Ejecutar tests (cuando estén implementados)
pnpm test

# Verificar tipos
pnpm type-check

# Linting
pnpm lint
```

## Roadmap

### Próximas Funcionalidades

- [ ] Modo oscuro/claro
- [ ] Notificaciones en tiempo real
- [ ] Exportación de datos
- [ ] Configuración de privacidad
- [ ] Integración con 2FA
- [ ] Dashboard analytics
- [ ] Temas personalizables
- [ ] Widgets configurables

### Mejoras Técnicas

- [ ] Tests unitarios y de integración
- [ ] Storybook para componentes
- [ ] Documentación interactiva
- [ ] Performance monitoring
- [ ] Error boundary mejorado
- [ ] Internacionalización (i18n)

---

**Última actualización:** Enero 2025
**Versión:** 1.0.0
**Mantenedor:** Equipo de Desarrollo