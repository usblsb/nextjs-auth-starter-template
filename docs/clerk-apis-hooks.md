# APIs y Hooks de Clerk - Documentación

## Introducción

Este documento detalla todas las APIs y hooks de Clerk utilizados en el dashboard personalizado, incluyendo ejemplos de uso, manejo de errores y mejores prácticas.

## Hooks de Clerk

### useUser()

**Descripción:** Hook principal para acceder a la información del usuario autenticado.

#### Importación
```typescript
import { useUser } from '@clerk/nextjs';
```

#### Retorno
```typescript
interface UseUserReturn {
  user: User | null | undefined;
  isLoaded: boolean;
  isSignedIn: boolean | undefined;
}
```

#### Ejemplo de Uso
```typescript
function UserProfile() {
  const { user, isLoaded, isSignedIn } = useUser();
  
  // Mostrar loading mientras se carga
  if (!isLoaded) {
    return <div>Cargando...</div>;
  }
  
  // Redirigir si no está autenticado
  if (!isSignedIn) {
    return <div>No autenticado</div>;
  }
  
  return (
    <div>
      <h1>Hola, {user.firstName}!</h1>
      <p>Email: {user.primaryEmailAddress?.emailAddress}</p>
    </div>
  );
}
```

#### Estados del Hook
- **Cargando:** `isLoaded = false`
- **No autenticado:** `isLoaded = true, isSignedIn = false`
- **Autenticado:** `isLoaded = true, isSignedIn = true, user = User`

### useReverification()

**Descripción:** Hook para manejar la reverificación en operaciones sensibles.

#### Importación
```typescript
import { useReverification } from '@clerk/nextjs';
```

#### Sintaxis
```typescript
const enhancedFunction = useReverification(originalFunction);
```

#### Ejemplo de Uso
```typescript
function PasswordChangeForm() {
  const { user } = useUser();
  
  // Función original que requiere reverificación
  const updatePasswordFunction = async () => {
    await user.updatePassword({
      currentPassword: 'current123',
      newPassword: 'newSecure456',
      signOutOfOtherSessions: true
    });
  };
  
  // Función mejorada con reverificación
  const updatePasswordAction = useReverification(updatePasswordFunction);
  
  const handleSubmit = async () => {
    try {
      // Si se requiere reverificación, se mostrará automáticamente el modal
      await updatePasswordAction();
      console.log('Contraseña actualizada exitosamente');
    } catch (error) {
      console.error('Error al actualizar contraseña:', error);
    }
  };
  
  return (
    <button onClick={handleSubmit}>
      Cambiar Contraseña
    </button>
  );
}
```

#### Comportamiento
1. **Sin reverificación necesaria:** Ejecuta la función directamente
2. **Reverificación requerida:** 
   - Muestra modal de reverificación
   - Usuario ingresa credenciales
   - Ejecuta función original tras verificación exitosa

#### Configuración de Tiempo
- **Duración por defecto:** 10 minutos
- **Personalizable:** Mediante configuración del servidor

### useAuth()

**Descripción:** Hook para acceder a información de autenticación y tokens.

#### Importación
```typescript
import { useAuth } from '@clerk/nextjs';
```

#### Retorno
```typescript
interface UseAuthReturn {
  userId: string | null | undefined;
  sessionId: string | null | undefined;
  getToken: (options?: GetTokenOptions) => Promise<string | null>;
  isLoaded: boolean;
  isSignedIn: boolean | undefined;
  signOut: (options?: SignOutOptions) => Promise<void>;
}
```

#### Ejemplo de Uso
```typescript
function AuthenticatedComponent() {
  const { userId, getToken, signOut, isLoaded, isSignedIn } = useAuth();
  
  const handleApiCall = async () => {
    const token = await getToken();
    
    const response = await fetch('/api/protected', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
  };
  
  const handleSignOut = async () => {
    await signOut();
  };
  
  if (!isLoaded) return <div>Cargando...</div>;
  if (!isSignedIn) return <div>No autenticado</div>;
  
  return (
    <div>
      <p>Usuario ID: {userId}</p>
      <button onClick={handleApiCall}>Llamar API</button>
      <button onClick={handleSignOut}>Cerrar Sesión</button>
    </div>
  );
}
```

## APIs del Objeto User

### Propiedades del Usuario

#### Información Básica
```typescript
interface User {
  id: string;
  firstName: string | null;
  lastName: string | null;
  fullName: string | null;
  username: string | null;
  imageUrl: string;
  hasImage: boolean;
  primaryEmailAddress: EmailAddress | null;
  primaryPhoneNumber: PhoneNumber | null;
  emailAddresses: EmailAddress[];
  phoneNumbers: PhoneNumber[];
  sessions: Session[];
  createdAt: Date;
  updatedAt: Date;
}
```

#### Ejemplo de Acceso
```typescript
function UserInfo({ user }: { user: User }) {
  return (
    <div>
      <h2>{user.fullName || 'Usuario sin nombre'}</h2>
      <img src={user.imageUrl} alt="Avatar" />
      <p>Miembro desde: {user.createdAt.toLocaleDateString()}</p>
      <p>Emails: {user.emailAddresses.length}</p>
      <p>Sesiones activas: {user.sessions.length}</p>
    </div>
  );
}
```

### Actualización de Perfil

#### user.update()

**Descripción:** Actualiza la información básica del usuario.

```typescript
interface UpdateUserParams {
  firstName?: string;
  lastName?: string;
  username?: string;
}

user.update(params: UpdateUserParams): Promise<User>
```

#### Ejemplo de Uso
```typescript
const updateProfile = async () => {
  try {
    const updatedUser = await user.update({
      firstName: 'Juan',
      lastName: 'Pérez'
    });
    
    console.log('Perfil actualizado:', updatedUser.fullName);
  } catch (error) {
    console.error('Error al actualizar perfil:', error);
  }
};
```

#### Manejo de Errores
```typescript
const handleUpdateError = (error: any) => {
  const errorCode = error.errors?.[0]?.code;
  
  switch (errorCode) {
    case 'form_param_nil':
      return 'Todos los campos son requeridos';
    case 'form_username_invalid':
      return 'El nombre de usuario no es válido';
    case 'form_identifier_exists':
      return 'Este nombre de usuario ya existe';
    default:
      return 'Error al actualizar el perfil';
  }
};
```

### Gestión de Contraseñas

#### user.updatePassword()

**Descripción:** Actualiza la contraseña del usuario.

```typescript
interface UpdatePasswordParams {
  currentPassword: string;
  newPassword: string;
  signOutOfOtherSessions?: boolean;
}

user.updatePassword(params: UpdatePasswordParams): Promise<User>
```

#### Ejemplo Completo
```typescript
function PasswordChangeForm() {
  const { user } = useUser();
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    signOutOtherSessions: true
  });
  
  const updatePasswordFunction = async () => {
    // Validar que las contraseñas coincidan
    if (formData.newPassword !== formData.confirmPassword) {
      throw new Error('Las contraseñas no coinciden');
    }
    
    await user.updatePassword({
      currentPassword: formData.currentPassword,
      newPassword: formData.newPassword,
      signOutOfOtherSessions: formData.signOutOtherSessions
    });
  };
  
  // Usar reverificación para operación sensible
  const updatePasswordAction = useReverification(updatePasswordFunction);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await updatePasswordAction();
      alert('Contraseña actualizada correctamente');
      // Limpiar formulario
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
        signOutOtherSessions: true
      });
    } catch (error) {
      alert(handlePasswordError(error));
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <input
        type="password"
        placeholder="Contraseña actual"
        value={formData.currentPassword}
        onChange={(e) => setFormData(prev => ({
          ...prev,
          currentPassword: e.target.value
        }))}
        required
      />
      
      <input
        type="password"
        placeholder="Nueva contraseña"
        value={formData.newPassword}
        onChange={(e) => setFormData(prev => ({
          ...prev,
          newPassword: e.target.value
        }))}
        required
      />
      
      <input
        type="password"
        placeholder="Confirmar nueva contraseña"
        value={formData.confirmPassword}
        onChange={(e) => setFormData(prev => ({
          ...prev,
          confirmPassword: e.target.value
        }))}
        required
      />
      
      <label>
        <input
          type="checkbox"
          checked={formData.signOutOtherSessions}
          onChange={(e) => setFormData(prev => ({
            ...prev,
            signOutOtherSessions: e.target.checked
          }))}
        />
        Cerrar otras sesiones
      </label>
      
      <button type="submit">Cambiar Contraseña</button>
    </form>
  );
}
```

#### Errores Comunes
```typescript
const handlePasswordError = (error: any) => {
  const errorCode = error.errors?.[0]?.code;
  
  switch (errorCode) {
    case 'form_password_incorrect':
      return 'La contraseña actual es incorrecta';
    case 'form_password_pwned':
      return 'Esta contraseña ha sido comprometida en una filtración de datos';
    case 'form_password_too_common':
      return 'Esta contraseña es muy común, elige una más segura';
    case 'form_password_length_too_short':
      return 'La contraseña debe tener al menos 8 caracteres';
    default:
      return 'Error al cambiar la contraseña';
  }
};
```

### Gestión de Emails

#### user.createEmailAddress()

**Descripción:** Agrega una nueva dirección de email al usuario.

```typescript
interface CreateEmailAddressParams {
  emailAddress: string;
}

user.createEmailAddress(params: CreateEmailAddressParams): Promise<EmailAddress>
```

#### Flujo Completo de Verificación
```typescript
function EmailManagement() {
  const { user } = useUser();
  const [newEmail, setNewEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [pendingEmailId, setPendingEmailId] = useState<string | null>(null);
  
  // Paso 1: Agregar email
  const handleAddEmail = async () => {
    try {
      const emailAddress = await user.createEmailAddress({
        emailAddress: newEmail
      });
      
      // Paso 2: Preparar verificación
      await emailAddress.prepareVerification({
        strategy: 'email_code'
      });
      
      setPendingEmailId(emailAddress.id);
      alert('Código de verificación enviado a tu email');
    } catch (error) {
      alert('Error al agregar email: ' + error.message);
    }
  };
  
  // Paso 3: Verificar email
  const handleVerifyEmail = async () => {
    try {
      const emailAddress = user.emailAddresses.find(
        email => email.id === pendingEmailId
      );
      
      if (!emailAddress) {
        throw new Error('Email no encontrado');
      }
      
      await emailAddress.attemptVerification({
        code: verificationCode
      });
      
      alert('Email verificado correctamente');
      setPendingEmailId(null);
      setVerificationCode('');
      setNewEmail('');
    } catch (error) {
      alert('Código de verificación incorrecto');
    }
  };
  
  // Eliminar email
  const handleRemoveEmail = async (emailId: string) => {
    try {
      const emailAddress = user.emailAddresses.find(
        email => email.id === emailId
      );
      
      await emailAddress?.destroy();
      alert('Email eliminado correctamente');
    } catch (error) {
      alert('Error al eliminar email');
    }
  };
  
  return (
    <div>
      {/* Lista de emails existentes */}
      <div>
        <h3>Emails actuales:</h3>
        {user.emailAddresses.map(email => (
          <div key={email.id}>
            <span>{email.emailAddress}</span>
            <span>{email.verification?.status}</span>
            {email.id !== user.primaryEmailAddress?.id && (
              <button onClick={() => handleRemoveEmail(email.id)}>
                Eliminar
              </button>
            )}
          </div>
        ))}
      </div>
      
      {/* Agregar nuevo email */}
      {!pendingEmailId && (
        <div>
          <input
            type="email"
            placeholder="Nuevo email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
          />
          <button onClick={handleAddEmail}>Agregar Email</button>
        </div>
      )}
      
      {/* Verificar email */}
      {pendingEmailId && (
        <div>
          <input
            type="text"
            placeholder="Código de verificación"
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value)}
          />
          <button onClick={handleVerifyEmail}>Verificar</button>
        </div>
      )}
    </div>
  );
}
```

### Gestión de Imágenes

#### user.setProfileImage()

**Descripción:** Actualiza la imagen de perfil del usuario.

```typescript
interface SetProfileImageParams {
  file: File | null;
}

user.setProfileImage(params: SetProfileImageParams): Promise<ImageResource>
```

#### Ejemplo de Implementación
```typescript
function AvatarUpload() {
  const { user } = useUser();
  const [isUploading, setIsUploading] = useState(false);
  
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      alert('Por favor selecciona una imagen válida');
      return;
    }
    
    // Validar tamaño (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('La imagen debe ser menor a 5MB');
      return;
    }
    
    try {
      setIsUploading(true);
      
      await user.setProfileImage({ file });
      alert('Imagen actualizada correctamente');
    } catch (error) {
      alert('Error al subir la imagen');
    } finally {
      setIsUploading(false);
    }
  };
  
  const handleRemoveImage = async () => {
    try {
      setIsUploading(true);
      
      await user.setProfileImage({ file: null });
      alert('Imagen eliminada correctamente');
    } catch (error) {
      alert('Error al eliminar la imagen');
    } finally {
      setIsUploading(false);
    }
  };
  
  return (
    <div>
      <div>
        <img
          src={user.imageUrl}
          alt="Avatar"
          width={100}
          height={100}
          style={{ borderRadius: '50%' }}
        />
      </div>
      
      <input
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        disabled={isUploading}
      />
      
      {user.hasImage && (
        <button
          onClick={handleRemoveImage}
          disabled={isUploading}
        >
          Eliminar Imagen
        </button>
      )}
      
      {isUploading && <p>Subiendo imagen...</p>}
    </div>
  );
}
```

## Gestión de Sesiones

### Propiedades de Session

```typescript
interface Session {
  id: string;
  status: 'active' | 'ended' | 'expired' | 'removed' | 'replaced' | 'revoked';
  lastActiveAt: number;
  createdAt: number;
  updatedAt: number;
  expireAt: number;
  abandonAt: number;
  user: User;
}
```

### session.revoke()

**Descripción:** Revoca (cierra) una sesión específica.

```typescript
session.revoke(): Promise<Session>
```

#### Ejemplo de Gestión de Sesiones
```typescript
function ActiveSessions() {
  const { user } = useUser();
  const [isLoading, setIsLoading] = useState(false);
  
  const formatSessionInfo = (session: Session) => {
    const lastActive = new Date(session.lastActiveAt);
    const created = new Date(session.createdAt);
    
    return {
      id: session.id,
      status: session.status,
      lastActive: lastActive.toLocaleString(),
      created: created.toLocaleString(),
      isCurrent: session.id === user.sessions[0]?.id
    };
  };
  
  const handleRevokeSession = async (sessionId: string) => {
    if (!confirm('¿Estás seguro de cerrar esta sesión?')) {
      return;
    }
    
    try {
      setIsLoading(true);
      
      const session = user.sessions.find(s => s.id === sessionId);
      if (session) {
        await session.revoke();
        alert('Sesión cerrada correctamente');
      }
    } catch (error) {
      alert('Error al cerrar la sesión');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div>
      <h3>Sesiones Activas ({user.sessions.length})</h3>
      
      {user.sessions.map(session => {
        const sessionInfo = formatSessionInfo(session);
        
        return (
          <div key={session.id} style={{
            border: '1px solid #ccc',
            padding: '10px',
            margin: '10px 0',
            backgroundColor: sessionInfo.isCurrent ? '#e8f5e8' : 'white'
          }}>
            <div>
              <strong>
                {sessionInfo.isCurrent ? 'Sesión Actual' : 'Otra Sesión'}
              </strong>
            </div>
            <div>Estado: {sessionInfo.status}</div>
            <div>Última actividad: {sessionInfo.lastActive}</div>
            <div>Creada: {sessionInfo.created}</div>
            
            {!sessionInfo.isCurrent && (
              <button
                onClick={() => handleRevokeSession(session.id)}
                disabled={isLoading}
                style={{
                  backgroundColor: '#ff4444',
                  color: 'white',
                  border: 'none',
                  padding: '5px 10px',
                  marginTop: '10px'
                }}
              >
                Cerrar Sesión
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
```

## Mejores Prácticas

### 1. Manejo de Estados de Carga

```typescript
function OptimizedComponent() {
  const { user, isLoaded, isSignedIn } = useUser();
  
  // Siempre verificar isLoaded primero
  if (!isLoaded) {
    return <LoadingSpinner />;
  }
  
  // Luego verificar autenticación
  if (!isSignedIn) {
    return <SignInPrompt />;
  }
  
  // Finalmente renderizar contenido
  return <UserContent user={user} />;
}
```

### 2. Manejo de Errores Consistente

```typescript
const createErrorHandler = (context: string) => {
  return (error: any) => {
    console.error(`Error en ${context}:`, error);
    
    // Log para debugging
    if (process.env.NODE_ENV === 'development') {
      console.log('Error details:', {
        errors: error.errors,
        status: error.status,
        message: error.message
      });
    }
    
    // Retornar mensaje amigable
    return getErrorMessage(error, context);
  };
};

const getErrorMessage = (error: any, context: string) => {
  const errorCode = error.errors?.[0]?.code;
  
  const errorMessages = {
    'form_password_incorrect': 'Contraseña incorrecta',
    'form_identifier_exists': 'Este email ya está en uso',
    'form_param_nil': 'Todos los campos son requeridos',
    'session_token_invalid': 'Sesión expirada, por favor inicia sesión nuevamente'
  };
  
  return errorMessages[errorCode] || `Error en ${context}. Inténtalo de nuevo.`;
};
```

### 3. Optimización de Re-renders

```typescript
// Memoizar componentes pesados
const MemoizedUserProfile = React.memo(function UserProfile({ user }) {
  return (
    <div>
      <h1>{user.fullName}</h1>
      <img src={user.imageUrl} alt="Avatar" />
    </div>
  );
});

// Usar callbacks memoizados
function ParentComponent() {
  const { user } = useUser();
  
  const handleUserUpdate = useCallback(async (data) => {
    await user.update(data);
  }, [user]);
  
  return (
    <MemoizedUserProfile
      user={user}
      onUpdate={handleUserUpdate}
    />
  );
}
```

### 4. Validación de Datos

```typescript
const validateUserData = (data: any) => {
  const errors: Record<string, string> = {};
  
  if (!data.firstName?.trim()) {
    errors.firstName = 'El nombre es requerido';
  }
  
  if (!data.lastName?.trim()) {
    errors.lastName = 'El apellido es requerido';
  }
  
  if (data.username && data.username.length < 3) {
    errors.username = 'El nombre de usuario debe tener al menos 3 caracteres';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

const validatePassword = (password: string) => {
  const requirements = {
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumbers: /\d/.test(password),
    hasSpecialChars: /[!@#$%^&*(),.?":{}|<>]/.test(password)
  };
  
  const score = Object.values(requirements).filter(Boolean).length;
  
  return {
    isValid: score === 5,
    score: (score / 5) * 100,
    requirements,
    feedback: generatePasswordFeedback(requirements)
  };
};
```

### 5. Testing de Hooks

```typescript
// Mock de Clerk para testing
const mockUser = {
  id: 'user_123',
  firstName: 'Juan',
  lastName: 'Pérez',
  emailAddresses: [{
    id: 'email_123',
    emailAddress: 'juan@example.com',
    verification: { status: 'verified' }
  }],
  update: jest.fn(),
  updatePassword: jest.fn(),
  setProfileImage: jest.fn()
};

jest.mock('@clerk/nextjs', () => ({
  useUser: () => ({
    user: mockUser,
    isLoaded: true,
    isSignedIn: true
  }),
  useReverification: (fn) => fn
}));

// Test del componente
describe('ProfileSection', () => {
  it('should update user profile', async () => {
    render(<ProfileSection />);
    
    fireEvent.change(screen.getByLabelText('Nombre'), {
      target: { value: 'Carlos' }
    });
    
    fireEvent.click(screen.getByText('Guardar'));
    
    await waitFor(() => {
      expect(mockUser.update).toHaveBeenCalledWith({
        firstName: 'Carlos'
      });
    });
  });
});
```

## Configuración Avanzada

### Variables de Entorno

```env
# Clerk Keys
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# URLs de redirección
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# Configuración de sesiones
CLERK_SESSION_TOKEN_TEMPLATE=your_template_name
```

### Middleware de Next.js

```typescript
// middleware.ts
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/profile(.*)',
  '/settings(.*)'
]);

export default clerkMiddleware((auth, req) => {
  if (isProtectedRoute(req)) {
    auth().protect();
  }
});

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
};
```

## Troubleshooting

### Errores Comunes

#### 1. "User is not loaded"
```typescript
// ❌ Incorrecto
function Component() {
  const { user } = useUser();
  return <div>{user.firstName}</div>; // Error si user es null
}

// ✅ Correcto
function Component() {
  const { user, isLoaded } = useUser();
  
  if (!isLoaded) return <div>Cargando...</div>;
  if (!user) return <div>No autenticado</div>;
  
  return <div>{user.firstName}</div>;
}
```

#### 2. "Session token is invalid"
```typescript
// Verificar y renovar token
const { getToken } = useAuth();

const makeAuthenticatedRequest = async () => {
  try {
    const token = await getToken();
    
    if (!token) {
      throw new Error('No se pudo obtener el token');
    }
    
    const response = await fetch('/api/protected', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.status === 401) {
      // Token expirado, redirigir a login
      window.location.href = '/sign-in';
    }
  } catch (error) {
    console.error('Error de autenticación:', error);
  }
};
```

#### 3. "Reverification required" no funciona
```typescript
// Asegurar que useReverification esté correctamente implementado
const MyComponent = () => {
  const { user } = useUser();
  
  // ❌ Incorrecto - función inline
  const badAction = useReverification(async () => {
    await user.updatePassword({ /* ... */ });
  });
  
  // ✅ Correcto - función estable
  const updatePasswordFunction = useCallback(async () => {
    await user.updatePassword({ /* ... */ });
  }, [user]);
  
  const goodAction = useReverification(updatePasswordFunction);
};
```

## Conclusión

Esta documentación cubre todos los aspectos importantes de las APIs y hooks de Clerk utilizados en el dashboard. Para implementaciones más avanzadas, consulta la [documentación oficial de Clerk](https://clerk.com/docs) y el [README del dashboard](../app/(pages-dashboard)/README.md).