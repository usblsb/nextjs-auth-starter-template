/**
 * Página de prueba del sistema de suscripciones
 * Acceso: FREE (requiere login pero no suscripción)
 */

import SubscriptionGate from '@/app/components/subscription/SubscriptionGate';

export default function TestSubscriptionPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            🧪 Prueba del Sistema de Suscripciones
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Esta página requiere nivel FREE (estar logueado) según el middleware
          </p>
        </div>

        <div className="space-y-8">
          {/* Contenido OPEN - siempre visible */}
          <section>
            <h2 className="text-xl font-bold mb-4">Contenido Público (OPEN)</h2>
            <SubscriptionGate requiredLevel="OPEN">
              <div className="p-6 bg-green-50 rounded-lg border border-green-200">
                <h3 className="font-semibold text-green-900 mb-2">✅ Visible para todos</h3>
                <p className="text-green-800">
                  Este contenido es visible para cualquier visitante, sin necesidad de login.
                </p>
              </div>
            </SubscriptionGate>
          </section>

          {/* Contenido FREE - requiere login */}
          <section>
            <h2 className="text-xl font-bold mb-4">Contenido Gratuito (FREE)</h2>
            <SubscriptionGate requiredLevel="FREE">
              <div className="p-6 bg-blue-50 rounded-lg border border-blue-200">
                <h3 className="font-semibold text-blue-900 mb-2">🔒 Solo usuarios registrados</h3>
                <p className="text-blue-800">
                  Este contenido requiere estar logueado. Si puedes ver esto, 
                  significa que el middleware te permitió acceder a esta página y 
                  tienes al menos nivel FREE.
                </p>
              </div>
            </SubscriptionGate>
          </section>

          {/* Contenido PREMIUM - requiere suscripción */}
          <section>
            <h2 className="text-xl font-bold mb-4">Contenido Premium (PREMIUM)</h2>
            <SubscriptionGate requiredLevel="PREMIUM">
              <div className="p-6 bg-purple-50 rounded-lg border border-purple-200">
                <h3 className="font-semibold text-purple-900 mb-2">💎 Solo suscriptores Premium</h3>
                <p className="text-purple-800">
                  Este contenido requiere una suscripción Premium activa. 
                  Si puedes ver esto, ¡felicidades! Eres un usuario Premium.
                </p>
              </div>
            </SubscriptionGate>
          </section>

          {/* Información de debug */}
          <section>
            <h2 className="text-xl font-bold mb-4">🔍 Debug Info</h2>
            <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm">
              <p className="text-gray-700 dark:text-gray-300">
                <strong>Ruta actual:</strong> /test-subscription
              </p>
              <p className="text-gray-700 dark:text-gray-300">
                <strong>Nivel requerido por middleware:</strong> FREE (según protectedRoutes)
              </p>
              <p className="text-gray-700 dark:text-gray-300">
                <strong>Estado:</strong> Si puedes ver esta página, el middleware te permitió acceder
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}