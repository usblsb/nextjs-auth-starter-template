'use client';

import { useUser } from '@clerk/nextjs';
import { useState, useCallback } from 'react';
import DashboardSidebar from './dashboard-sidebar';
import DashboardContent from './dashboard-content';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

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
      <div className="w-full space-y-4">
        {/* Mobile: Stack vertical de skeleton cards */}
        <div className="flex flex-col space-y-4 lg:hidden">
          <div className="space-y-3">
            <Skeleton className="h-4 w-[250px]" />
            <Skeleton className="h-4 w-[200px]" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
          <Skeleton className="h-[200px] w-full" />
        </div>
        
        {/* Desktop: Grid layout skeleton */}
        <div className="hidden lg:block">
          <div className="grid lg:grid-cols-4 lg:gap-8">
            <div className="lg:col-span-1 space-y-2">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
            <div className="lg:col-span-3">
              <Skeleton className="h-[300px] w-full" />
            </div>
          </div>
        </div>
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
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>{dashboardState.error}</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-4 w-4 p-0 hover:bg-transparent"
              onClick={() => handleError('')}
            >
              <X className="h-3 w-3" />
              <span className="sr-only">Cerrar</span>
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Layout principal del dashboard - Mobile First */}
      <div className="w-full">
        {/* Mobile: Stack vertical */}
        <div className="flex flex-col space-y-6 lg:hidden">
          <DashboardSidebar
            activeSection={dashboardState.activeSection}
            onSectionChange={handleSectionChange}
            className="w-full"
          />
          <DashboardContent
            activeSection={dashboardState.activeSection}
            user={user}
            isLoading={dashboardState.isLoading}
            onError={handleError}
            onLoading={handleLoading}
            className="w-full"
          />
        </div>

        {/* Tablet & Desktop: Grid layout */}
        <div className="hidden lg:grid lg:grid-cols-4 lg:gap-8">
          {/* Sidebar de navegación */}
          <div className="lg:col-span-1">
            <DashboardSidebar
              activeSection={dashboardState.activeSection}
              onSectionChange={handleSectionChange}
              className="sticky top-6"
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
    </div>
  );
}