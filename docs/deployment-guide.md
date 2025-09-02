# Guía de Deployment - Dashboard Personalizado

## Introducción

Esta guía proporciona instrucciones detalladas para desplegar el dashboard personalizado en diferentes entornos de producción, incluyendo configuración de seguridad, optimizaciones y monitoreo.

## Preparación para Producción

### 1. Configuración de Variables de Entorno

#### Variables Requeridas

```env
# Clerk - Producción
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...

# URLs de Producción
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/web-dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/web-dashboard

# Configuración de Next.js
NEXT_PUBLIC_APP_URL=https://tu-dominio.com
NODE_ENV=production

# Configuración de Clerk avanzada
CLERK_WEBHOOK_SECRET=whsec_...
CLERK_JWT_KEY=-----BEGIN PUBLIC KEY-----...
```

#### Variables Opcionales

```env
# Analytics y Monitoreo
NEXT_PUBLIC_ANALYTICS_ID=G-XXXXXXXXXX
SENTRY_DSN=https://...

# Configuración de CDN
NEXT_PUBLIC_CDN_URL=https://cdn.tu-dominio.com

# Base de datos (si aplica)
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
```

### 2. Configuración de Clerk para Producción

#### Dashboard de Clerk

1. **Crear Aplicación de Producción:**
   - Ir a [Clerk Dashboard](https://dashboard.clerk.com)
   - Crear nueva aplicación o cambiar a modo producción
   - Configurar dominio de producción

2. **Configurar URLs Permitidas:**
   ```
   Allowed origins:
   - https://tu-dominio.com
   - https://www.tu-dominio.com
   
   Redirect URLs:
   - https://tu-dominio.com/web-dashboard
   - https://tu-dominio.com/sign-in
   - https://tu-dominio.com/sign-up
   ```

3. **Configurar Webhooks (Opcional):**
   ```
   Endpoint URL: https://tu-dominio.com/api/webhooks/clerk
   Events: user.created, user.updated, session.created
   ```

#### Configuración de Seguridad

```typescript
// clerk.config.ts
export const clerkConfig = {
  // Configuración de sesiones
  sessionTokenTemplate: 'your_template_name',
  
  // Configuración de reverificación
  reverificationConfig: {
    level: 'strict', // 'strict' | 'moderate' | 'lax'
    gracePeriodMs: 10 * 60 * 1000, // 10 minutos
  },
  
  // Configuración de passwords
  passwordConfig: {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
    disallowCompromisedPasswords: true
  }
};
```

### 3. Optimizaciones de Build

#### next.config.js para Producción

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Optimizaciones de producción
  compress: true,
  poweredByHeader: false,
  generateEtags: false,
  
  // Configuración de imágenes
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
    ],
    // Optimizaciones de imágenes
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: false
  },
  
  // Headers de seguridad
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' *.clerk.accounts.dev *.clerk.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: *.clerk.com *.clerk.dev *.gravatar.com; connect-src 'self' *.clerk.accounts.dev *.clerk.com;"
          }
        ]
      }
    ];
  },
  
  // Configuración de webpack
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Optimizaciones del lado del cliente
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false
      };
    }
    
    return config;
  },
  
  // Configuración experimental
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['@clerk/nextjs']
  }
};

module.exports = nextConfig;
```

## Deployment en Vercel

### 1. Configuración Inicial

```bash
# Instalar Vercel CLI
npm i -g vercel

# Login en Vercel
vercel login

# Configurar proyecto
vercel
```

### 2. Configuración de Variables de Entorno

```bash
# Agregar variables de entorno
vercel env add NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
vercel env add CLERK_SECRET_KEY
vercel env add NEXT_PUBLIC_CLERK_SIGN_IN_URL
vercel env add NEXT_PUBLIC_CLERK_SIGN_UP_URL
vercel env add NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL
vercel env add NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL
```

### 3. vercel.json

```json
{
  "buildCommand": "pnpm build",
  "devCommand": "pnpm dev",
  "installCommand": "pnpm install",
  "framework": "nextjs",
  "regions": ["iad1"],
  "functions": {
    "app/api/**/*.ts": {
      "maxDuration": 30
    }
  },
  "headers": [
    {
      "source": "/web-dashboard/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "private, no-cache, no-store, must-revalidate"
        }
      ]
    }
  ],
  "redirects": [
    {
      "source": "/dashboard",
      "destination": "/web-dashboard",
      "permanent": true
    }
  ]
}
```

### 4. Scripts de Deployment

```json
{
  "scripts": {
    "build": "next build",
    "start": "next start",
    "deploy": "vercel --prod",
    "deploy:preview": "vercel",
    "env:pull": "vercel env pull .env.local",
    "type-check": "tsc --noEmit",
    "lint": "next lint",
    "lint:fix": "next lint --fix"
  }
}
```

## Deployment en Netlify

### 1. netlify.toml

```toml
[build]
  command = "pnpm build"
  publish = ".next"

[build.environment]
  NODE_VERSION = "18"
  NPM_FLAGS = "--prefix=/dev/null"

[[plugins]]
  package = "@netlify/plugin-nextjs"

[[headers]]
  for = "/web-dashboard/*"
  [headers.values]
    Cache-Control = "private, no-cache, no-store, must-revalidate"
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"

[[redirects]]
  from = "/dashboard"
  to = "/web-dashboard"
  status = 301

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/:splat"
  status = 200
```

### 2. Configuración de Variables

```bash
# Usando Netlify CLI
netlify env:set NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY "pk_live_..."
netlify env:set CLERK_SECRET_KEY "sk_live_..."
```

## Deployment en AWS (Amplify)

### 1. amplify.yml

```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - npm install -g pnpm
        - pnpm install
    build:
      commands:
        - pnpm run build
  artifacts:
    baseDirectory: .next
    files:
      - '**/*'
  cache:
    paths:
      - node_modules/**/*
      - .next/cache/**/*
```

### 2. Configuración de Variables de Entorno

```bash
# Usando AWS CLI
aws amplify put-app --app-id your-app-id --environment-variables \
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_... \
  CLERK_SECRET_KEY=sk_live_...
```

## Deployment con Docker

### 1. Dockerfile

```dockerfile
# Dockerfile
FROM node:18-alpine AS base

# Instalar pnpm
RUN npm install -g pnpm

# Etapa de dependencias
FROM base AS deps
WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Etapa de build
FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Variables de entorno para build
ARG NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
ARG CLERK_SECRET_KEY
ENV NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=$NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
ENV CLERK_SECRET_KEY=$CLERK_SECRET_KEY
ENV NEXT_TELEMETRY_DISABLED=1

RUN pnpm build

# Etapa de producción
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Copiar archivos de build
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
```

### 2. docker-compose.yml

```yaml
version: '3.8'

services:
  dashboard:
    build:
      context: .
      dockerfile: Dockerfile
      args:
        NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: ${NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
        CLERK_SECRET_KEY: ${CLERK_SECRET_KEY}
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=${NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
      - CLERK_SECRET_KEY=${CLERK_SECRET_KEY}
      - NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
      - NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
      - NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/web-dashboard
      - NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/web-dashboard
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - dashboard
    restart: unless-stopped
```

### 3. nginx.conf

```nginx
events {
    worker_connections 1024;
}

http {
    upstream dashboard {
        server dashboard:3000;
    }

    # Redirección HTTP a HTTPS
    server {
        listen 80;
        server_name tu-dominio.com www.tu-dominio.com;
        return 301 https://$server_name$request_uri;
    }

    # Configuración HTTPS
    server {
        listen 443 ssl http2;
        server_name tu-dominio.com www.tu-dominio.com;

        # Certificados SSL
        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
        ssl_prefer_server_ciphers off;

        # Headers de seguridad
        add_header X-Frame-Options DENY;
        add_header X-Content-Type-Options nosniff;
        add_header X-XSS-Protection "1; mode=block";
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

        # Configuración de proxy
        location / {
            proxy_pass http://dashboard;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
        }

        # Configuración de archivos estáticos
        location /_next/static {
            proxy_pass http://dashboard;
            add_header Cache-Control "public, max-age=31536000, immutable";
        }
    }
}
```

## Monitoreo y Analytics

### 1. Configuración de Sentry

```typescript
// sentry.client.config.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
  debug: false,
  integrations: [
    new Sentry.BrowserTracing({
      tracePropagationTargets: ['localhost', /^https:\/\/tu-dominio\.com/],
    }),
  ],
});
```

```typescript
// sentry.server.config.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
  debug: false,
});
```

### 2. Health Check Endpoint

```typescript
// app/api/health/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Verificar conexiones críticas
    const checks = {
      timestamp: new Date().toISOString(),
      status: 'healthy',
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
    };

    return NextResponse.json(checks, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
```

### 3. Configuración de Analytics

```typescript
// lib/analytics.ts
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Analytics />
      <SpeedInsights />
    </>
  );
}
```

## Seguridad en Producción

### 1. Configuración de CORS

```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Configurar CORS para APIs
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const response = NextResponse.next();
    
    response.headers.set('Access-Control-Allow-Origin', 'https://tu-dominio.com');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    return response;
  }
  
  return NextResponse.next();
}
```

### 2. Rate Limiting

```typescript
// lib/rate-limit.ts
import { NextRequest } from 'next/server';

const rateLimitMap = new Map();

export function rateLimit(request: NextRequest, limit = 10, window = 60000) {
  const ip = request.ip || 'anonymous';
  const now = Date.now();
  const windowStart = now - window;
  
  const requests = rateLimitMap.get(ip) || [];
  const recentRequests = requests.filter((time: number) => time > windowStart);
  
  if (recentRequests.length >= limit) {
    return false;
  }
  
  recentRequests.push(now);
  rateLimitMap.set(ip, recentRequests);
  
  return true;
}
```

### 3. Validación de Input

```typescript
// lib/validation.ts
import { z } from 'zod';

export const userUpdateSchema = z.object({
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  username: z.string().min(3).max(20).optional(),
});

export const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).max(100),
  confirmPassword: z.string().min(8).max(100),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});
```

## Optimización de Performance

### 1. Configuración de Cache

```typescript
// next.config.js
module.exports = {
  async headers() {
    return [
      {
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/images/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400',
          },
        ],
      },
    ];
  },
};
```

### 2. Bundle Analysis

```json
{
  "scripts": {
    "analyze": "ANALYZE=true next build",
    "analyze:server": "BUNDLE_ANALYZE=server next build",
    "analyze:browser": "BUNDLE_ANALYZE=browser next build"
  }
}
```

```javascript
// next.config.js
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

module.exports = withBundleAnalyzer({
  // ... resto de la configuración
});
```

## Backup y Recuperación

### 1. Script de Backup

```bash
#!/bin/bash
# backup.sh

DATE=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="/backups/dashboard_$DATE"

# Crear directorio de backup
mkdir -p $BACKUP_DIR

# Backup de código
tar -czf $BACKUP_DIR/code.tar.gz --exclude=node_modules --exclude=.next .

# Backup de variables de entorno
cp .env.production $BACKUP_DIR/

# Backup de configuración de Clerk (manual)
echo "Recuerda hacer backup manual de la configuración de Clerk"

echo "Backup completado en: $BACKUP_DIR"
```

### 2. Script de Restauración

```bash
#!/bin/bash
# restore.sh

BACKUP_PATH=$1

if [ -z "$BACKUP_PATH" ]; then
  echo "Uso: ./restore.sh /path/to/backup"
  exit 1
fi

# Restaurar código
tar -xzf $BACKUP_PATH/code.tar.gz

# Restaurar variables de entorno
cp $BACKUP_PATH/.env.production .

# Instalar dependencias
pnpm install

# Build del proyecto
pnpm build

echo "Restauración completada"
```

## Checklist de Deployment

### Pre-Deployment

- [ ] Variables de entorno configuradas
- [ ] Clerk configurado para producción
- [ ] Tests pasando
- [ ] Build exitoso
- [ ] Bundle size optimizado
- [ ] Headers de seguridad configurados
- [ ] SSL/TLS configurado
- [ ] Dominio configurado
- [ ] DNS configurado

### Post-Deployment

- [ ] Health check funcionando
- [ ] Autenticación funcionando
- [ ] Dashboard accesible
- [ ] Funcionalidades críticas probadas
- [ ] Monitoreo configurado
- [ ] Logs funcionando
- [ ] Backup configurado
- [ ] Performance verificado

### Monitoreo Continuo

- [ ] Uptime monitoring
- [ ] Error tracking
- [ ] Performance monitoring
- [ ] Security scanning
- [ ] Dependency updates
- [ ] Log analysis
- [ ] User feedback

## Troubleshooting

### Problemas Comunes

#### 1. Build Failures

```bash
# Limpiar cache
rm -rf .next
rm -rf node_modules
pnpm install
pnpm build

# Verificar variables de entorno
echo $NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
echo $CLERK_SECRET_KEY
```

#### 2. Clerk Authentication Issues

```typescript
// Verificar configuración
console.log('Clerk Config:', {
  publishableKey: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.substring(0, 10) + '...',
  signInUrl: process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL,
  afterSignInUrl: process.env.NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL,
});
```

#### 3. Performance Issues

```bash
# Analizar bundle
pnpm run analyze

# Verificar lighthouse
lighthouse https://tu-dominio.com/web-dashboard

# Verificar Core Web Vitals
npx @next/codemod@latest core-web-vitals .
```

## Conclusión

Esta guía proporciona una base sólida para desplegar el dashboard personalizado en producción. Recuerda siempre:

1. **Probar en staging** antes de producción
2. **Monitorear continuamente** el rendimiento y errores
3. **Mantener backups** regulares
4. **Actualizar dependencias** regularmente
5. **Revisar logs** de seguridad

Para más información, consulta:
- [Documentación de Next.js](https://nextjs.org/docs)
- [Documentación de Clerk](https://clerk.com/docs)
- [README del Dashboard](../app/(pages-dashboard)/README.md)
- [Documentación de Componentes](./dashboard-components.md)