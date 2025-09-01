import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Definir las rutas que requieren autenticación
// Solo la ruta /dashboard y sus subrutas necesitan login
const isProtectedRoute = createRouteMatcher(["/dashboard(.*)"]);

// Middleware de Clerk que maneja la autenticación
export default clerkMiddleware(async (auth, req) => {
	// Solo proteger las rutas definidas en isProtectedRoute
	// Todas las demás rutas son públicas (incluyendo /, /sign-in, /sign-out, etc.)
	if (isProtectedRoute(req)) await auth.protect();
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
