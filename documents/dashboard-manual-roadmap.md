# Roadmap: Dashboard Manual Personalizado - Sustitución de UserProfile de Clerk

## Descripción del Proyecto

Este roadmap detalla las tareas necesarias para sustituir el componente `UserProfile` de Clerk por un dashboard manual personalizado que muestre únicamente la información específica requerida: perfil de usuario y configuración de seguridad.

## Objetivos

- Reemplazar el componente `UserProfile` de Clerk por un dashboard personalizado
- Implementar un menú lateral con botones "Perfil" y "Seguridad"
- Mostrar información del usuario de forma controlada
- Permitir cambio de contraseña y gestión de sesiones activas

---

## FASE 1: ANÁLISIS Y PREPARACIÓN

### 1.1 Análisis del Estado Actual

- [ ] Revisar la implementación actual del `UserProfileWrapper`
- [ ] Identificar todos los hooks de Clerk utilizados actualmente
- [ ] Documentar la estructura de datos del usuario disponible
- [ ] Analizar las dependencias y imports necesarios

### 1.2 Diseño de la Arquitectura

- [ ] Definir la estructura de componentes del nuevo dashboard
- [ ] Planificar la navegación entre secciones (Perfil/Seguridad)
- [ ] Establecer el flujo de datos entre componentes
- [ ] Definir los estados de la aplicación (loading, error, success)

### 1.3 Preparación del Entorno

- [ ] Crear backups de los archivos que se van a modificar
- [ ] Verificar que el proyecto funciona correctamente antes de los cambios
- [ ] Revisar las dependencias de Clerk disponibles

---

## FASE 2: CREACIÓN DE COMPONENTES BASE

### 2.1 Componente Principal del Dashboard

- [ ] Crear el componente `CustomDashboard` que reemplace `UserProfileWrapper`
- [ ] Implementar el hook `useUser` para obtener datos del usuario
- [ ] Añadir estados de carga y manejo de errores
- [ ] Crear la estructura básica del layout con menú lateral

### 2.2 Componente de Navegación Lateral

- [ ] Crear el componente `DashboardSidebar`
- [ ] Implementar los botones "Perfil" y "Seguridad"
- [ ] Añadir lógica de navegación entre secciones
- [ ] Aplicar estilos consistentes con el diseño actual en el archivo styles/pages-dashboard.css

### 2.3 Componente de Sección Perfil

- [ ] Crear el componente `ProfileSection`
- [ ] Mostrar foto de perfil del usuario (`user.imageUrl`)
- [ ] Mostrar nombre completo del usuario (`user.fullName`)
- [ ] Mostrar email principal (`user.primaryEmailAddress.emailAddress`)
- [ ] Aplicar estilos y layout responsivo en el archivo styles/pages-dashboard.css

---

## FASE 3: IMPLEMENTACIÓN DE FUNCIONALIDADES DE SEGURIDAD

### 3.1 Componente de Cambio de Contraseña

- [ ] Crear el componente `PasswordChangeForm`
- [ ] Implementar formulario con campos: contraseña actual, nueva, confirmación
- [ ] Añadir validación de formulario (coincidencia de contraseñas)
- [ ] Implementar la función `user.updatePassword()` de Clerk
- [ ] Añadir manejo de errores y mensajes de éxito
- [ ] Limpiar formulario después de cambio exitoso

### 3.2 Componente de Sesiones Activas

- [ ] Crear el componente `ActiveSessions`
- [ ] Implementar el hook `useSessionList` de Clerk
- [ ] Mostrar lista de sesiones activas con información relevante
- [ ] Distinguir entre sesión actual y otras sesiones
- [ ] Implementar funcionalidad para revocar sesiones a través del objeto `session`, llamar al método `session.revoke()` para cerrar una sesión específica.
- [ ] Añadir confirmación antes de revocar sesiones

### 3.3 Componente de Sección Seguridad

- [ ] Crear el componente `SecuritySection`
- [ ] Integrar `PasswordChangeForm`
- [ ] Integrar `ActiveSessions`
- [ ] Mostrar contraseña con asteriscos (representación visual)
- [ ] Organizar layout de la sección de seguridad

---

## FASE 4: INTEGRACIÓN Y REEMPLAZO

### 4.1 Integración de Componentes

- [ ] Integrar todos los componentes en `CustomDashboard`
- [ ] Implementar la lógica de cambio entre secciones
- [ ] Verificar que todos los hooks funcionan correctamente
- [ ] Probar la navegación entre Perfil y Seguridad

### 4.2 Reemplazo del UserProfile

- [ ] Modificar `page.tsx` para usar `CustomDashboard` en lugar de `UserProfileWrapper`
- [ ] Actualizar imports y dependencias
- [ ] Mantener la misma estructura de autenticación y protección de rutas
- [ ] Preservar los estilos y apariencia general de la página

### 4.3 Ajustes de Estilos

- [ ] Aplicar estilos consistentes con el diseño actual en styles/pages-dashboard.css
- [ ] Asegurar responsividad en dispositivos móviles
- [ ] Mantener la paleta de colores existente
- [ ] Optimizar la experiencia de usuario

---

## FASE 5: TESTING Y REFINAMIENTO

### 5.1 Pruebas Funcionales

- [ ] Probar carga correcta de datos del usuario
- [ ] Verificar funcionamiento del cambio de contraseña
- [ ] Probar gestión de sesiones activas
- [ ] Verificar navegación entre secciones
- [ ] Probar estados de error y carga

### 5.2 Pruebas de UI/UX

- [ ] Verificar responsividad en diferentes tamaños de pantalla
- [ ] Probar accesibilidad básica
- [ ] Verificar consistencia visual con el resto de la aplicación
- [ ] Optimizar tiempos de carga y transiciones

### 5.3 Refinamiento y Optimización

- [ ] Optimizar rendimiento de componentes
- [ ] Mejorar manejo de errores
- [ ] Añadir loading states más detallados
- [ ] Pulir detalles visuales y de interacción

---

## FASE 6: DOCUMENTACIÓN Y LIMPIEZA

### 6.1 Documentación en /Users/Shared/clerk-nextjs-auth-starter-template/app/(pages-dashboard)/README.md

- [ ] Actualizar: /Users/Shared/clerk-nextjs-auth-starter-template/app/(pages-dashboard)/README.md ,con los cambios realizados
- [ ] Documentar los nuevos componentes creados en /Users/Shared/clerk-nextjs-auth-starter-template/app/(pages-dashboard)/README.md
- [ ] Crear guía de uso del nuevo dashboard en /Users/Shared/clerk-nextjs-auth-starter-template/app/(pages-dashboard)/README.md
- [ ] Documentar las APIs y hooks utilizados en /Users/Shared/clerk-nextjs-auth-starter-template/app/(pages-dashboard)/README.md

### 6.2 Limpieza de Código

- [ ] Eliminar código no utilizado
- [ ] Revisar y limpiar imports innecesarios
- [ ] Verificar que no hay console.log de desarrollo
- [ ] Optimizar estructura de archivos

### 6.3 Preparación para Producción

- [ ] Verificar que no hay información sensible expuesta
- [ ] Confirmar que todos los cambios son compatibles
- [ ] Realizar prueba final completa
- [ ] Preparar notas de release

---

## Archivos Principales a Modificar/Crear

### Archivos a Modificar:

- `app/(pages-dashboard)/web-dashboard/[[...rest]]/page.tsx`
- `app/(pages-dashboard)/web-dashboard/components/user-profile-wrapper.tsx`
  (posible eliminación)
- `/Users/Shared/clerk-nextjs-auth-starter-template/app/(pages-dashboard)/README.md`
- `styles/pages-dashboard.css`

### Archivos a Crear:

- `app/(pages-dashboard)/web-dashboard/components/custom-dashboard.tsx`
- `app/(pages-dashboard)/web-dashboard/components/dashboard-sidebar.tsx`
- `app/(pages-dashboard)/web-dashboard/components/profile-section.tsx`
- `app/(pages-dashboard)/web-dashboard/components/security-section.tsx`
- `app/(pages-dashboard)/web-dashboard/components/password-change-form.tsx`
- `app/(pages-dashboard)/web-dashboard/components/active-sessions.tsx`

---

## Notas Importantes

- **Seguridad**: Mantener todas las validaciones y protecciones de Clerk
- **Compatibilidad**: Asegurar que los cambios no afecten otras partes de la aplicación
- **Experiencia de Usuario**: Mantener o mejorar la UX actual
- **Mantenibilidad**: Crear código limpio y bien documentado
- **Testing**: Probar exhaustivamente antes de considerar completado

---

## Criterios de Éxito

✅ El dashboard personalizado reemplaza completamente el UserProfile de Clerk  
✅ Los usuarios pueden ver su perfil (foto, nombre, email)  
✅ Los usuarios pueden cambiar su contraseña  
✅ Los usuarios pueden ver y gestionar sus sesiones activas  
✅ La navegación entre secciones funciona correctamente  
✅ El diseño es responsivo y consistente  
✅ No hay regresiones en funcionalidad existente  
✅ El código está bien documentado y es mantenible

---

_Documento creado: Dashboard Manual Roadmap_  
_Proyecto: Clerk NextJS Auth Starter Template_  
_Objetivo: Sustitución de UserProfile por Dashboard Personalizado_
