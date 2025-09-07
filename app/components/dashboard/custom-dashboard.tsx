'use client';

import { useUser } from '@clerk/nextjs';
import { useState, useCallback } from 'react';
import DashboardSidebar from './dashboard-sidebar';
import DashboardContent from './dashboard-content';

interface CustomDashboardProps {
  appearance?: {
    elements?: Record<string, string>;
    variables?: Record<string, string>;
  };
}

type DashboardSection = 'profile' | 'security' | 'billing';

interface DashboardState {
  activeSection: DashboardSection;
  isLoading: boolean;
  error: string | null;
}

export default function CustomDashboard({ appearance }: CustomDashboardProps) {
  const { isLoaded, isSignedIn, user } = useUser();
  
  const [dashboardState, setDashboardState] = useState<DashboardState>({
    activeSection: 'profile',
    isLoading: false,
    error: null
  });

  // Función para cambiar de sección
  const handleSectionChange = useCallback((section: DashboardSection) => {
    setDashboardState(prev => ({
      ...prev,
      activeSection: section,
      error: null // Limpiar errores al cambiar de sección
    }));
  }, []);

  // Función para manejar errores
  const handleError = useCallback((error: string) => {
    setDashboardState(prev => ({
      ...prev,
      error,
      isLoading: false
    }));
  }, []);

  // Función para manejar estados de carga
  const handleLoading = useCallback((isLoading: boolean) => {
    setDashboardState(prev => ({
      ...prev,
      isLoading
    }));
  }, []);

  // Mostrar loading mientras se carga la información del usuario
  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Cargando perfil...</span>
      </div>
    );
  }

  // Si no está autenticado, mostrar mensaje
  if (!isSignedIn || !user) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Acceso no autorizado
          </h2>
          <p className="text-gray-600">
            Debes iniciar sesión para acceder a esta página.
          </p>
        </div>
      </div>
    );
  }

  // Renderizar el dashboard personalizado
  return (
    <div className="w-full">
      {/* Mostrar error global si existe */}
      {dashboardState.error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-800">{dashboardState.error}</p>
            </div>
            <div className="ml-auto pl-3">
              <button
                type="button"
                className="inline-flex text-red-400 hover:text-red-600"
                onClick={() => handleError('')}
              >
                <span className="sr-only">Cerrar</span>
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Layout principal del dashboard */}
      <div className="lg:grid lg:grid-cols-4 lg:gap-8">
        {/* Sidebar de navegación */}
        <div className="lg:col-span-1">
          <DashboardSidebar
            activeSection={dashboardState.activeSection}
            onSectionChange={handleSectionChange}
            className="mb-8 lg:mb-0"
          />
        </div>

        {/* Contenido principal */}
        <div className="lg:col-span-3">
          <DashboardContent
            activeSection={dashboardState.activeSection}
            user={user}
            isLoading={dashboardState.isLoading}
            onError={handleError}
            onLoading={handleLoading}
            className=""
          />
        </div>
      </div>
    </div>
  );
}