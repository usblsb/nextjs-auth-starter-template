# Electrónica School - Plataforma Web

## ** https://github.com/usblsb/nextjs-auth-starter-template **

<div align="center">
  <h1>
    🎓 Academia de Electrónica Online
  </h1>
  <p>Plataforma web moderna para la enseñanza de electrónica con dashboard de usuarios y sistema de autenticación usando Clerk</p>
</div>

## 🏷️ Badges

<!-- Estado del proyecto y tecnologías -->

![Next.js](https://img.shields.io/badge/Next.js-15.3.4-black?style=for-the-badge&logo=next.js)
![Clerk](https://img.shields.io/badge/Clerk-6.22.0-6C47FF?style=for-the-badge&logo=clerk)
![Tailwind](https://img.shields.io/badge/Tailwind-4.1.11-38B2AC?style=for-the-badge&logo=tailwind-css)
![TypeScript](https://img.shields.io/badge/TypeScript-Latest-3178C6?style=for-the-badge&logo=typescript)
![License](https://img.shields.io/badge/license-MIT-blue?style=for-the-badge)

<!-- Tecnologías principales -->

[![Stack](https://skillicons.dev/icons?i=nextjs,react,typescript,tailwind,vercel,git,github&perline=7)](https://skillicons.dev)

---

## ✨ Características implementadas

- **Next.js 15** con App Router y TypeScript
- **Clerk Authentication** - Sistema completo de autenticación y gestión de usuarios
- **Dashboard Personalizado** - Panel de control con gestión de perfil y seguridad
- **Tailwind CSS 4.0 ** - Diseño moderno y responsive
- **Páginas Legales** - Sistema completo de páginas footer (aviso legal, cookies, etc.)
- **Sistema de Templates** - Componentes reutilizables y modulares
- **Documentación Completa** - Guías de desarrollo y despliegue
- **Configuración Profesional** - Lista para producción con Vercel

---

## 📖 Sobre el Proyecto

**Electrónica School** es una academia online especializada en la enseñanza de electrónica, reparaciones y programación. Esta plataforma web proporciona:

- **Portal de estudiantes** con dashboard personalizado
- **Sistema de autenticación** seguro y profesional usando Clerk
- **Gestión de perfiles** y configuración de seguridad
- **Páginas institucionales** completas
- **Arquitectura escalable** para futuras funcionalidades educativas

### 🔧 Implementaciones Actuales

- ✅ **Sistema de Autenticación Completo** (Clerk)
- ✅ **Dashboard de Usuario** con sidebar y secciones modulares
- ✅ **Gestión de Perfil** y datos personales
- ✅ **Configuración de Seguridad** y cambio de contraseñas
- ✅ **Gestión de Sesiones Activas**
- ✅ **Páginas Legales** (Aviso Legal, Política de Cookies, etc.)
- ✅ **Sistema de Templates** reutilizable
- ✅ **Webhooks de Stripe** con Stripe CLI para desarrollo local
- ✅ **Historial de Direcciones de Facturación** (compliance legal España)
- ✅ **Captura de Nombres en Suscripciones** (firstName/lastName)
- ✅ **Documentación Técnica** completa

## 🚀 Origen del Proyecto

Este proyecto está basado en el template oficial de Clerk para Next.js:

**Repositorio Original:** [clerk/clerk-nextjs-demo-app-router](https://github.com/clerk/clerk-nextjs-demo-app-router)

**Demo Original:** https://clerk-nextjs-app-router.vercel.app/

Para más información sobre Clerk y Next.js:

- [Quickstart: Get started with Next.js and Clerk](https://go.clerk.com/vgWhQ7B)
- [Clerk Documentation](https://go.clerk.com/aNiTioa)
- [Next.js Documentation](https://nextjs.org/docs)

## 🛠️ Instalación y Desarrollo

Para ejecutar el proyecto localmente:

1. **Clonar el repositorio:**

```bash
git clone [URL_DE_TU_REPOSITORIO]
cd clerk-nextjs-auth-starter-template
```

2. **Configurar variables de entorno:**

   - Crea una cuenta en [Clerk](https://clerk.com)
   - Ve al [dashboard de Clerk](https://dashboard.clerk.com) y crea una aplicación
   - Copia las variables de entorno desde [.env.example](./.env.example)
   - Habilita "Organizations" en la configuración de Clerk

3. **Instalar dependencias usando solo "pnpm" :**

```bash
pnpm install
```

4. **Ejecutar en desarrollo:**

```bash
pnpm dev
```

5. **Configurar webhooks de Stripe (opcional):**

```bash
# Para recibir webhooks de Stripe en desarrollo local
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# El comando anterior te dará un webhook secret, cópialo al .env:
# STRIPE_WEBHOOK_SECRET="whsec_..."
```

6. **Abrir en el navegador:**
   - Aplicación: http://localhost:3000
   - Dashboard: http://localhost:3000/web-dashboard

## 💳 Integración Stripe

El proyecto incluye integración completa con Stripe para:

- **Webhooks automáticos** que capturan cambios de direcciones de billing
- **Historial completo** de direcciones para compliance legal (España)
- **Captura de nombres** (firstName/lastName) en suscripciones
- **Desarrollo local** usando Stripe CLI para túneles seguros
- **Logging completo** en base de datos para auditorías

### 🔐 Separación de Responsabilidades: Clerk vs Stripe

**Clerk** (Autenticación únicamente):
- ✅ **Email** y **contraseña** del usuario
- ✅ Gestión de sesiones y autenticación
- ✅ Verificación de email
- ❌ **NO** almacena nombres, direcciones ni datos de facturación

**Stripe** (Datos de suscripción y facturación):
- ✅ **Nombres** (firstName/lastName) capturados durante suscripción
- ✅ **Direcciones de facturación** completas
- ✅ Métodos de pago y suscripciones
- ✅ Historial de cambios para compliance legal (10 años en España)

**Flujo de datos:**
1. Usuario se registra en **Clerk** → Solo email/password
2. Usuario se suscribe → **Formulario captura nombre + dirección** → Stripe Customer
3. Cambios futuros → **Portal de Stripe** → Webhooks → Nueva entrada en BD

### Configuración Webhooks Stripe

1. **Desarrollo Local:**
   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```
   
2. **Eventos capturados:**
   - `customer.updated` - Cambios en direcciones de clientes
   - `checkout.session.completed` - Checkouts completados
   - `invoice.payment_succeeded/failed` - Estados de pagos
   - `customer.subscription.*` - Cambios en suscripciones

3. **Compliance legal:**
   - Cada cambio de dirección crea **nueva entrada** (no actualiza)
   - Historial completo mantenido en `user_billing_address` con **firstName/lastName**
   - Cliente solo ve dirección actual, sistema mantiene historial completo

### 🔄 Implementación Captura de Nombres

**Formulario de Suscripción** (`SubscriptionFormComplete.tsx`):
```typescript
// AddressElement configurado para capturar nombre dividido
<AddressElement
  options={{
    display: { name: 'split' },  // firstName + lastName
    defaultValues: { name: user?.fullName || '' }
  }}
/>
```

**API de Suscripción** (`/api/stripe/create-subscription-from-payment`):
```typescript
// 1. Actualizar customer de Stripe con nombre completo
await stripe.customers.update(customerId, {
  name: `${firstName} ${lastName}`,
  metadata: { first_name: firstName, last_name: lastName }
});

// 2. Guardar en BD para compliance
await upsertBillingAddress(userId, {
  ...billingAddress,
  firstName,
  lastName
});
```

**Webhook de Stripe** (`/api/webhooks/stripe`):
```typescript
// Capturar nombre desde múltiples fuentes
const name = customer.name || customer.shipping?.name;
const [firstName, ...lastNameParts] = name?.split(' ') || [];
const lastName = lastNameParts.join(' ') || undefined;

// Crear nueva entrada (no actualizar)
await prisma.userBillingAddress.create({
  data: { userId, firstName, lastName, ...address }
});
```

**Base de Datos** (Prisma Schema):
```prisma
model UserBillingAddress {
  firstName    String?     @db.VarChar(100)  // ✅ Nuevo
  lastName     String?     @db.VarChar(100)  // ✅ Nuevo
  // ... resto de campos de dirección
}
```

## Estructura

```
├── app/                         # Directorio principal Next.js App Router
│   ├── (pages-dashboard)/       # Rutas agrupadas del dashboard
│   │   ├── README.md            # Documentación específica del dashboard
│   │   └── web-dashboard/       # Dashboard principal de usuarios autenticados
│   │       └── [[...rest]]/     # Rutas dinámicas del dashboard
│   ├── (pages-footer)/          # Páginas legales agrupadas (aviso legal, cookies, etc.)
│   │   ├── web-aviso-legal/     # Página de aviso legal
│   │   ├── web-condiciones-venta/ # Página de condiciones de venta
│   │   ├── web-contactar/       # Página de contacto
│   │   ├── web-politica-cookies/ # Página de política de cookies
│   │   ├── web-politica-privacidad/ # Página de política de privacidad
│   │   ├── web-preguntas-frecuentes/ # Página de FAQ
│   │   └── web-requisitos-tecnicos/ # Página de requisitos técnicos
│   ├── _template/               # Componentes y contenido del template base
│   │   ├── components/          # Componentes específicos del template
│   │   ├── content/             # Contenido estático del template
│   │   ├── images/              # Imágenes específicas del template
│   │   └── styles/              # Estilos específicos del template
│   ├── api/                     # Rutas API de Next.js
│   │   ├── webhooks/            # Webhooks para integraciones externas
│   │   │   ├── clerk/           # Webhooks de Clerk para sincronización usuarios
│   │   │   └── stripe/          # Webhooks de Stripe para direcciones y pagos
│   │   └── protected/           # Endpoints API protegidos con autenticación
│   ├── components/              # Componentes React reutilizables
│   │   ├── dashboard/           # Componentes específicos del dashboard
│   │   │   ├── custom-dashboard.tsx    # Dashboard principal personalizado
│   │   │   ├── dashboard-content.tsx   # Contenido principal del dashboard
│   │   │   ├── dashboard-sidebar.tsx   # Barra lateral del dashboard
│   │   │   └── sections/        # Secciones modulares del dashboard
│   │   │       ├── active-sessions.tsx     # Gestión de sesiones activas
│   │   │       ├── password-change-form.tsx # Formulario cambio contraseña
│   │   │       ├── profile-section.tsx     # Sección de perfil usuario
│   │   │       └── security-section.tsx    # Sección de seguridad
│   │   ├── layouts/             # Componentes de layout (header, footer, etc.)
│   │   ├── code-switcher.tsx    # Componente para alternar código
│   │   ├── theme.ts             # Configuración de temas
│   │   └── user-details.tsx     # Componente detalles de usuario
│   ├── dashboard/               # Página legacy del dashboard (no utilizada)
│   ├── sign-in/                 # Páginas de autenticación con Clerk
│   │   └── [[...sign-in]]/      # Rutas dinámicas de inicio de sesión
│   ├── sign-out/                # Páginas de cierre de sesión
│   │   └── [[...sign-out]]/     # Rutas dinámicas de cierre de sesión
│   ├── sign-up/                 # Páginas de registro
│   │   └── [[...sign-up]]/      # Rutas dinámicas de registro
│   ├── styles/                  # Estilos específicos de páginas
│   │   └── pages-dashboard.css  # Estilos del dashboard
│   ├── fonts/                   # Fuentes personalizadas del proyecto
│   ├── layout.tsx               # Layout raíz con ClerkProvider
│   ├── page.tsx                 # Página principal (Academia de Electrónica)
│   ├── globals.css              # Estilos globales
│   └── favicon.ico              # Icono del sitio
├── documents/                   # Documentación del proyecto
│   └── dashboard-help-docs/     # Documentación específica del dashboard
│       ├── dashboard-clerk-apis-hooks.md      # APIs y hooks de Clerk
│       ├── dashboard-components.md            # Documentación de componentes
│       ├── dashboard-de-usuarios-funcionamiento.md # Funcionamiento del sistema
│       └── dashboard-deployment-guide.md      # Guía de despliegue
├── public/                      # Archivos estáticos públicos
│   ├── images/                  # Imágenes del proyecto
│   │   ├── images-pages-footer/ # Imágenes para páginas del footer
│   │   └── logos/               # Logos del proyecto
│   ├── *.svg, *.png             # Logos y assets principales
│   ├── humans.txt               # Información sobre desarrolladores
│   └── llms.txt                 # Información para LLMs
├── styles/                      # Estilos adicionales globales
│   ├── pages-dashboard.css      # Estilos específicos del dashboard
│   └── pages-footer.css         # Estilos específicos del footer
├── middleware.ts                # Middleware de Clerk para autenticación de rutas
├── package.json                 # Dependencias y scripts del proyecto
├── pnpm-workspace.yaml          # Configuración del workspace de pnpm
├── postcss.config.js            # Configuración de PostCSS
├── next.config.js               # Configuración de Next.js
└── tsconfig.json               # Configuración TypeScript
```

## Archivos Principales

### Configuración y Layout

- **app/layout.tsx**: Layout principal con ClerkProvider y configuración de apariencia
- **app/page.tsx**: Página de inicio (Academia de Electrónica)
- **middleware.ts**: Middleware de Clerk para proteger rutas (`/web-dashboard`)
- **package.json**: Next.js 15.3.4 + Clerk 6.22.0 + Tailwind 4.1.11
- **next.config.js**: Configuración de Next.js con patrones de imágenes remotas
- **postcss.config.js**: Configuración de PostCSS para Tailwind
- **pnpm-workspace.yaml**: Configuración del workspace de pnpm

### Dashboard y Autenticación

- **app/(pages-dashboard)/web-dashboard/[[...rest]]/page.tsx**: Dashboard principal de usuarios autenticados
- **app/components/dashboard/custom-dashboard.tsx**: Componente principal del dashboard personalizado
- **app/components/dashboard/dashboard-sidebar.tsx**: Barra lateral del dashboard con navegación
- **app/components/dashboard/dashboard-content.tsx**: Contenido principal del dashboard
- **app/components/dashboard/sections/**: Secciones modulares (perfil, seguridad, sesiones, cambio contraseña)
- **app/sign-in/[[...sign-in]]/**: Páginas de autenticación con Clerk
- **app/sign-up/[[...sign-up]]/**: Páginas de registro con Clerk
- **app/sign-out/[[...sign-out]]/**: Páginas de cierre de sesión
- **app/api/webhooks/stripe/route.ts**: Webhook endpoint para eventos de Stripe
- **lib/services/billingService.ts**: Servicios para gestión de direcciones y compliance

### Componentes y Layouts

- **app/components/user-details.tsx**: Componente para mostrar detalles del usuario autenticado
- **app/components/layouts/**: Componentes de layout (header, footer, etc.)
- **app/components/code-switcher.tsx**: Componente para alternar código
- **app/components/theme.ts**: Configuración de temas

### Páginas y Templates

- **app/(pages-footer)/**: Páginas legales agrupadas por routing (aviso legal, cookies, contacto, etc.)
- **app/\_template/**: Sistema de templates reutilizable con componentes, contenido e imágenes

### Documentación

- **documents/dashboard-help-docs/**: Documentación completa del dashboard
  - **dashboard-components.md**: Documentación de componentes
  - **dashboard-clerk-apis-hooks.md**: APIs y hooks de Clerk
  - **dashboard-de-usuarios-funcionamiento.md**: Funcionamiento del sistema
  - **dashboard-deployment-guide.md**: Guía de despliegue

### Estilos y Assets

- **app/styles/pages-dashboard.css**: Estilos específicos del dashboard
- **styles/pages-footer.css**: Estilos específicos del footer
- **app/globals.css**: Estilos globales
- **public/images/**: Imágenes del proyecto organizadas por secciones

## Para LLMs

- **Patrón principal**: Next.js App Router + Clerk Auth + Tailwind CSS 4
- **Archivos clave**: layout.tsx, middleware.ts, user-details.tsx, page.tsx
- **Convenciones**:
  - Grupos de rutas con paréntesis: `(pages-footer)`
  - Rutas dinámicas: `[[...sign-in]]`
  - Componentes client: `"use client"`
  - Fuentes locales: GeistSans y GeistMono
  - Gestión de paquetes: pnpm
  - Tema personalizado Clerk con variables CSS

## Soporte

Si tienes problemas o preguntas:

1. Revisa la documentación en `/documents/dashboard-help-docs/`
2. Consulta los issues existentes en GitHub
3. Crea un nuevo issue si es necesario

---

## 👤 Autor

**Juan Luis Martel (@USBLSB / EA8BK)**  
💼 Reparaciones electrónicas · Enseñanza online · Programación  
🌐 https://electronica.school  
🐙 https://github.com/USBLSB  
✉️ web@electronica.school

---

## 📝 Licencia

Este proyecto se distribuye bajo la licencia **MIT** (ajústalo según tus necesidades).
