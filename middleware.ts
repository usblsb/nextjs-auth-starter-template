import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { subscriptionMiddleware } from "@/lib/middleware/subscriptionMiddleware";

// Definir las rutas que requieren autenticación básica de Clerk
const isPublicRoute = createRouteMatcher(["/sign-in(.*)", "/sign-up(.*)", "/sign-out(.*)"]);

// Definir las rutas de API interna que no requieren autenticación
const isInternalApiRoute = createRouteMatcher(["/api/internal/(.*)"]);

// Definir las rutas de API públicas de Stripe (planes, etc) y debug
const isPublicStripeApiRoute = createRouteMatcher(["/api/stripe/plans", "/api/debug/(.*)"]);

// Definir las rutas de webhooks que no requieren autenticación
const isWebhookRoute = createRouteMatcher(["/api/webhooks/(.*)"]);

// Middleware integrado: Clerk Authentication + Subscription Access Control
export default clerkMiddleware(async (auth, req) => {
	try {
		// 1. Obtener información de autenticación de Clerk
		const { userId } = await auth();
		
		// 2. Las rutas públicas de autenticación siempre pasan
		if (isPublicRoute(req)) {
			return NextResponse.next();
		}
		
		// 3. Las rutas de API interna también pasan (para uso interno del middleware)
		if (isInternalApiRoute(req)) {
			return NextResponse.next();
		}
		
		// 4. Las rutas de API públicas de Stripe también pasan
		if (isPublicStripeApiRoute(req)) {
			return NextResponse.next();
		}
		
		// 5. Las rutas de webhooks no requieren autenticación
		if (isWebhookRoute(req)) {
			return NextResponse.next();
		}
		
		// 6. Verificar acceso basado en suscripción
		const subscriptionCheck = await subscriptionMiddleware(req, userId);
		
		if (subscriptionCheck.shouldRedirect && subscriptionCheck.redirectUrl) {
			// Crear respuesta de redirección con información de acceso
			const response = NextResponse.redirect(new URL(subscriptionCheck.redirectUrl, req.url));
			
			// Agregar headers informativos para debugging
			if (subscriptionCheck.accessInfo) {
				response.headers.set('X-Access-Required', subscriptionCheck.accessInfo.requiredLevel);
				response.headers.set('X-User-Level', subscriptionCheck.accessInfo.userLevel);
				if (subscriptionCheck.accessInfo.reason) {
					response.headers.set('X-Access-Reason', subscriptionCheck.accessInfo.reason);
				}
			}
			
			return response;
		}
		
		// 7. Si llegamos aquí, el usuario tiene acceso - continuar con la request
		return NextResponse.next();
		
	} catch (error) {
		console.error('❌ Middleware error:', error);
		
		// En caso de error, redireccionar a página de error o login
		return NextResponse.redirect(new URL('/sign-in?error=middleware', req.url));
	}
});

// Configuración del matcher para definir en qué rutas se ejecuta el middleware
export const config = {
	matcher: [
		// Excluir archivos internos de Next.js y archivos estáticos
		// Solo se ejecuta en rutas de páginas, no en assets
		"/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
		// Siempre ejecutar para rutas de API
		"/(api|trpc)(.*)",
	],
};
