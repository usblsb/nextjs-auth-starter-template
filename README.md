# clerk-nextjs-auth-starter-template

<div align="center">
  <h1>
    Fork de Next.js Clerk auth starter template
  </h1>
</div>

## Introduction

Clerk is a developer-first authentication and user management solution. It provides pre-built React components and hooks for sign-in, sign-up, user profile, and organization management. Clerk is designed to be easy to use and customize, and can be dropped into any React or Next.js application.

This template allows you to get started with Clerk and Next.js (App Router) in a matter of minutes, and demonstrates features of Clerk such as:

- Fully functional auth flow with sign-in, sign-up, and a protected page
- Customized Clerk components with Tailwind CSS
- Hooks for accessing user data and authentication state
- Organizations for multi-tenant applications

## Demo

A hosted demo of this example is available at https://clerk-nextjs-app-router.vercel.app/

## Deploy

Easily deploy the template to Vercel with the button below. You will need to set the required environment variables in the Vercel dashboard.

## Running the template

```bash
git clone https://github.com/clerk/clerk-nextjs-demo-app-router
```

To run the example locally, you need to:

1. Sign up for a Clerk account at [https://clerk.com](https://go.clerk.com/31bREJU).
2. Go to the [Clerk dashboard](https://go.clerk.com/4I5LXFj) and create an application.
3. Set the required Clerk environment variables as shown in [the example `env` file](./.env.example).
4. Go to "Organization Settings" in your sidebar and enable Organizations
5. `pnpm install` the required dependencies.
6. `pnpm dev` to launch the development server.

## Learn more

To learn more about Clerk and Next.js, check out the following resources:

- [Quickstart: Get started with Next.js and Clerk](https://go.clerk.com/vgWhQ7B)
- [Clerk Documentation](https://go.clerk.com/aNiTioa)
- [Next.js Documentation](https://nextjs.org/docs)

## Estructura

```
├── app/                          # Directorio principal Next.js App Router
│   ├── (pages-footer)/          # Páginas legales agrupadas (aviso legal, cookies, etc.)
│   ├── _template/               # Componentes y contenido del template
│   ├── api/                     # Rutas API de Next.js
│   ├── components/              # Componentes React reutilizables
│   ├── dashboard/               # Página del dashboard autenticado
│   ├── sign-in/                 # Página de inicio de sesión con Clerk
│   ├── layout.tsx               # Layout raíz con ClerkProvider
│   ├── page.tsx                 # Página principal (Academia de Electrónica)
│   └── globals.css              # Estilos globales
├── public/                      # Archivos estáticos
│   ├── images/                  # Imágenes del proyecto
│   └── *.svg, *.png             # Logos y assets
├── styles/                      # Estilos adicionales
├── middleware.ts                # Middleware de Clerk para autenticación
├── package.json                 # Dependencias del proyecto
└── tsconfig.json               # Configuración TypeScript
```

## Archivos Principales

- **app/layout.tsx**: Layout principal con ClerkProvider y configuración de apariencia
- **app/page.tsx**: Página de inicio (Academia de Electrónica)
- **app/components/user-details.tsx**: Componente para mostrar detalles del usuario autenticado
- **middleware.ts**: Middleware de Clerk para proteger rutas
- **package.json**: Next.js 15.3.4 + Clerk 6.22.0 + Tailwind 4.1.11
- **app/(pages-footer)/**: Páginas legales agrupadas por routing
- **app/\_template/**: Sistema de templates reutilizable

## Para LLMs

- **Patrón principal**: Next.js App Router + Clerk Auth + Tailwind CSS
- **Archivos clave**: layout.tsx, middleware.ts, user-details.tsx, page.tsx
- **Convenciones**:
  - Grupos de rutas con paréntesis: `(pages-footer)`
  - Rutas dinámicas: `[[...sign-in]]`
  - Componentes client: `"use client"`
  - Fuentes locales: GeistSans y GeistMono
  - Gestión de paquetes: pnpm
  - Tema personalizado Clerk con variables CSS
