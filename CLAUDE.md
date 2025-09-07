# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js 15 application with Clerk authentication, built as an online
electronics education platform. The project uses TypeScript, Tailwind CSS 4,
Stripe, and Prisma with PostgreSQL 17.

## Project explication

The project consists of two PostgreSQL databases hosted on NEON.COM.

The database [DB1], which is used in this APP, stores user data, log records, payments, and subscriptions, all obtained from CLERK and STRIPE.
The database [DB2] stores slides, lessons, and courses content and is read-only.

This project displays content from database [DB2]. Depending on the user status, more or less content is shown, for example:
• Users without login: see the OPEN content of the academy (GOOGLE ONLY SEES THIS CONTENT).
• FREE users: see the OPEN content and the FREE content.
• PREMIUM users: see the FREE and PREMIUM content.

## Key Technologies

- **Framework**: Next.js 15.3.4 with App Router
- **Authentication**: Clerk 6.22.0 with Spanish localization (esES)
- **Database [DB1]**: PostgreSQL 17 with Prisma ORM
- **Styling**: Tailwind CSS 4.1.11
- **Package Manager**: pnpm (required - do not use npm or yarn)

## Development Commands

```bash
# Development server with turbopack
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start

# Linting
pnpm lint

# Database operations
pnpm db:generate    # Generate Prisma client
pnpm db:push        # Push schema changes to database
pnpm db:migrate     # Run database migrations
pnpm db:studio      # Open Prisma Studio
pnpm db:reset       # Reset database
```

## Architecture

### Route Structure

- **Public routes**: `/` (homepage), authentication pages (`/sign-in`, `/sign-up`, `/sign-out`), footer pages
- **Protected routes**: `/web-dashboard` and all sub-routes (protected by middleware)
- **Route groups**:
  - `(pages-dashboard)` for dashboard-related pages
  - `(pages-footer)` for legal/footer pages

### Authentication Flow

- Middleware (`middleware.ts`) protects `/web-dashboard` routes
- Clerk handles authentication with custom appearance configuration
- Users redirect to `/web-dashboard` after successful login
- Spanish localization enabled

### Database Schema

The Prisma schema includes comprehensive user management:

- `UserProfile` - Main user data synced with Clerk
- `UserSubscription` - Billing and subscription management
- `UserActivityLog` - Security and activity tracking
- `UserPermission` - Role-based permissions
- `UserBillingAddress` - Billing information

### Key Components

- `app/components/dashboard/` - Dashboard-specific components
- `app/components/layouts/` - Shared layout components
- `app/_template/` - Reusable template system

## Environment Configuration

Required environment variables (see `.env.example`):

- `CLERK_SECRET_KEY` and `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - Clerk authentication
- `CLERK_WEBHOOK_SECRET` - For webhook signature validation
- `DATABASE_URL` - PostgreSQL connection string
- Database connection variables for Neon.com integration

## Development Guidelines

### Database Access

- Use the Neon.com MCP for database access
- Run `pnpm db:generate` after schema changes
- Use `pnpm db:studio` for database visualization

### Code Patterns

- Follow existing TypeScript and React patterns
- Use `"use client"` directive for client components
- Leverage Clerk hooks: `useUser()`, `useAuth()`, etc.
- Database operations should use Prisma client

### Styling

- Tailwind CSS 4 with custom configuration
- Custom Clerk appearance theme in `app/layout.tsx`
- Custom css in: /styles
- Responsive design with mobile-first approach

### API Routes

- Protected API routes in `app/api/protected/`
- Webhook handling for Clerk events in `app/api/webhooks/clerk/`
- Use Clerk's server-side authentication helpers

## Project-Specific Rules

From `.trae/rules/project_rules.md`:

- Always use pnpm for package management
- Use Stripe MCP (HTTP): api key configurada en .env STRIPE_API_KEY
- Use Neon MCP (local): for database operations - Instalado y configurado con tu
  API key

## Testing and Quality

- Run linting with `pnpm lint` before commits
- Test authentication flows in development
- Verify database migrations with `pnpm db:push`
- Check Prisma schema validation before deployment
- Use NGROK túnel seguro "https://[URL-VARIABLE].ngrok-free.app -> http://localhost:3000 "
- Ngrok run en la ip de NExtJS : "ngrok http http://localhost:3000"
- NGrok parar agente: https://dashboard.ngrok.com/agents

## RESUMEN

Arranca NextJS local --> abre ngrok con la IP local de NextJS `ngrok http 3000` -->
copia URL HTTPS de Forwarding -->
entra en Clerk Dashboard --> pega URL en webhook con esta terminacion (/api/webhooks/clerk) -->
haz login/logout en frontend -->
verifica en terminal de ngrok que llega POST -->
si 200 OK --> NEON guarda log de login/logout en la tabla de registro de LOGS.
