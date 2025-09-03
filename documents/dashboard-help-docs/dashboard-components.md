# Documentación de Componentes del Dashboard

## Introducción

Este documento proporciona documentación detallada de todos los componentes que conforman el dashboard personalizado, incluyendo sus APIs, props, estados internos y ejemplos de uso.

## Arquitectura de Componentes

### Jerarquía de Componentes

```
CustomDashboard (Componente raíz)
├── DashboardSidebar (Navegación)
│   ├── UserProfile (Avatar y nombre)
│   └── NavigationMenu (Lista de secciones)
└── DashboardContent (Contenido principal)
    ├── ProfileSection (Gestión de perfil)
    │   ├── PersonalInfoForm
    │   ├── EmailManagement
    │   └── AvatarUpload
    └── SecuritySection (Gestión de seguridad)
        ├── PasswordChangeForm
        └── ActiveSessions
```

## Componentes Principales

### CustomDashboard

**Archivo:** `app/components/dashboard/custom-dashboard.tsx`

#### Descripción
Componente raíz que orquesta todo el dashboard. Maneja el estado global, la navegación entre secciones y la comunicación entre componentes hijos.

#### Props
```typescript
interface CustomDashboardProps {
  className?: string;
  initialSection?: string;
  onSectionChange?: (section: string) => void;
}
```

#### Estado Interno
```typescript
interface DashboardState {
  activeSection: string;
  globalError: string | null;
  globalSuccess: string | null;
  isLoading: boolean;
}
```

#### Métodos Públicos
- `handleSectionChange(section: string)`: Cambia la sección activa
- `handleError(error: string)`: Maneja errores globales
- `handleSuccess(message: string)`: Maneja mensajes de éxito
- `handleLoading(loading: boolean)`: Controla el estado de carga

#### Ejemplo de Uso
```tsx
import CustomDashboard from '@/app/components/dashboard/custom-dashboard';

// Uso básico
<CustomDashboard />

// Con configuración personalizada
<CustomDashboard 
  className="min-h-screen bg-gray-100"
  initialSection="security"
  onSectionChange={(section) => console.log('Sección cambiada:', section)}
/>
```

### DashboardSidebar

**Archivo:** `app/components/dashboard/sidebar/dashboard-sidebar.tsx`

#### Descripción
Barra lateral de navegación que muestra el perfil del usuario y las opciones de navegación entre secciones.

#### Props
```typescript
interface DashboardSidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  user: User | null;
  className?: string;
}
```

#### Secciones Disponibles
```typescript
const sections = [
  {
    id: 'profile',
    name: 'Perfil',
    icon: User,
    description: 'Gestiona tu información personal'
  },
  {
    id: 'security',
    name: 'Seguridad',
    icon: Shield,
    description: 'Configura la seguridad de tu cuenta'
  }
];
```

#### Características
- **Responsive Design**: Se colapsa en dispositivos móviles
- **Avatar Dinámico**: Muestra la imagen del usuario o iniciales
- **Indicadores Visuales**: Resalta la sección activa
- **Accesibilidad**: Soporte completo para navegación por teclado

#### Ejemplo de Uso
```tsx
<DashboardSidebar
  activeSection={activeSection}
  onSectionChange={setActiveSection}
  user={user}
  className="w-64 bg-white shadow-lg"
/>
```

### DashboardContent

**Archivo:** `app/components/dashboard/content/dashboard-content.tsx`

#### Descripción
Contenedor principal que renderiza el contenido de la sección activa y maneja la comunicación con los componentes de sección.

#### Props
```typescript
interface DashboardContentProps {
  activeSection: string;
  user: User | null;
  onError?: (error: string) => void;
  onLoading?: (loading: boolean) => void;
  onSuccess?: (message: string) => void;
  className?: string;
}
```

#### Renderizado Condicional
```typescript
const renderSection = () => {
  switch (activeSection) {
    case 'profile':
      return <ProfileSection {...sectionProps} />;
    case 'security':
      return <SecuritySection {...sectionProps} />;
    default:
      return <ProfileSection {...sectionProps} />;
  }
};
```

## Componentes de Sección

### ProfileSection

**Archivo:** `app/components/dashboard/sections/profile-section.tsx`

#### Descripción
Sección completa para la gestión del perfil de usuario, incluyendo información personal, emails y avatar.

#### Props
```typescript
interface ProfileSectionProps {
  user: User;
  onError: (error: string) => void;
  onLoading: (loading: boolean) => void;
  onSuccess: (message: string) => void;
}
```

#### Estado Interno
```typescript
interface ProfileState {
  formData: {
    firstName: string;
    lastName: string;
  };
  emailData: {
    newEmail: string;
    verificationCode: string;
  };
  isEditing: boolean;
  isAddingEmail: boolean;
  isVerifyingEmail: boolean;
  pendingEmailId: string | null;
  errors: Record<string, string>;
}
```

#### Funcionalidades Principales

##### 1. Actualización de Información Personal
```typescript
const handleUpdateProfile = async () => {
  try {
    await user.update({
      firstName: formData.firstName,
      lastName: formData.lastName
    });
    onSuccess('Perfil actualizado correctamente');
  } catch (error) {
    onError('Error al actualizar el perfil');
  }
};
```

##### 2. Gestión de Emails
```typescript
const handleAddEmail = async () => {
  try {
    const emailAddress = await user.createEmailAddress({
      emailAddress: emailData.newEmail
    });
    await emailAddress.prepareVerification({ strategy: 'email_code' });
    setPendingEmailId(emailAddress.id);
  } catch (error) {
    onError('Error al agregar email');
  }
};
```

##### 3. Subida de Avatar
```typescript
const handleAvatarUpload = async (file: File) => {
  try {
    await user.setProfileImage({ file });
    onSuccess('Avatar actualizado correctamente');
  } catch (error) {
    onError('Error al subir la imagen');
  }
};
```

#### Validaciones
```typescript
const validateForm = () => {
  const newErrors: Record<string, string> = {};
  
  if (!formData.firstName.trim()) {
    newErrors.firstName = 'El nombre es requerido';
  }
  
  if (!formData.lastName.trim()) {
    newErrors.lastName = 'El apellido es requerido';
  }
  
  return newErrors;
};
```

### SecuritySection

**Archivo:** `app/components/dashboard/sections/security-section.tsx`

#### Descripción
Sección dedicada a la gestión de seguridad de la cuenta, incluyendo cambio de contraseña y gestión de sesiones.

#### Props
```typescript
interface SecuritySectionProps {
  user: User;
  onError: (error: string) => void;
  onLoading: (loading: boolean) => void;
  onSuccess: (message: string) => void;
}
```

#### Estado Interno
```typescript
interface SecurityState {
  activeTab: 'password' | 'sessions';
  securityScore: number;
  lastPasswordChange: Date | null;
  recommendations: string[];
}
```

#### Cálculo de Puntuación de Seguridad
```typescript
const calculateSecurityScore = () => {
  let score = 0;
  
  // Verificación de email (+20 puntos)
  if (user.primaryEmailAddress?.verification?.status === 'verified') {
    score += 20;
  }
  
  // Cambio de contraseña reciente (+30 puntos)
  if (lastPasswordChange && isRecentPasswordChange(lastPasswordChange)) {
    score += 30;
  }
  
  // Múltiples emails verificados (+25 puntos)
  const verifiedEmails = user.emailAddresses.filter(
    email => email.verification?.status === 'verified'
  );
  if (verifiedEmails.length > 1) {
    score += 25;
  }
  
  // Sesiones limitadas (+25 puntos)
  if (user.sessions.length <= 2) {
    score += 25;
  }
  
  return Math.min(score, 100);
};
```

#### Recomendaciones de Seguridad
```typescript
const generateRecommendations = () => {
  const recommendations = [];
  
  if (!user.primaryEmailAddress?.verification?.status) {
    recommendations.push('Verifica tu dirección de email principal');
  }
  
  if (!isRecentPasswordChange(lastPasswordChange)) {
    recommendations.push('Considera cambiar tu contraseña regularmente');
  }
  
  if (user.sessions.length > 3) {
    recommendations.push('Revisa y cierra sesiones innecesarias');
  }
  
  return recommendations;
};
```

### PasswordChangeForm

**Archivo:** `app/components/dashboard/sections/password-change-form.tsx`

#### Descripción
Formulario especializado para el cambio de contraseña con validación en tiempo real y soporte para reverificación.

#### Props
```typescript
interface PasswordChangeFormProps {
  user: User;
  onError: (error: string) => void;
  onLoading: (loading: boolean) => void;
  onSuccess: (message: string) => void;
}
```

#### Estado del Formulario
```typescript
interface PasswordFormState {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
  signOutOtherSessions: boolean;
  showCurrentPassword: boolean;
  showNewPassword: boolean;
  showConfirmPassword: boolean;
  passwordStrength: {
    score: number;
    feedback: string[];
    isValid: boolean;
  };
  errors: Record<string, string>;
}
```

#### Validación de Fortaleza de Contraseña
```typescript
const validatePasswordStrength = (password: string) => {
  const checks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    numbers: /\d/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
  };
  
  const score = Object.values(checks).filter(Boolean).length;
  const feedback = [];
  
  if (!checks.length) feedback.push('Mínimo 8 caracteres');
  if (!checks.uppercase) feedback.push('Al menos una mayúscula');
  if (!checks.lowercase) feedback.push('Al menos una minúscula');
  if (!checks.numbers) feedback.push('Al menos un número');
  if (!checks.special) feedback.push('Al menos un carácter especial');
  
  return {
    score: (score / 5) * 100,
    feedback,
    isValid: score === 5
  };
};
```

#### Integración con useReverification
```typescript
const updatePasswordWithReverification = async () => {
  await user.updatePassword({
    currentPassword: formState.currentPassword,
    newPassword: formState.newPassword,
    signOutOfOtherSessions: formState.signOutOtherSessions
  });
};

const updatePasswordAction = useReverification(updatePasswordWithReverification);

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  if (!validateForm()) return;
  
  try {
    onLoading(true);
    await updatePasswordAction();
    onSuccess('Contraseña actualizada correctamente');
    resetForm();
  } catch (error) {
    handleClerkError(error);
  } finally {
    onLoading(false);
  }
};
```

#### Manejo de Errores de Clerk
```typescript
const handleClerkError = (error: any) => {
  const errorCode = error.errors?.[0]?.code;
  
  switch (errorCode) {
    case 'form_password_incorrect':
      onError('La contraseña actual es incorrecta');
      break;
    case 'form_password_pwned':
      onError('Esta contraseña ha sido comprometida. Elige una diferente.');
      break;
    case 'form_password_too_common':
      onError('Esta contraseña es muy común. Elige una más segura.');
      break;
    default:
      onError('Error al cambiar la contraseña. Inténtalo de nuevo.');
  }
};
```

### ActiveSessions

**Archivo:** `app/components/dashboard/sections/active-sessions.tsx`

#### Descripción
Componente para visualizar y gestionar las sesiones activas del usuario.

#### Props
```typescript
interface ActiveSessionsProps {
  user: User;
  onError: (error: string) => void;
  onLoading: (loading: boolean) => void;
  onSuccess: (message: string) => void;
}
```

#### Información de Sesión
```typescript
interface SessionInfo {
  id: string;
  status: string;
  lastActiveAt: Date;
  createdAt: Date;
  updatedAt: Date;
  isCurrent: boolean;
  device?: string;
  browser?: string;
  location?: string;
}
```

#### Funcionalidades

##### 1. Listar Sesiones
```typescript
const formatSessionInfo = (session: Session): SessionInfo => {
  return {
    id: session.id,
    status: session.status,
    lastActiveAt: new Date(session.lastActiveAt),
    createdAt: new Date(session.createdAt),
    updatedAt: new Date(session.updatedAt),
    isCurrent: session.id === user.sessions[0]?.id,
    device: parseUserAgent(session.userAgent)?.device,
    browser: parseUserAgent(session.userAgent)?.browser,
    location: session.lastActiveAt ? 'Ubicación aproximada' : 'Desconocida'
  };
};
```

##### 2. Revocar Sesión
```typescript
const handleRevokeSession = async (sessionId: string) => {
  try {
    onLoading(true);
    await user.sessions.find(s => s.id === sessionId)?.revoke();
    onSuccess('Sesión cerrada correctamente');
  } catch (error) {
    onError('Error al cerrar la sesión');
  } finally {
    onLoading(false);
  }
};
```

## Patrones de Diseño Utilizados

### 1. Compound Components
Los componentes del dashboard siguen el patrón de compound components, donde el componente padre (`CustomDashboard`) coordina múltiples componentes hijos relacionados.

### 2. Render Props
Algunos componentes utilizan render props para mayor flexibilidad:

```typescript
interface RenderPropsExample {
  children: (props: {
    user: User;
    isLoading: boolean;
    error: string | null;
  }) => React.ReactNode;
}
```

### 3. Custom Hooks
Se utilizan custom hooks para lógica reutilizable:

```typescript
// Hook personalizado para gestión de formularios
const useFormState = <T>(initialState: T) => {
  const [state, setState] = useState(initialState);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const updateField = (field: keyof T, value: any) => {
    setState(prev => ({ ...prev, [field]: value }));
    if (errors[field as string]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };
  
  return { state, errors, updateField, setErrors, setState };
};
```

### 4. Error Boundaries
Implementación de error boundaries para manejo robusto de errores:

```typescript
class DashboardErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  
  componentDidCatch(error, errorInfo) {
    console.error('Dashboard Error:', error, errorInfo);
  }
  
  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} />;
    }
    
    return this.props.children;
  }
}
```

## Optimizaciones de Rendimiento

### 1. Memoización
```typescript
// Componentes memoizados para evitar re-renders innecesarios
const MemoizedProfileSection = React.memo(ProfileSection);
const MemoizedSecuritySection = React.memo(SecuritySection);
```

### 2. Lazy Loading
```typescript
// Carga perezosa de componentes pesados
const LazyActiveSessionsChart = React.lazy(() => 
  import('./components/active-sessions-chart')
);
```

### 3. Debouncing
```typescript
// Debouncing para validaciones en tiempo real
const debouncedValidation = useCallback(
  debounce((value: string) => {
    validateField(value);
  }, 300),
  []
);
```

## Testing

### Estructura de Tests
```
tests/
├── components/
│   ├── dashboard/
│   │   ├── custom-dashboard.test.tsx
│   │   ├── dashboard-sidebar.test.tsx
│   │   └── dashboard-content.test.tsx
│   └── sections/
│       ├── profile-section.test.tsx
│       ├── security-section.test.tsx
│       └── password-change-form.test.tsx
├── hooks/
│   └── use-form-state.test.ts
└── utils/
    └── validation.test.ts
```

### Ejemplos de Tests
```typescript
// Test de componente
describe('CustomDashboard', () => {
  it('should render with default section', () => {
    render(<CustomDashboard />);
    expect(screen.getByText('Perfil')).toBeInTheDocument();
  });
  
  it('should change section when sidebar item is clicked', () => {
    render(<CustomDashboard />);
    fireEvent.click(screen.getByText('Seguridad'));
    expect(screen.getByText('Cambiar Contraseña')).toBeInTheDocument();
  });
});

// Test de hook
describe('useFormState', () => {
  it('should update field value', () => {
    const { result } = renderHook(() => useFormState({ name: '' }));
    
    act(() => {
      result.current.updateField('name', 'John');
    });
    
    expect(result.current.state.name).toBe('John');
  });
});
```

## Consideraciones de Accesibilidad

### 1. Navegación por Teclado
- Todos los elementos interactivos son accesibles por teclado
- Orden de tabulación lógico
- Indicadores visuales de foco

### 2. Lectores de Pantalla
- Etiquetas ARIA apropiadas
- Texto alternativo para imágenes
- Anuncios de cambios de estado

### 3. Contraste y Colores
- Cumplimiento con WCAG 2.1 AA
- No dependencia exclusiva del color para información

```typescript
// Ejemplo de implementación accesible
<button
  aria-label="Cambiar a sección de seguridad"
  aria-pressed={activeSection === 'security'}
  onClick={() => onSectionChange('security')}
  className="focus:ring-2 focus:ring-blue-500"
>
  <Shield aria-hidden="true" />
  Seguridad
</button>
```

## Conclusión

Esta documentación proporciona una visión completa de la arquitectura y implementación de los componentes del dashboard. Cada componente está diseñado para ser reutilizable, mantenible y accesible, siguiendo las mejores prácticas de React y Next.js.

Para más información sobre la configuración y uso del dashboard, consulta el [README principal](../app/(pages-dashboard)/README.md).