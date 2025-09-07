/**
 * Página de introducción pública
 * Acceso: OPEN (accesible sin login para SEO)
 * Esta ruta debe ser accesible por todos los visitantes
 */

export default function CursoIntroduccionPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 py-8">
      <div className="max-w-4xl mx-auto px-6">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <svg className="w-12 h-12 text-green-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <h1 className="text-4xl font-bold text-green-900 dark:text-green-100">
              🌟 Introducción a la Electrónica
            </h1>
          </div>
          <p className="text-lg text-green-700 dark:text-green-300 max-w-2xl mx-auto">
            ¡Bienvenido! Este curso introductorio es completamente gratuito y accesible 
            para todos los visitantes. No necesitas registrarte para acceder a este contenido.
          </p>
        </div>

        <div className="space-y-6">
          {/* Información de acceso */}
          <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 rounded-lg p-6">
            <div className="flex items-center mb-4">
              <svg className="w-6 h-6 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <h2 className="text-xl font-semibold text-green-900 dark:text-green-100">
                ✅ Contenido Público (OPEN)
              </h2>
            </div>
            <p className="text-green-800 dark:text-green-200">
              Este contenido está disponible para:
            </p>
            <ul className="mt-2 text-green-700 dark:text-green-300 space-y-1">
              <li>• Visitantes no registrados</li>
              <li>• Usuarios gratuitos</li>
              <li>• Usuarios premium</li>
              <li>• Motores de búsqueda (SEO optimizado)</li>
            </ul>
          </div>

          {/* Contenido del curso */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                🔋 Conceptos Básicos
              </h3>
              <ul className="text-gray-600 dark:text-gray-400 space-y-2">
                <li>• ¿Qué es la electricidad?</li>
                <li>• Voltaje, corriente y resistencia</li>
                <li>• Ley de Ohm</li>
                <li>• Circuitos básicos</li>
                <li>• Componentes fundamentales</li>
              </ul>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                🛠️ Primeros Pasos
              </h3>
              <ul className="text-gray-600 dark:text-gray-400 space-y-2">
                <li>• Herramientas básicas</li>
                <li>• Multímetro para principiantes</li>
                <li>• Protoboard y conexiones</li>
                <li>• Primer circuito LED</li>
                <li>• Seguridad eléctrica</li>
              </ul>
            </div>
          </div>

          {/* Llamada a la acción */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/30 dark:to-purple-900/30 rounded-lg p-6 border border-blue-200 dark:border-blue-700">
            <div className="text-center">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3">
                ¿Quieres continuar aprendiendo?
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Regístrate gratis para acceder a más contenido y cursos avanzados.
              </p>
              <div className="space-x-4">
                <a
                  href="/sign-up"
                  className="inline-flex items-center px-6 py-3 text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-md transition-colors"
                >
                  Registro Gratuito
                </a>
                <a
                  href="/web-dashboard/billing"
                  className="inline-flex items-center px-6 py-3 text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-lg shadow-md transition-all"
                >
                  💎 Ver Premium
                </a>
              </div>
            </div>
          </div>

          {/* Debug info */}
          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              🔍 Información Técnica
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600 dark:text-gray-400">
              <div>
                <strong>Ruta:</strong> /cursos/introduccion
              </div>
              <div>
                <strong>Nivel requerido:</strong> OPEN
              </div>
              <div>
                <strong>Acceso:</strong> ✅ Público (sin middleware blocking)
              </div>
              <div>
                <strong>SEO:</strong> ✅ Indexable por Google
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}