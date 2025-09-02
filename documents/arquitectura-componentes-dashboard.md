# Arquitectura de Componentes - Dashboard Manual Personalizado

## 1. Visión General de la Arquitectura

### Principios de Diseño
1. **Separación de Responsabilidades**: Cada componente tiene una función específica
2. **Reutilización**: Componentes modulares y reutilizables
3. **Mantenibilidad**: Código limpio y bien documentado
4. **Escalabilidad**: Fácil agregar nuevas secciones
5. **Consistencia**: Diseño uniforme con el resto de la aplicación

### Estructura de Carpetas Propuesta
```
app/(pages-dashboard)/web-dashboard/components/
├── dashboard/
│   ├── custom-dashboard.tsx           # Componente principal
│   ├── dashboard-sidebar.tsx          # Navegación lateral
│   ├── dashboard-content.tsx          # Contenedor de contenido
│   └── sections/
│       ├── profile-section.tsx        # Sección de perfil
│       ├── security-section.tsx       # Sección de seguridad
│       ├── password-change-form.tsx   # Formulario cambio contraseña
│       └── active-sessions.tsx        # Gestión de sesiones
└── ui/
    ├── loading-spinner.tsx            # Componente de carga
    ├── error-message.tsx              # Componente de error
    └── confirmation-modal.tsx         # Modal de confirmación
```

## 2. Jerarquía de Componentes

```
CustomDashboard (Componente Raíz)
├── DashboardSidebar
│   ├── SidebarNavItem (Profile)
│   └── SidebarNavItem (Security)
└── DashboardContent
    ├── ProfileSection
    │   ├── UserAvatar
    │   ├── UserInfo
    │   └── EditProfileForm
    └── SecuritySection
        ├── PasswordChangeForm
        └── ActiveSessions
            ├── SessionItem (x N)
            └── ConfirmationModal
```

## 3. Especificación de Componentes

### 3.1 CustomDashboard (Componente Principal)

**Archivo:** `custom-dashboard.tsx`

**Responsabilidades:**
- Gestión del estado global del dashboard
- Manejo de autenticación y carga
- Coordinación entre sidebar y contenido
- Aplicación de estilos de apariencia

**Props Interface:**
```typescript
interface CustomDashboardProps {
  appearance?: {
    elements?: Record<string, string>;
    variables?: Record<string, string>;
  };
}
```

**Estados Internos:**
```typescript
interface DashboardState {
  activeSection: 'profile' | 'security';
  isLoading: boolean;
  error: string | null;
}
```

**Hooks Utilizados:**
- `useUser()` - Información del usuario
- `useState()` - Estado local del dashboard
- `useCallback()` - Optimización de funciones

### 3.2 DashboardSidebar (Navegación)

**Archivo:** `dashboard-sidebar.tsx`

**Responsabilidades:**
- Renderizar menú de navegación
- Manejar cambios de sección activa
- Mostrar indicadores visuales de sección activa

**Props Interface:**
```typescript
interface DashboardSidebarProps {
  activeSection: 'profile' | 'security';
  onSectionChange: (section: 'profile' | 'security') => void;
  className?: string;
}
```

**Estructura del Menú:**
```typescript
const menuItems = [
  {
    id: 'profile',
    label: 'Perfil',
    icon: 'UserIcon',
    description: 'Información personal'
  },
  {
    id: 'security',
    label: 'Seguridad',
    icon: 'ShieldIcon',
    description: 'Contraseña y sesiones'
  }
];
```

### 3.3 DashboardContent (Contenedor de Contenido)

**Archivo:** `dashboard-content.tsx`

**Responsabilidades:**
- Renderizar la sección activa
- Manejar transiciones entre secciones
- Aplicar estilos de contenedor

**Props Interface:**
```typescript
interface DashboardContentProps {
  activeSection: 'profile' | 'security';
  user: User;
  className?: string;
}
```

### 3.4 ProfileSection (Sección de Perfil)

**Archivo:** `sections/profile-section.tsx`

**Responsabilidades:**
- Mostrar información del usuario
- Renderizar avatar y datos personales
- Mostrar fechas de registro y último acceso

**Props Interface:**
```typescript
interface ProfileSectionProps {
  user: User;
  className?: string;
}
```

**Información Mostrada:**
```typescript
const profileData = {
  avatar: user.imageUrl,
  fullName: user.fullName || `${user.firstName} ${user.lastName}`,
  email: user.primaryEmailAddress?.emailAddress,
  userId: user.id,
  createdAt: user.createdAt,
  lastSignInAt: user.lastSignInAt
};
```

### 3.5 SecuritySection (Sección de Seguridad)

**Archivo:** `sections/security-section.tsx`

**Responsabilidades:**
- Contenedor para funcionalidades de seguridad
- Coordinar formulario de contraseña y sesiones
- Manejar estados de carga de operaciones de seguridad

**Props Interface:**
```typescript
interface SecuritySectionProps {
  user: User;
  className?: string;
}
```

**Componentes Hijos:**
- `PasswordChangeForm`
- `ActiveSessions`

### 3.6 PasswordChangeForm (Cambio de Contraseña)

**Archivo:** `sections/password-change-form.tsx`

**Responsabilidades:**
- Formulario para cambiar contraseña
- Validación de contraseña actual
- Manejo de errores y éxito
- Confirmación de cambio

**Props Interface:**
```typescript
interface PasswordChangeFormProps {
  user: User;
  onPasswordChanged?: () => void;
  className?: string;
}
```

**Estados del Formulario:**
```typescript
interface PasswordFormState {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
  isSubmitting: boolean;
  error: string | null;
  success: boolean;
}
```

**Validaciones:**
- Contraseña actual requerida
- Nueva contraseña mínimo 8 caracteres
- Confirmación debe coincidir
- Contraseña nueva debe ser diferente a la actual

### 3.7 ActiveSessions (Gestión de Sesiones)

**Archivo:** `sections/active-sessions.tsx`

**Responsabilidades:**
- Listar todas las sesiones activas
- Mostrar información de cada sesión
- Permitir revocar sesiones
- Confirmar antes de revocar

**Props Interface:**
```typescript
interface ActiveSessionsProps {
  className?: string;
}
```

**Hooks Utilizados:**
- `useSessionList()` - Lista de sesiones
- `useState()` - Estado local
- `useCallback()` - Optimización

**Estados Internos:**
```typescript
interface SessionsState {
  isLoading: boolean;
  error: string | null;
  revokingSessionId: string | null;
  showConfirmModal: boolean;
  sessionToRevoke: Session | null;
}
```

**Información por Sesión:**
```typescript
interface SessionDisplayData {
  id: string;
  isCurrent: boolean;
  lastActiveAt: Date;
  expireAt: Date;
  status: string;
  deviceInfo?: string; // Si está disponible
}
```

## 4. Flujo de Datos y Estados

### 4.1 Flujo de Autenticación
```
1. CustomDashboard verifica useUser()
2. Si !isLoaded → Mostrar LoadingSpinner
3. Si !isSignedIn → Mostrar mensaje de error
4. Si autenticado → Renderizar dashboard completo
```

### 4.2 Flujo de Navegación
```
1. Usuario hace clic en sidebar
2. DashboardSidebar llama onSectionChange
3. CustomDashboard actualiza activeSection
4. DashboardContent renderiza nueva sección
```

### 4.3 Flujo de Cambio de Contraseña
```
1. Usuario completa formulario
2. PasswordChangeForm valida datos
3. Llama user.updatePassword()
4. Maneja respuesta (éxito/error)
5. Muestra feedback al usuario
```

### 4.4 Flujo de Revocación de Sesión
```
1. Usuario hace clic en "Revocar"
2. ActiveSessions muestra modal de confirmación
3. Usuario confirma acción
4. Llama session.revoke()
5. Actualiza lista de sesiones
6. Muestra feedback
```

## 5. Gestión de Estados

### 5.1 Estados Globales (CustomDashboard)
```typescript
const [dashboardState, setDashboardState] = useState({
  activeSection: 'profile' as const,
  isLoading: false,
  error: null
});
```

### 5.2 Estados Locales por Componente

**PasswordChangeForm:**
```typescript
const [formData, setFormData] = useState({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
});
const [formState, setFormState] = useState({
  isSubmitting: false,
  error: null,
  success: false
});
```

**ActiveSessions:**
```typescript
const [sessionsState, setSessionsState] = useState({
  revokingSessionId: null,
  showConfirmModal: false,
  sessionToRevoke: null
});
```

## 6. Manejo de Errores

### 6.1 Tipos de Errores
1. **Errores de Autenticación**: Usuario no autenticado
2. **Errores de Red**: Fallos en llamadas a API
3. **Errores de Validación**: Datos de formulario inválidos
4. **Errores de Clerk**: Errores específicos de la plataforma

### 6.2 Estrategias de Manejo
```typescript
interface ErrorHandling {
  // Errores globales
  dashboardError: string | null;
  
  // Errores específicos por componente
  passwordError: string | null;
  sessionsError: string | null;
  
  // Funciones de manejo
  handleError: (error: Error, context: string) => void;
  clearError: (context: string) => void;
}
```

## 7. Optimizaciones de Rendimiento

### 7.1 Memoización
```typescript
// Componentes memoizados
const MemoizedSidebar = React.memo(DashboardSidebar);
const MemoizedContent = React.memo(DashboardContent);

// Callbacks memoizados
const handleSectionChange = useCallback((section) => {
  setActiveSection(section);
}, []);
```

### 7.2 Lazy Loading
```typescript
// Carga diferida de secciones
const ProfileSection = lazy(() => import('./sections/profile-section'));
const SecuritySection = lazy(() => import('./sections/security-section'));
```

## 8. Accesibilidad (a11y)

### 8.1 Navegación por Teclado
- Tab navigation en sidebar
- Enter/Space para activar elementos
- Escape para cerrar modales

### 8.2 ARIA Labels
```typescript
const ariaLabels = {
  sidebar: 'Navegación del dashboard',
  profileSection: 'Sección de perfil de usuario',
  securitySection: 'Sección de seguridad',
  passwordForm: 'Formulario de cambio de contraseña',
  sessionsList: 'Lista de sesiones activas'
};
```

### 8.3 Indicadores Visuales
- Estados de focus claramente visibles
- Indicadores de carga accesibles
- Mensajes de error descriptivos

## 9. Testing Strategy

### 9.1 Unit Tests
- Cada componente individual
- Funciones de validación
- Manejo de estados

### 9.2 Integration Tests
- Flujo completo de navegación
- Cambio de contraseña end-to-end
- Revocación de sesiones

### 9.3 Accessibility Tests
- Navegación por teclado
- Screen reader compatibility
- Color contrast

---

**Estado de la Arquitectura:** ✅ Definida  
**Componentes Totales:** 8 principales + 3 utilidades  
**Siguiente Paso:** Planificación del flujo de datos detallado