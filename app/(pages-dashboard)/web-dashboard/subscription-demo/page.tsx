/**
 * Página de demostración del sistema de suscripciones
 * Muestra ejemplos de contenido protegido por diferentes niveles de acceso
 */

import { Metadata } from 'next';
import SubscriptionExamples from '@/app/components/examples/SubscriptionExamples';

export const metadata: Metadata = {
  title: 'Demo Suscripciones | Dashboard',
  description: 'Demostración del sistema de control de acceso por suscripciones',
};

export default function SubscriptionDemoPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="py-8">
        {/* Header */}
        <div className="max-w-4xl mx-auto px-6 mb-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              🔐 Demo: Sistema de Suscripciones
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Esta página demuestra cómo funciona nuestro sistema de control de acceso 
              basado en suscripciones. El contenido se muestra según tu nivel de acceso actual.
            </p>
          </div>
          
          {/* Indicador de nivel de acceso */}
          <div className="mt-6 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border">
            <div className="text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                Sistema de niveles de acceso:
              </p>
              <div className="flex items-center justify-center space-x-4 text-xs">
                <span className="flex items-center px-2 py-1 bg-green-100 text-green-800 rounded">
                  OPEN - Público
                </span>
                <span className="text-gray-400">→</span>
                <span className="flex items-center px-2 py-1 bg-blue-100 text-blue-800 rounded">
                  FREE - Registrado
                </span>
                <span className="text-gray-400">→</span>
                <span className="flex items-center px-2 py-1 bg-purple-100 text-purple-800 rounded">
                  PREMIUM - Suscriptor
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Contenido de ejemplos */}
        <SubscriptionExamples />
      </div>
    </div>
  );
}