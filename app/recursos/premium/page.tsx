/**
 * Página de recursos premium
 * Acceso: PREMIUM (requiere suscripción activa)
 * Esta ruta debe estar protegida por el middleware
 */

export default function RecursosPremiumPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 py-8">
      <div className="max-w-4xl mx-auto px-6">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <svg className="w-12 h-12 text-purple-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
            <h1 className="text-4xl font-bold text-purple-900 dark:text-purple-100">
              💎 Recursos Premium
            </h1>
          </div>
          <p className="text-lg text-purple-700 dark:text-purple-300 max-w-2xl mx-auto">
            ¡Felicidades! Has accedido exitosamente a la zona premium. 
            Solo los suscriptores con nivel PREMIUM pueden ver este contenido.
          </p>
        </div>

        <div className="space-y-6">
          {/* Card de bienvenida */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 border-2 border-purple-200 dark:border-purple-700">
            <h2 className="text-2xl font-bold text-purple-900 dark:text-purple-100 mb-4">
              🎉 ¡Bienvenido a Premium!
            </h2>
            <p className="text-purple-700 dark:text-purple-300 mb-6">
              Si puedes ver esta página, significa que:
            </p>
            <ul className="space-y-2 text-purple-600 dark:text-purple-400">
              <li className="flex items-center">
                <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Estás autenticado con Clerk
              </li>
              <li className="flex items-center">
                <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Tienes una suscripción Premium activa
              </li>
              <li className="flex items-center">
                <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                El middleware permitió tu acceso
              </li>
            </ul>
          </div>

          {/* Contenido exclusivo */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-semibold text-purple-900 dark:text-purple-100 mb-4">
                🔬 Laboratorio Virtual
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Acceso completo a instrumentos de medición profesionales:
              </p>
              <ul className="text-sm text-gray-500 dark:text-gray-400 space-y-1">
                <li>• Osciloscopio digital de 4 canales</li>
                <li>• Generador de funciones</li>
                <li>• Analizador de espectro</li>
                <li>• Multímetro de precisión</li>
              </ul>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-semibold text-purple-900 dark:text-purple-100 mb-4">
                📚 Biblioteca Premium
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Recursos exclusivos para suscriptores:
              </p>
              <ul className="text-sm text-gray-500 dark:text-gray-400 space-y-1">
                <li>• +50 proyectos avanzados</li>
                <li>• Datasheets y documentación técnica</li>
                <li>• Cursos certificados</li>
                <li>• Simulaciones SPICE profesionales</li>
              </ul>
            </div>
          </div>

          {/* Debug info */}
          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              🔍 Información de Debug
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600 dark:text-gray-400">
              <div>
                <strong>Ruta:</strong> /recursos/premium
              </div>
              <div>
                <strong>Nivel requerido:</strong> PREMIUM
              </div>
              <div>
                <strong>Middleware:</strong> ✅ Aprobado
              </div>
              <div>
                <strong>Acceso:</strong> ✅ Concedido
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}