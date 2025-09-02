# Ejemplos de Uso - Dashboard Personalizado

## Introducción

Este documento proporciona ejemplos prácticos de cómo usar y personalizar el dashboard personalizado, incluyendo configuraciones comunes, casos de uso específicos y patrones de implementación.

## Configuración Básica

### 1. Configuración Inicial

#### Variables de Entorno (.env.local)

```env
# Clerk Configuration
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# URLs de Clerk
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/web-dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/web-dashboard
```

#### Instalación de Dependencias

```bash
# Instalar dependencias del proyecto
pnpm install

# Ejecutar en modo desarrollo
pnpm dev

# Acceder al dashboard
# http://localhost:3000/web-dashboard
```

### 2. Estructura de Archivos

```
app/
├── (pages-dashboard)/
│   ├── web-dashboard/
│   │   └── page.tsx                 # Página principal del dashboard
│   └── README.md                    # Documentación del dashboard
├── components/
│   └── dashboard/
│       ├── custom-dashboard.tsx     # Componente principal
│       ├── dashboard-sidebar.tsx    # Barra lateral
│       ├── dashboard-content.tsx    # Contenido principal
│       ├── profile-section.tsx      # Sección de perfil
│       ├── security-section.tsx     # Sección de seguridad
│       ├── password-change-form.tsx # Formulario de cambio de contraseña
│       └── active-sessions.tsx      # Sesiones activas
└── docs/
    ├── dashboard-components.md      # Documentación de componentes
    ├── clerk-apis-hooks.md         # Documentación de APIs de Clerk
    ├── deployment-guide.md         # Guía de deployment
    └── usage-examples.md           # Este archivo
```

## Ejemplos de Uso

### 1. Uso Básico del Dashboard

#### Implementación Simple

```typescript
// app/(pages-dashboard)/web-dashboard/page.tsx
import { CustomDashboard } from '@/components/dashboard/custom-dashboard';

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <CustomDashboard />
    </div>
  );
}
```

#### Con Layout Personalizado

```typescript
// app/(pages-dashboard)/layout.tsx
import { ClerkProvider } from '@clerk/nextjs';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="es">
        <body className={inter.className}>
          <div className="dashboard-layout">
            {children}
          </div>
        </body>
      </html>
    </ClerkProvider>
  );
}
```

### 2. Personalización del Dashboard

#### Modificar Colores y Estilos

```typescript
// components/dashboard/custom-dashboard.tsx
import { useState } from 'react';
import { useUser } from '@clerk/nextjs';

interface DashboardTheme {
  primary: string;
  secondary: string;
  background: string;
  text: string;
}

const themes: Record<string, DashboardTheme> = {
  default: {
    primary: 'bg-blue-600',
    secondary: 'bg-gray-100',
    background: 'bg-white',
    text: 'text-gray-900'
  },
  dark: {
    primary: 'bg-gray-800',
    secondary: 'bg-gray-700',
    background: 'bg-gray-900',
    text: 'text-white'
  },
  green: {
    primary: 'bg-green-600',
    secondary: 'bg-green-100',
    background: 'bg-white',
    text: 'text-gray-900'
  }
};

export function CustomDashboard({ theme = 'default' }: { theme?: string }) {
  const { user } = useUser();
  const [currentTheme, setCurrentTheme] = useState(theme);
  const selectedTheme = themes[currentTheme];

  return (
    <div className={`min-h-screen ${selectedTheme.background}`}>
      <div className="flex">
        {/* Sidebar con tema personalizado */}
        <div className={`w-64 ${selectedTheme.primary} ${selectedTheme.text}`}>
          <DashboardSidebar theme={selectedTheme} />
        </div>
        
        {/* Contenido principal */}
        <div className="flex-1">
          <DashboardContent 
            theme={selectedTheme}
            onThemeChange={setCurrentTheme}
          />
        </div>
      </div>
    </div>
  );
}
```

#### Agregar Secciones Personalizadas

```typescript
// components/dashboard/custom-section.tsx
import { useUser } from '@clerk/nextjs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface CustomSectionProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

export function CustomSection({ title, children, className = '' }: CustomSectionProps) {
  return (
    <Card className={`mb-6 ${className}`}>
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-gray-900">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {children}
      </CardContent>
    </Card>
  );
}

// Uso en el dashboard
export function DashboardContent() {
  const { user } = useUser();

  return (
    <div className="p-6">
      {/* Secciones existentes */}
      <ProfileSection />
      <SecuritySection />
      
      {/* Sección personalizada */}
      <CustomSection title="Configuración Avanzada">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span>Notificaciones por email</span>
            <input type="checkbox" className="toggle" />
          </div>
          <div className="flex items-center justify-between">
            <span>Modo oscuro</span>
            <input type="checkbox" className="toggle" />
          </div>
        </div>
      </CustomSection>
      
      {/* Otra sección personalizada */}
      <CustomSection title="Estadísticas de Uso">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">24</div>
            <div className="text-sm text-gray-600">Sesiones este mes</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">98%</div>
            <div className="text-sm text-gray-600">Tiempo de actividad</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">5</div>
            <div className="text-sm text-gray-600">Dispositivos activos</div>
          </div>
        </div>
      </CustomSection>
    </div>
  );
}
```

### 3. Integración con APIs Externas

#### Conectar con API de Terceros

```typescript
// hooks/useExternalAPI.ts
import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';

interface APIData {
  id: string;
  name: string;
  value: number;
}

export function useExternalAPI() {
  const { getToken } = useAuth();
  const [data, setData] = useState<APIData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const token = await getToken();
        const response = await fetch('/api/external-data', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error('Error al obtener datos');
        }

        const result = await response.json();
        setData(result.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [getToken]);

  return { data, loading, error };
}

// Uso en componente
export function ExternalDataSection() {
  const { data, loading, error } = useExternalAPI();

  if (loading) {
    return <div className="animate-pulse">Cargando datos...</div>;
  }

  if (error) {
    return <div className="text-red-600">Error: {error}</div>;
  }

  return (
    <CustomSection title="Datos Externos">
      <div className="space-y-2">
        {data.map((item) => (
          <div key={item.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
            <span>{item.name}</span>
            <span className="font-semibold">{item.value}</span>
          </div>
        ))}
      </div>
    </CustomSection>
  );
}
```

#### API Route para Datos Externos

```typescript
// app/api/external-data/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    // Simular llamada a API externa
    const externalData = await fetch('https://api.ejemplo.com/data', {
      headers: {
        'Authorization': `Bearer ${process.env.EXTERNAL_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!externalData.ok) {
      throw new Error('Error en API externa');
    }

    const data = await externalData.json();

    return NextResponse.json({
      success: true,
      data: data.results
    });
  } catch (error) {
    console.error('Error en API externa:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
```

### 4. Formularios Personalizados

#### Formulario de Configuración Avanzada

```typescript
// components/dashboard/advanced-settings-form.tsx
import { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

interface AdvancedSettings {
  emailNotifications: boolean;
  smsNotifications: boolean;
  darkMode: boolean;
  language: string;
  timezone: string;
}

export function AdvancedSettingsForm() {
  const { user } = useUser();
  const [settings, setSettings] = useState<AdvancedSettings>({
    emailNotifications: true,
    smsNotifications: false,
    darkMode: false,
    language: 'es',
    timezone: 'America/Mexico_City'
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Guardar configuración en metadata del usuario
      await user?.update({
        publicMetadata: {
          ...user.publicMetadata,
          advancedSettings: settings
        }
      });

      toast.success('Configuración guardada exitosamente');
    } catch (error) {
      console.error('Error al guardar configuración:', error);
      toast.error('Error al guardar la configuración');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Notificaciones */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Notificaciones</h3>
        
        <div className="flex items-center justify-between">
          <Label htmlFor="email-notifications">Notificaciones por email</Label>
          <Switch
            id="email-notifications"
            checked={settings.emailNotifications}
            onCheckedChange={(checked) => 
              setSettings(prev => ({ ...prev, emailNotifications: checked }))
            }
          />
        </div>
        
        <div className="flex items-center justify-between">
          <Label htmlFor="sms-notifications">Notificaciones por SMS</Label>
          <Switch
            id="sms-notifications"
            checked={settings.smsNotifications}
            onCheckedChange={(checked) => 
              setSettings(prev => ({ ...prev, smsNotifications: checked }))
            }
          />
        </div>
      </div>

      {/* Apariencia */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Apariencia</h3>
        
        <div className="flex items-center justify-between">
          <Label htmlFor="dark-mode">Modo oscuro</Label>
          <Switch
            id="dark-mode"
            checked={settings.darkMode}
            onCheckedChange={(checked) => 
              setSettings(prev => ({ ...prev, darkMode: checked }))
            }
          />
        </div>
      </div>

      {/* Localización */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Localización</h3>
        
        <div className="space-y-2">
          <Label htmlFor="language">Idioma</Label>
          <select
            id="language"
            value={settings.language}
            onChange={(e) => setSettings(prev => ({ ...prev, language: e.target.value }))}
            className="w-full p-2 border border-gray-300 rounded-md"
          >
            <option value="es">Español</option>
            <option value="en">English</option>
            <option value="fr">Français</option>
          </select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="timezone">Zona horaria</Label>
          <select
            id="timezone"
            value={settings.timezone}
            onChange={(e) => setSettings(prev => ({ ...prev, timezone: e.target.value }))}
            className="w-full p-2 border border-gray-300 rounded-md"
          >
            <option value="America/Mexico_City">Ciudad de México</option>
            <option value="America/New_York">Nueva York</option>
            <option value="Europe/Madrid">Madrid</option>
            <option value="Asia/Tokyo">Tokio</option>
          </select>
        </div>
      </div>

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? 'Guardando...' : 'Guardar Configuración'}
      </Button>
    </form>
  );
}
```

### 5. Manejo de Estados y Contexto

#### Context para Estado Global del Dashboard

```typescript
// contexts/dashboard-context.tsx
import { createContext, useContext, useReducer, ReactNode } from 'react';

interface DashboardState {
  activeSection: string;
  theme: string;
  sidebarCollapsed: boolean;
  notifications: Notification[];
}

interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  timestamp: Date;
}

type DashboardAction =
  | { type: 'SET_ACTIVE_SECTION'; payload: string }
  | { type: 'SET_THEME'; payload: string }
  | { type: 'TOGGLE_SIDEBAR' }
  | { type: 'ADD_NOTIFICATION'; payload: Omit<Notification, 'id' | 'timestamp'> }
  | { type: 'REMOVE_NOTIFICATION'; payload: string };

const initialState: DashboardState = {
  activeSection: 'profile',
  theme: 'default',
  sidebarCollapsed: false,
  notifications: []
};

function dashboardReducer(state: DashboardState, action: DashboardAction): DashboardState {
  switch (action.type) {
    case 'SET_ACTIVE_SECTION':
      return { ...state, activeSection: action.payload };
    
    case 'SET_THEME':
      return { ...state, theme: action.payload };
    
    case 'TOGGLE_SIDEBAR':
      return { ...state, sidebarCollapsed: !state.sidebarCollapsed };
    
    case 'ADD_NOTIFICATION':
      return {
        ...state,
        notifications: [
          ...state.notifications,
          {
            ...action.payload,
            id: Date.now().toString(),
            timestamp: new Date()
          }
        ]
      };
    
    case 'REMOVE_NOTIFICATION':
      return {
        ...state,
        notifications: state.notifications.filter(n => n.id !== action.payload)
      };
    
    default:
      return state;
  }
}

const DashboardContext = createContext<{
  state: DashboardState;
  dispatch: React.Dispatch<DashboardAction>;
} | null>(null);

export function DashboardProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(dashboardReducer, initialState);

  return (
    <DashboardContext.Provider value={{ state, dispatch }}>
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboard debe usarse dentro de DashboardProvider');
  }
  return context;
}

// Hook personalizado para notificaciones
export function useNotifications() {
  const { state, dispatch } = useDashboard();

  const addNotification = (notification: Omit<Notification, 'id' | 'timestamp'>) => {
    dispatch({ type: 'ADD_NOTIFICATION', payload: notification });
    
    // Auto-remover después de 5 segundos
    setTimeout(() => {
      dispatch({ type: 'REMOVE_NOTIFICATION', payload: notification.message });
    }, 5000);
  };

  const removeNotification = (id: string) => {
    dispatch({ type: 'REMOVE_NOTIFICATION', payload: id });
  };

  return {
    notifications: state.notifications,
    addNotification,
    removeNotification
  };
}
```

#### Uso del Context en Componentes

```typescript
// components/dashboard/dashboard-with-context.tsx
import { DashboardProvider, useDashboard } from '@/contexts/dashboard-context';

function DashboardContent() {
  const { state, dispatch } = useDashboard();

  return (
    <div className="flex">
      <div className={`transition-all duration-300 ${
        state.sidebarCollapsed ? 'w-16' : 'w-64'
      }`}>
        <DashboardSidebar />
      </div>
      
      <div className="flex-1">
        <header className="bg-white shadow-sm p-4">
          <button
            onClick={() => dispatch({ type: 'TOGGLE_SIDEBAR' })}
            className="p-2 rounded-md hover:bg-gray-100"
          >
            {state.sidebarCollapsed ? '→' : '←'}
          </button>
        </header>
        
        <main className="p-6">
          {state.activeSection === 'profile' && <ProfileSection />}
          {state.activeSection === 'security' && <SecuritySection />}
          {state.activeSection === 'settings' && <AdvancedSettingsForm />}
        </main>
      </div>
    </div>
  );
}

export function DashboardWithContext() {
  return (
    <DashboardProvider>
      <DashboardContent />
    </DashboardProvider>
  );
}
```

### 6. Testing y Validación

#### Tests de Componentes

```typescript
// __tests__/dashboard.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ClerkProvider } from '@clerk/nextjs';
import { CustomDashboard } from '@/components/dashboard/custom-dashboard';

// Mock de Clerk
jest.mock('@clerk/nextjs', () => ({
  useUser: () => ({
    user: {
      id: 'test-user-id',
      firstName: 'Test',
      lastName: 'User',
      emailAddresses: [{ emailAddress: 'test@example.com' }],
      imageUrl: 'https://example.com/avatar.jpg'
    },
    isLoaded: true
  }),
  useAuth: () => ({
    getToken: jest.fn().mockResolvedValue('mock-token')
  }),
  ClerkProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>
}));

describe('CustomDashboard', () => {
  it('renderiza correctamente', () => {
    render(<CustomDashboard />);
    
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Test User')).toBeInTheDocument();
  });

  it('cambia de sección al hacer clic en el sidebar', async () => {
    render(<CustomDashboard />);
    
    const securityButton = screen.getByText('Seguridad');
    fireEvent.click(securityButton);
    
    await waitFor(() => {
      expect(screen.getByText('Cambiar Contraseña')).toBeInTheDocument();
    });
  });

  it('muestra formulario de cambio de contraseña', () => {
    render(<CustomDashboard />);
    
    const securityButton = screen.getByText('Seguridad');
    fireEvent.click(securityButton);
    
    expect(screen.getByLabelText('Contraseña actual')).toBeInTheDocument();
    expect(screen.getByLabelText('Nueva contraseña')).toBeInTheDocument();
    expect(screen.getByLabelText('Confirmar contraseña')).toBeInTheDocument();
  });
});
```

#### Validación de Formularios

```typescript
// lib/validations.ts
import { z } from 'zod';

export const profileUpdateSchema = z.object({
  firstName: z.string()
    .min(1, 'El nombre es requerido')
    .max(50, 'El nombre no puede exceder 50 caracteres'),
  lastName: z.string()
    .min(1, 'El apellido es requerido')
    .max(50, 'El apellido no puede exceder 50 caracteres'),
  username: z.string()
    .min(3, 'El nombre de usuario debe tener al menos 3 caracteres')
    .max(20, 'El nombre de usuario no puede exceder 20 caracteres')
    .regex(/^[a-zA-Z0-9_]+$/, 'Solo se permiten letras, números y guiones bajos')
    .optional()
});

export const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1, 'La contraseña actual es requerida'),
  newPassword: z.string()
    .min(8, 'La nueva contraseña debe tener al menos 8 caracteres')
    .max(100, 'La contraseña no puede exceder 100 caracteres')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
           'La contraseña debe contener al menos una mayúscula, una minúscula, un número y un carácter especial'),
  confirmPassword: z.string()
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});

export const advancedSettingsSchema = z.object({
  emailNotifications: z.boolean(),
  smsNotifications: z.boolean(),
  darkMode: z.boolean(),
  language: z.enum(['es', 'en', 'fr']),
  timezone: z.string().min(1, 'La zona horaria es requerida')
});
```

### 7. Optimización de Performance

#### Lazy Loading de Componentes

```typescript
// components/dashboard/lazy-dashboard.tsx
import { lazy, Suspense } from 'react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

// Lazy loading de secciones
const ProfileSection = lazy(() => import('./profile-section'));
const SecuritySection = lazy(() => import('./security-section'));
const AdvancedSettingsForm = lazy(() => import('./advanced-settings-form'));
const ExternalDataSection = lazy(() => import('./external-data-section'));

interface LazyDashboardProps {
  activeSection: string;
}

export function LazyDashboard({ activeSection }: LazyDashboardProps) {
  const renderSection = () => {
    switch (activeSection) {
      case 'profile':
        return (
          <Suspense fallback={<LoadingSpinner />}>
            <ProfileSection />
          </Suspense>
        );
      case 'security':
        return (
          <Suspense fallback={<LoadingSpinner />}>
            <SecuritySection />
          </Suspense>
        );
      case 'settings':
        return (
          <Suspense fallback={<LoadingSpinner />}>
            <AdvancedSettingsForm />
          </Suspense>
        );
      case 'data':
        return (
          <Suspense fallback={<LoadingSpinner />}>
            <ExternalDataSection />
          </Suspense>
        );
      default:
        return (
          <Suspense fallback={<LoadingSpinner />}>
            <ProfileSection />
          </Suspense>
        );
    }
  };

  return (
    <div className="dashboard-content">
      {renderSection()}
    </div>
  );
}
```

#### Memoización de Componentes

```typescript
// components/dashboard/optimized-components.tsx
import { memo, useMemo, useCallback } from 'react';
import { useUser } from '@clerk/nextjs';

// Componente memoizado para información del usuario
export const UserInfo = memo(function UserInfo() {
  const { user } = useUser();

  const userDisplayName = useMemo(() => {
    if (!user) return 'Usuario';
    return `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Usuario';
  }, [user?.firstName, user?.lastName]);

  const userInitials = useMemo(() => {
    if (!user) return 'U';
    const first = user.firstName?.[0] || '';
    const last = user.lastName?.[0] || '';
    return (first + last).toUpperCase() || 'U';
  }, [user?.firstName, user?.lastName]);

  return (
    <div className="flex items-center space-x-3">
      {user?.imageUrl ? (
        <img
          src={user.imageUrl}
          alt={userDisplayName}
          className="w-10 h-10 rounded-full"
        />
      ) : (
        <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
          {userInitials}
        </div>
      )}
      <div>
        <div className="font-medium text-gray-900">{userDisplayName}</div>
        <div className="text-sm text-gray-500">{user?.emailAddresses[0]?.emailAddress}</div>
      </div>
    </div>
  );
});

// Hook optimizado para manejo de formularios
export function useOptimizedForm<T>(initialValues: T, onSubmit: (values: T) => Promise<void>) {
  const [values, setValues] = useState(initialValues);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});

  const handleChange = useCallback((field: keyof T, value: any) => {
    setValues(prev => ({ ...prev, [field]: value }));
    // Limpiar error del campo cuando el usuario empiece a escribir
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  }, [errors]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      await onSubmit(values);
    } catch (error) {
      if (error instanceof Error) {
        setErrors({ general: error.message } as any);
      }
    } finally {
      setLoading(false);
    }
  }, [values, onSubmit]);

  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setLoading(false);
  }, [initialValues]);

  return {
    values,
    errors,
    loading,
    handleChange,
    handleSubmit,
    reset
  };
}
```

## Casos de Uso Específicos

### 1. Dashboard para Administradores

```typescript
// components/dashboard/admin-dashboard.tsx
import { useAuth } from '@clerk/nextjs';
import { CustomDashboard } from './custom-dashboard';
import { AdminPanel } from './admin-panel';

export function AdminDashboard() {
  const { has } = useAuth();
  const isAdmin = has({ role: 'admin' });

  if (!isAdmin) {
    return (
      <div className="p-6 text-center">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Acceso Denegado
        </h2>
        <p className="text-gray-600">
          No tienes permisos para acceder a esta sección.
        </p>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <CustomDashboard>
        <AdminPanel />
      </CustomDashboard>
    </div>
  );
}
```

### 2. Dashboard Responsivo

```typescript
// components/dashboard/responsive-dashboard.tsx
import { useState, useEffect } from 'react';
import { useMediaQuery } from '@/hooks/use-media-query';

export function ResponsiveDashboard() {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);

  useEffect(() => {
    setSidebarOpen(!isMobile);
  }, [isMobile]);

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className={`
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        ${isMobile ? 'fixed inset-y-0 left-0 z-50 w-64' : 'relative w-64'}
        transition-transform duration-300 ease-in-out
        bg-white shadow-lg
      `}>
        <DashboardSidebar onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Overlay para móvil */}
      {isMobile && sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Contenido principal */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white shadow-sm px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-md hover:bg-gray-100 lg:hidden"
          >
            ☰
          </button>
          <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
        </header>
        
        <main className="flex-1 overflow-y-auto p-4">
          <DashboardContent />
        </main>
      </div>
    </div>
  );
}
```

### 3. Dashboard con Múltiples Organizaciones

```typescript
// components/dashboard/multi-org-dashboard.tsx
import { useOrganization, useOrganizationList } from '@clerk/nextjs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function MultiOrgDashboard() {
  const { organization } = useOrganization();
  const { organizationList, setActive } = useOrganizationList();

  const handleOrgChange = (orgId: string) => {
    const selectedOrg = organizationList?.find(org => org.organization.id === orgId);
    if (selectedOrg) {
      setActive({ organization: selectedOrg.organization });
    }
  };

  return (
    <div className="multi-org-dashboard">
      {/* Selector de organización */}
      <div className="bg-white shadow-sm border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          
          {organizationList && organizationList.length > 1 && (
            <Select 
              value={organization?.id || ''} 
              onValueChange={handleOrgChange}
            >
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Seleccionar organización" />
              </SelectTrigger>
              <SelectContent>
                {organizationList.map(({ organization: org }) => (
                  <SelectItem key={org.id} value={org.id}>
                    <div className="flex items-center space-x-2">
                      {org.imageUrl && (
                        <img 
                          src={org.imageUrl} 
                          alt={org.name} 
                          className="w-6 h-6 rounded"
                        />
                      )}
                      <span>{org.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {/* Contenido del dashboard específico de la organización */}
      <div className="p-6">
        {organization ? (
          <>
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                {organization.name}
              </h2>
              <p className="text-gray-600">
                Miembros: {organization.membersCount}
              </p>
            </div>
            
            <CustomDashboard organizationId={organization.id} />
          </>
        ) : (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No hay organización seleccionada
            </h3>
            <p className="text-gray-600">
              Selecciona una organización para ver el dashboard.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
```

## Conclusión

Estos ejemplos proporcionan una base sólida para implementar y personalizar el dashboard según las necesidades específicas de tu aplicación. Recuerda:

1. **Modularidad**: Mantén los componentes pequeños y reutilizables
2. **Performance**: Usa lazy loading y memoización cuando sea apropiado
3. **Accesibilidad**: Implementa navegación por teclado y lectores de pantalla
4. **Responsive**: Asegúrate de que funcione en todos los dispositivos
5. **Testing**: Escribe tests para componentes críticos
6. **Seguridad**: Valida siempre los datos del usuario

Para más información, consulta:
- [README del Dashboard](../app/(pages-dashboard)/README.md)
- [Documentación de Componentes](./dashboard-components.md)
- [APIs y Hooks de Clerk](./clerk-apis-hooks.md)
- [Guía de Deployment](./deployment-guide.md)