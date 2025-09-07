/**
 * Ejemplos de uso del SubscriptionGate
 * Demuestra diferentes formas de proteger contenido por suscripción
 */

'use client';

import SubscriptionGate from '@/app/components/subscription/SubscriptionGate';
import { useSubscription } from '@/app/hooks/useSubscription';

export default function SubscriptionExamples() {
  const { subscription, isLoading } = useSubscription();

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-20 bg-gray-200 rounded mb-4"></div>
          <div className="h-20 bg-gray-200 rounded mb-4"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      {/* Información del usuario actual */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
        <h2 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
          Estado Actual de Suscripción
        </h2>
        <div className="text-sm text-blue-800 dark:text-blue-200">
          <p><strong>Nivel de acceso:</strong> {subscription?.accessLevel || 'OPEN'}</p>
          <p><strong>Suscripción activa:</strong> {subscription?.isSubscribed ? 'Sí' : 'No'}</p>
          {subscription?.currentPlan && (
            <p><strong>Plan actual:</strong> {subscription.currentPlan.name}</p>
          )}
        </div>
      </div>

      {/* Ejemplo 1: Contenido OPEN (siempre visible) */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
          1. Contenido Público (OPEN)
        </h2>
        <SubscriptionGate requiredLevel="OPEN">
          <div className="p-6 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
            <h3 className="text-lg font-semibold text-green-900 dark:text-green-100 mb-2">
              🌟 Introducción a la Electrónica
            </h3>
            <p className="text-green-800 dark:text-green-200">
              Este contenido es gratuito y está disponible para todos los visitantes, 
              incluso sin registrarse. Perfecto para SEO y captación de usuarios.
            </p>
            <div className="mt-4 p-3 bg-green-100 dark:bg-green-800/50 rounded">
              <p className="text-sm text-green-700 dark:text-green-300">
                💡 <strong>Consejo:</strong> Los condensadores almacenan energía eléctrica temporalmente.
              </p>
            </div>
          </div>
        </SubscriptionGate>
      </section>

      {/* Ejemplo 2: Contenido FREE (requiere login) */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
          2. Contenido Gratuito (FREE)
        </h2>
        <SubscriptionGate requiredLevel="FREE">
          <div className="p-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
              🔧 Herramientas Básicas de Diseño
            </h3>
            <p className="text-blue-800 dark:text-blue-200 mb-4">
              Accede a nuestras herramientas básicas de simulación y cálculo. 
              Solo necesitas una cuenta gratuita.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3 bg-white dark:bg-gray-800 rounded border">
                <h4 className="font-medium mb-2">Calculadora de Ley de Ohm</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Calcula voltaje, corriente y resistencia
                </p>
              </div>
              <div className="p-3 bg-white dark:bg-gray-800 rounded border">
                <h4 className="font-medium mb-2">Simulador Básico</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Circuitos simples con componentes básicos
                </p>
              </div>
            </div>
          </div>
        </SubscriptionGate>
      </section>

      {/* Ejemplo 3: Contenido PREMIUM */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
          3. Contenido Premium (PREMIUM)
        </h2>
        <SubscriptionGate requiredLevel="PREMIUM">
          <div className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg border-2 border-purple-200 dark:border-purple-800">
            <div className="flex items-center mb-3">
              <svg className="w-6 h-6 text-purple-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
              <h3 className="text-lg font-semibold text-purple-900 dark:text-purple-100">
                💎 Laboratorio Virtual Avanzado
              </h3>
            </div>
            <p className="text-purple-800 dark:text-purple-200 mb-4">
              Acceso completo a nuestro laboratorio virtual con instrumentos profesionales 
              y componentes avanzados. Simula circuitos complejos en tiempo real.
            </p>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                <h4 className="font-semibold text-purple-900 dark:text-purple-100 mb-2">
                  🔬 Osciloscopio Digital
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Análisis de señales en tiempo real con múltiples canales
                </p>
              </div>
              
              <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                <h4 className="font-semibold text-purple-900 dark:text-purple-100 mb-2">
                  ⚡ Generador de Señales
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Genera formas de onda personalizadas y complejas
                </p>
              </div>
              
              <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                <h4 className="font-semibold text-purple-900 dark:text-purple-100 mb-2">
                  📊 Analizador de Espectro
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Análisis frecuencial avanzado
                </p>
              </div>
            </div>

            <div className="mt-6 p-4 bg-purple-100 dark:bg-purple-800/50 rounded-lg">
              <h5 className="font-medium text-purple-900 dark:text-purple-100 mb-2">
                🎯 Características Exclusivas Premium:
              </h5>
              <ul className="text-sm text-purple-800 dark:text-purple-200 space-y-1">
                <li>• Exportación de circuitos a formatos profesionales (SPICE, Gerber)</li>
                <li>• Biblioteca de componentes premium (>10,000 componentes)</li>
                <li>• Simulación de PCB en 3D</li>
                <li>• Soporte técnico prioritario 24/7</li>
                <li>• Certificados de cursos acreditados</li>
              </ul>
            </div>
          </div>
        </SubscriptionGate>
      </section>

      {/* Ejemplo 4: Contenido con mensaje personalizado */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
          4. Mensaje Personalizado
        </h2>
        <SubscriptionGate 
          requiredLevel="PREMIUM"
          upgradeMessage="Desbloquea el acceso a más de 50 proyectos avanzados con nuestra suscripción Premium"
        >
          <div className="p-6 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <h3 className="text-lg font-semibold text-yellow-900 dark:text-yellow-100 mb-2">
              📚 Biblioteca de Proyectos Premium
            </h3>
            <p className="text-yellow-800 dark:text-yellow-200">
              Más de 50 proyectos paso a paso, desde básico hasta nivel experto.
            </p>
          </div>
        </SubscriptionGate>
      </section>

      {/* Ejemplo 5: Fallback personalizado */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
          5. Fallback Personalizado
        </h2>
        <SubscriptionGate 
          requiredLevel="PREMIUM"
          showUpgrade={false}
          fallback={
            <div className="p-6 bg-gray-100 dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 text-center">
              <p className="text-gray-600 dark:text-gray-400">
                Este contenido estará disponible próximamente para usuarios Premium.
              </p>
            </div>
          }
        >
          <div className="p-6 bg-green-50 rounded-lg">
            <p>Contenido premium super secreto</p>
          </div>
        </SubscriptionGate>
      </section>
    </div>
  );
}