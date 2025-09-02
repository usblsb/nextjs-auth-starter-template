# Flujo de Datos y Estados - Dashboard Manual Personalizado

## 1. Visión General del Flujo de Datos

### 1.1 Principios de Gestión de Estados
1. **Single Source of Truth**: Cada dato tiene una fuente única
2. **Unidirectional Data Flow**: Los datos fluyen en una dirección
3. **Immutable Updates**: Los estados se actualizan de forma inmutable
4. **Separation of Concerns**: Estados locales vs globales bien definidos
5. **Error Boundaries**: Manejo de errores aislado por componente

### 1.2 Arquitectura de Estados
```
┌─────────────────────────────────────────────────────────────┐
│                    Clerk Context                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │   useUser   │  │ useSession  │  │   useSessionList    │ │
│  └─────────────┘  └─────────────┘  └─────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                CustomDashboard (Estado Global)             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ activeSection: 'profile' | 'security'              │   │
│  │ isLoading: boolean                                  │   │
│  │ error: string | null                               │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                    ┌─────────┴─────────┐
                    ▼                   ▼
┌─────────────────────────┐    ┌─────────────────────────┐
│   DashboardSidebar      │    │   DashboardContent      │
│   (Props Only)          │    │   (Props + Local State) │
└─────────────────────────┘    └─────────────────────────┘
                                         │
                               ┌─────────┴─────────┐
                               ▼                   ▼
                    ┌─────────────────┐    ┌─────────────────┐
                    │ ProfileSection  │    │ SecuritySection │
                    │ (Props Only)    │    │ (Local State)   │
                    └─────────────────┘    └─────────────────┘
                                                    │
                                          ┌─────────┴─────────┐
                                          ▼                   ▼
                                ┌─────────────────┐  ┌─────────────────┐
                                │PasswordChange   │  │ ActiveSessions  │
                                │ (Local State)   │  │ (Local State)   │
                                └─────────────────┘  └─────────────────┘
```

## 2. Estados por Componente

### 2.1 CustomDashboard (Estado Global)

**Ubicación:** `components/dashboard/custom-dashboard.tsx`

**Estado Global:**
```typescript
interface DashboardGlobalState {
  // Navegación
  activeSection: 'profile' | 'security';
  
  // Estados de UI
  isLoading: boolean;
  error: string | null;
  
  // Configuración
  appearance: AppearanceConfig;
}

const [globalState, setGlobalState] = useState<DashboardGlobalState>({
  activeSection: 'profile',
  isLoading: false,
  error: null,
  appearance: defaultAppearance
});
```

**Funciones de Estado:**
```typescript
// Cambio de sección
const handleSectionChange = useCallback((section: 'profile' | 'security') => {
  setGlobalState(prev => ({
    ...prev,
    activeSection: section,
    error: null // Limpiar errores al cambiar sección
  }));
}, []);

// Manejo de errores globales
const handleGlobalError = useCallback((error: string) => {
  setGlobalState(prev => ({
    ...prev,
    error,
    isLoading: false
  }));
}, []);

// Limpiar errores
const clearGlobalError = useCallback(() => {
  setGlobalState(prev => ({
    ...prev,
    error: null
  }));
}, []);
```

### 2.2 PasswordChangeForm (Estado Local)

**Ubicación:** `components/dashboard/sections/password-change-form.tsx`

**Estado del Formulario:**
```typescript
interface PasswordFormState {
  // Datos del formulario
  formData: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  };
  
  // Estados de UI
  isSubmitting: boolean;
  showCurrentPassword: boolean;
  showNewPassword: boolean;
  showConfirmPassword: boolean;
  
  // Validación y errores
  fieldErrors: {
    currentPassword?: string;
    newPassword?: string;
    confirmPassword?: string;
  };
  generalError: string | null;
  
  // Éxito
  isSuccess: boolean;
  successMessage: string | null;
}

const [passwordState, setPasswordState] = useState<PasswordFormState>({
  formData: {
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  },
  isSubmitting: false,
  showCurrentPassword: false,
  showNewPassword: false,
  showConfirmPassword: false,
  fieldErrors: {},
  generalError: null,
  isSuccess: false,
  successMessage: null
});
```

**Funciones de Validación:**
```typescript
const validateForm = useCallback((formData: PasswordFormData): ValidationResult => {
  const errors: FieldErrors = {};
  
  // Validar contraseña actual
  if (!formData.currentPassword.trim()) {
    errors.currentPassword = 'La contraseña actual es requerida';
  }
  
  // Validar nueva contraseña
  if (!formData.newPassword.trim()) {
    errors.newPassword = 'La nueva contraseña es requerida';
  } else if (formData.newPassword.length < 8) {
    errors.newPassword = 'La contraseña debe tener al menos 8 caracteres';
  } else if (formData.newPassword === formData.currentPassword) {
    errors.newPassword = 'La nueva contraseña debe ser diferente a la actual';
  }
  
  // Validar confirmación
  if (!formData.confirmPassword.trim()) {
    errors.confirmPassword = 'Confirma tu nueva contraseña';
  } else if (formData.confirmPassword !== formData.newPassword) {
    errors.confirmPassword = 'Las contraseñas no coinciden';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}, []);
```

### 2.3 ActiveSessions (Estado Local)

**Ubicación:** `components/dashboard/sections/active-sessions.tsx`

**Estado de Sesiones:**
```typescript
interface SessionsState {
  // Datos de sesiones
  sessions: Session[];
  isLoadingSessions: boolean;
  sessionsError: string | null;
  
  // Revocación de sesiones
  revokingSessionId: string | null;
  isRevokingSession: boolean;
  revokeError: string | null;
  
  // Modal de confirmación
  showConfirmModal: boolean;
  sessionToRevoke: Session | null;
  
  // Filtros y ordenamiento
  sortBy: 'lastActive' | 'created' | 'expires';
  sortOrder: 'asc' | 'desc';
  showExpiredSessions: boolean;
}

const [sessionsState, setSessionsState] = useState<SessionsState>({
  sessions: [],
  isLoadingSessions: true,
  sessionsError: null,
  revokingSessionId: null,
  isRevokingSession: false,
  revokeError: null,
  showConfirmModal: false,
  sessionToRevoke: null,
  sortBy: 'lastActive',
  sortOrder: 'desc',
  showExpiredSessions: false
});
```

## 3. Flujos de Datos Detallados

### 3.1 Flujo de Inicialización del Dashboard

```
1. CustomDashboard se monta
   ├── useUser() → { isLoaded, isSignedIn, user }
   ├── Si !isLoaded → Mostrar LoadingSpinner
   ├── Si !isSignedIn → Mostrar ErrorMessage
   └── Si autenticado → Continuar

2. Renderizar estructura principal
   ├── DashboardSidebar
   │   ├── Recibe: activeSection, onSectionChange
   │   └── Renderiza: MenuItems con estado activo
   └── DashboardContent
       ├── Recibe: activeSection, user
       └── Renderiza: ProfileSection | SecuritySection

3. Inicialización de sección activa (Profile por defecto)
   └── ProfileSection
       ├── Recibe: user (props)
       ├── Procesa: datos del usuario
       └── Renderiza: información del perfil
```

### 3.2 Flujo de Cambio de Sección

```
1. Usuario hace clic en sidebar
   └── DashboardSidebar.onItemClick(sectionId)

2. Propagación del evento
   └── CustomDashboard.handleSectionChange(sectionId)
       ├── setGlobalState({ activeSection: sectionId })
       └── clearGlobalError() // Limpiar errores previos

3. Re-renderizado
   ├── DashboardSidebar actualiza estilos activos
   └── DashboardContent cambia componente renderizado
       ├── Si 'profile' → ProfileSection
       └── Si 'security' → SecuritySection
           ├── PasswordChangeForm (inicializa estado local)
           └── ActiveSessions (carga sesiones)
```

### 3.3 Flujo de Cambio de Contraseña

```
1. Usuario interactúa con formulario
   ├── onChange → updateFormData(field, value)
   ├── onBlur → validateField(field)
   └── clearFieldError(field) si había error

2. Validación en tiempo real
   ├── validateField() ejecuta reglas específicas
   ├── setPasswordState({ fieldErrors: {...} })
   └── Actualiza UI con errores/éxitos

3. Envío del formulario
   ├── onSubmit → preventDefault()
   ├── validateForm() → ValidationResult
   ├── Si !isValid → Mostrar errores y return
   └── Si isValid → Continuar

4. Llamada a API de Clerk
   ├── setPasswordState({ isSubmitting: true })
   ├── user.updatePassword({ currentPassword, newPassword })
   ├── try {
   │   ├── await updatePassword()
   │   ├── setPasswordState({ isSuccess: true, successMessage })
   │   ├── resetForm() después de 3 segundos
   │   └── Opcional: onPasswordChanged() callback
   └── } catch (error) {
       ├── setPasswordState({ generalError: error.message })
       └── setPasswordState({ isSubmitting: false })
   }
```

### 3.4 Flujo de Gestión de Sesiones

```
1. Inicialización de ActiveSessions
   ├── useSessionList() → { isLoaded, sessionList, setActive }
   ├── useEffect(() => {
   │   ├── Si isLoaded → processSessions(sessionList)
   │   └── setSessionsState({ sessions, isLoadingSessions: false })
   └── }, [isLoaded, sessionList])

2. Procesamiento de sesiones
   ├── processSessions(sessionList)
   ├── Filtrar sesiones según showExpiredSessions
   ├── Ordenar según sortBy y sortOrder
   ├── Enriquecer con información adicional
   └── return processedSessions

3. Revocación de sesión
   ├── onRevokeClick(session) → {
   │   ├── setSessionsState({ sessionToRevoke: session })
   │   └── setSessionsState({ showConfirmModal: true })
   └── }
   
4. Confirmación de revocación
   ├── onConfirmRevoke() → {
   │   ├── setSessionsState({ isRevokingSession: true })
   │   ├── setSessionsState({ showConfirmModal: false })
   │   ├── try {
   │   │   ├── await sessionToRevoke.revoke()
   │   │   ├── Actualizar lista de sesiones
   │   │   └── Mostrar mensaje de éxito
   │   └── } catch (error) {
   │       ├── setSessionsState({ revokeError: error.message })
   │       └── setSessionsState({ isRevokingSession: false })
   │   }
   └── }
```

## 4. Comunicación Entre Componentes

### 4.1 Props Drilling vs Context

**Props Drilling (Elegido):**
```typescript
// Ventajas:
// - Flujo de datos explícito y predecible
// - Fácil debugging y testing
// - No hay dependencias ocultas
// - Mejor rendimiento (no re-renders innecesarios)

CustomDashboard
├── props: { appearance }
├── state: { activeSection, isLoading, error }
└── children:
    ├── DashboardSidebar
    │   └── props: { activeSection, onSectionChange }
    └── DashboardContent
        └── props: { activeSection, user }
        └── children:
            ├── ProfileSection
            │   └── props: { user }
            └── SecuritySection
                └── props: { user }
                └── children:
                    ├── PasswordChangeForm
                    │   └── props: { user, onPasswordChanged }
                    └── ActiveSessions
                        └── props: { } // Usa hooks directamente
```

### 4.2 Event Handling Patterns

**Patrón de Callbacks:**
```typescript
// CustomDashboard
const handleSectionChange = useCallback((section: SectionType) => {
  setGlobalState(prev => ({ ...prev, activeSection: section }));
}, []);

const handlePasswordChanged = useCallback(() => {
  // Opcional: mostrar notificación global
  // Opcional: refrescar datos del usuario
  console.log('Contraseña cambiada exitosamente');
}, []);

// Propagación hacia abajo
<DashboardSidebar 
  activeSection={globalState.activeSection}
  onSectionChange={handleSectionChange}
/>

<PasswordChangeForm 
  user={user}
  onPasswordChanged={handlePasswordChanged}
/>
```

### 4.3 Error Propagation

**Estrategia de Manejo de Errores:**
```typescript
// Errores locales (manejados en el componente)
interface LocalErrorHandling {
  // Errores de validación de formularios
  fieldErrors: Record<string, string>;
  
  // Errores de operaciones específicas
  operationError: string | null;
  
  // Función para limpiar errores
  clearError: () => void;
}

// Errores que se propagan hacia arriba
interface ErrorPropagation {
  // Errores críticos que afectan todo el dashboard
  onCriticalError?: (error: Error, context: string) => void;
  
  // Errores de autenticación
  onAuthError?: (error: Error) => void;
}

// Implementación en CustomDashboard
const handleCriticalError = useCallback((error: Error, context: string) => {
  console.error(`Critical error in ${context}:`, error);
  setGlobalState(prev => ({
    ...prev,
    error: `Error en ${context}: ${error.message}`,
    isLoading: false
  }));
}, []);
```

## 5. Optimizaciones de Rendimiento

### 5.1 Memoización de Componentes

```typescript
// Componentes que no cambian frecuentemente
const MemoizedSidebar = React.memo(DashboardSidebar, (prevProps, nextProps) => {
  return prevProps.activeSection === nextProps.activeSection;
});

const MemoizedProfileSection = React.memo(ProfileSection, (prevProps, nextProps) => {
  return prevProps.user.id === nextProps.user.id &&
         prevProps.user.updatedAt === nextProps.user.updatedAt;
});
```

### 5.2 Memoización de Valores Calculados

```typescript
// En ActiveSessions
const sortedSessions = useMemo(() => {
  return sessions
    .filter(session => showExpiredSessions || !isSessionExpired(session))
    .sort((a, b) => {
      const aValue = a[sortBy];
      const bValue = b[sortBy];
      const comparison = aValue > bValue ? 1 : -1;
      return sortOrder === 'asc' ? comparison : -comparison;
    });
}, [sessions, sortBy, sortOrder, showExpiredSessions]);

// En PasswordChangeForm
const isFormValid = useMemo(() => {
  return Object.keys(fieldErrors).length === 0 &&
         formData.currentPassword.trim() !== '' &&
         formData.newPassword.trim() !== '' &&
         formData.confirmPassword.trim() !== '';
}, [fieldErrors, formData]);
```

### 5.3 Debouncing de Validaciones

```typescript
// Hook personalizado para debouncing
const useDebounce = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  
  return debouncedValue;
};

// Uso en PasswordChangeForm
const debouncedNewPassword = useDebounce(formData.newPassword, 300);

useEffect(() => {
  if (debouncedNewPassword) {
    validateField('newPassword', debouncedNewPassword);
  }
}, [debouncedNewPassword]);
```

## 6. Testing del Flujo de Datos

### 6.1 Unit Tests para Estados

```typescript
// Test para CustomDashboard state management
describe('CustomDashboard State Management', () => {
  test('should change active section', () => {
    const { result } = renderHook(() => {
      const [state, setState] = useState({ activeSection: 'profile' });
      const handleSectionChange = (section) => {
        setState(prev => ({ ...prev, activeSection: section }));
      };
      return { state, handleSectionChange };
    });
    
    act(() => {
      result.current.handleSectionChange('security');
    });
    
    expect(result.current.state.activeSection).toBe('security');
  });
});
```

### 6.2 Integration Tests para Flujos

```typescript
// Test para flujo completo de cambio de contraseña
describe('Password Change Flow', () => {
  test('should complete password change successfully', async () => {
    const mockUser = {
      updatePassword: jest.fn().mockResolvedValue({})
    };
    
    render(<PasswordChangeForm user={mockUser} />);
    
    // Llenar formulario
    fireEvent.change(screen.getByLabelText('Contraseña actual'), {
      target: { value: 'currentpass123' }
    });
    fireEvent.change(screen.getByLabelText('Nueva contraseña'), {
      target: { value: 'newpass123' }
    });
    fireEvent.change(screen.getByLabelText('Confirmar contraseña'), {
      target: { value: 'newpass123' }
    });
    
    // Enviar formulario
    fireEvent.click(screen.getByText('Cambiar Contraseña'));
    
    // Verificar llamada a API
    await waitFor(() => {
      expect(mockUser.updatePassword).toHaveBeenCalledWith({
        currentPassword: 'currentpass123',
        newPassword: 'newpass123'
      });
    });
    
    // Verificar mensaje de éxito
    expect(screen.getByText('Contraseña cambiada exitosamente')).toBeInTheDocument();
  });
});
```

---

**Estado del Flujo de Datos:** ✅ Planificado  
**Componentes con Estado:** 3 (CustomDashboard, PasswordChangeForm, ActiveSessions)  
**Patrones de Comunicación:** Props Drilling + Callbacks  
**Siguiente Paso:** Crear backups y verificar funcionamiento actual