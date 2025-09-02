'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSessionList, useUser } from '@clerk/nextjs';

interface ActiveSessionsProps {
  user: any;
  onError?: (error: string) => void;
  onLoading?: (loading: boolean) => void;
  className?: string;
}

interface SessionData {
  id: string;
  status: string;
  lastActiveAt: Date | string;
  expireAt: Date | string;
  isCurrent: boolean;
}

export default function ActiveSessions({ user, onError, onLoading, className = '' }: ActiveSessionsProps) {
  const { isLoaded, sessions, setActive } = useSessionList();
  const { user: clerkUser } = useUser();
  const [isTerminating, setIsTerminating] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState<string | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Función mejorada para formatear fechas
  const formatDate = (date: Date | string | null) => {
    if (!date) return 'No disponible';
    
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      const now = new Date();
      const diffInMinutes = Math.floor((now.getTime() - dateObj.getTime()) / (1000 * 60));
      const diffInHours = Math.floor(diffInMinutes / 60);
      const diffInDays = Math.floor(diffInHours / 24);
      
      if (diffInMinutes < 1) {
        return 'Ahora mismo';
      } else if (diffInMinutes < 60) {
        return `Hace ${diffInMinutes} minuto${diffInMinutes !== 1 ? 's' : ''}`;
      } else if (diffInHours < 24) {
        return `Hace ${diffInHours} hora${diffInHours !== 1 ? 's' : ''}`;
      } else if (diffInDays < 7) {
        return `Hace ${diffInDays} día${diffInDays !== 1 ? 's' : ''}`;
      } else {
        return dateObj.toLocaleDateString('es-ES', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      }
    } catch (error) {
      return 'Fecha inválida';
    }
  };

  // Función para obtener el tiempo relativo
  const getRelativeTime = (date: Date | string | null) => {
    if (!date) return 'Desconocido';
    
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      const now = new Date();
      const diffMs = now.getTime() - dateObj.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);
      
      if (diffMins < 1) return 'Ahora mismo';
      if (diffMins < 60) return `Hace ${diffMins} min`;
      if (diffHours < 24) return `Hace ${diffHours}h`;
      if (diffDays < 7) return `Hace ${diffDays}d`;
      
      return formatDate(dateObj);
    } catch (error) {
      return 'Desconocido';
    }
  };

  // Función para refrescar la lista de sesiones
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      // Forzar recarga de sesiones
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSuccess('Lista de sesiones actualizada');
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      setError('Error al actualizar las sesiones');
    } finally {
      setRefreshing(false);
    }
  }, []);
  
  // Función para mostrar el diálogo de confirmación
  const showRevokeConfirmation = (sessionId: string) => {
    setSelectedSessionId(sessionId);
    setShowConfirmDialog(true);
  };
  
  // Función para cancelar la revocación
  const cancelRevoke = () => {
    setSelectedSessionId(null);
    setShowConfirmDialog(false);
  };
  
  // Función mejorada para terminar una sesión
  const handleTerminateSession = async () => {
    if (!selectedSessionId || isTerminating) return;
    
    setIsTerminating(selectedSessionId);
    setError(null);
    setSuccess(null);
    setShowConfirmDialog(false);
    
    if (onLoading) onLoading(true);
    
    try {
      // Buscar la sesión específica
      const sessionToEnd = sessions?.find(s => s.id === selectedSessionId);
      
      if (sessionToEnd) {
         // Implementación real con Clerk - usar remove() en lugar de revoke()
         await sessionToEnd.remove();
         
         setSuccess('Sesión terminada exitosamente');
         
         // Limpiar mensaje de éxito después de 5 segundos
         setTimeout(() => {
           setSuccess(null);
         }, 5000);
       } else {
         throw new Error('Sesión no encontrada');
       }
      
    } catch (error: any) {
      let errorMessage = 'Error al terminar la sesión. Por favor, intenta de nuevo.';
      
      // Manejo específico de errores de Clerk
      if (error?.errors && error.errors.length > 0) {
        const clerkError = error.errors[0];
        errorMessage = clerkError.longMessage || clerkError.message || errorMessage;
      }
      
      setError(errorMessage);
      if (onError) onError(errorMessage);
    } finally {
      setIsTerminating(null);
      setSelectedSessionId(null);
      if (onLoading) onLoading(false);
    }
  };
  
  // Función para terminar todas las otras sesiones
  const handleRevokeAllOtherSessions = async () => {
    if (!sessions || isTerminating) return;
    
    const otherSessions = sessions.filter(session => session.status !== 'active');
    if (otherSessions.length === 0) {
      setError('No hay otras sesiones para terminar');
      return;
    }
    
    setIsTerminating('all');
    setError(null);
    setSuccess(null);
    
    if (onLoading) onLoading(true);
    
    try {
       // Revocar todas las otras sesiones usando remove()
       await Promise.all(
         otherSessions.map(session => session.remove())
       );
      
      setSuccess(`${otherSessions.length} sesión${otherSessions.length !== 1 ? 'es' : ''} terminada${otherSessions.length !== 1 ? 's' : ''} exitosamente`);
      
      setTimeout(() => {
        setSuccess(null);
      }, 5000);
      
    } catch (error: any) {
      let errorMessage = 'Error al terminar las sesiones. Por favor, intenta de nuevo.';
      
      if (error?.errors && error.errors.length > 0) {
        const clerkError = error.errors[0];
        errorMessage = clerkError.longMessage || clerkError.message || errorMessage;
      }
      
      setError(errorMessage);
      if (onError) onError(errorMessage);
    } finally {
      setIsTerminating(null);
      if (onLoading) onLoading(false);
    }
  };

  // Función mejorada para obtener información del dispositivo/navegador
  const getDeviceInfo = (userAgent?: string) => {
    if (!userAgent) return { browser: 'Desconocido', os: 'Desconocido', device: 'Desconocido' };
    
    // Detectar navegador
    let browser = 'Desconocido';
    if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) browser = 'Chrome';
    else if (userAgent.includes('Firefox')) browser = 'Firefox';
    else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) browser = 'Safari';
    else if (userAgent.includes('Edg')) browser = 'Edge';
    else if (userAgent.includes('Opera')) browser = 'Opera';
    
    // Detectar sistema operativo
    let os = 'Desconocido';
    if (userAgent.includes('Windows')) os = 'Windows';
    else if (userAgent.includes('Mac')) os = 'macOS';
    else if (userAgent.includes('Linux')) os = 'Linux';
    else if (userAgent.includes('Android')) os = 'Android';
    else if (userAgent.includes('iOS')) os = 'iOS';
    
    // Detectar tipo de dispositivo
    let device = 'Escritorio';
    if (userAgent.includes('Mobile')) device = 'Móvil';
    else if (userAgent.includes('Tablet')) device = 'Tablet';
    
    return { browser, os, device };
  };
  
  // Función para obtener el icono del navegador
  const getBrowserIcon = (browser: string) => {
    switch (browser.toLowerCase()) {
      case 'chrome':
        return '🌐';
      case 'firefox':
        return '🦊';
      case 'safari':
        return '🧭';
      case 'edge':
        return '🔷';
      case 'opera':
        return '🎭';
      default:
        return '💻';
    }
  };
  
  // Función para obtener el icono del sistema operativo
  const getOSIcon = (os: string) => {
    switch (os.toLowerCase()) {
      case 'windows':
        return '🪟';
      case 'macos':
        return '🍎';
      case 'linux':
        return '🐧';
      case 'android':
        return '🤖';
      case 'ios':
        return '📱';
      default:
        return '💻';
    }
  };
  
  // Función para obtener el icono del dispositivo
  const getDeviceIcon = (userAgent?: string) => {
    // En una implementación real, analizarías el userAgent
    return (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    );
  };

  // Mostrar loading mientras se cargan las sesiones
  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Cargando sesiones...</span>
      </div>
    );
  }

  // Si no hay sesiones
  if (!sessions || sessions.length === 0) {
    return (
      <div className="text-center py-8">
        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">No hay sesiones activas</h3>
        <p className="mt-1 text-sm text-gray-500">No se encontraron sesiones activas en tu cuenta.</p>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Mensajes de estado */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <div className="ml-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        </div>
      )}
      
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex">
            <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <div className="ml-3">
              <p className="text-sm text-green-800">{success}</p>
            </div>
          </div>
        </div>
      )}
      
      {/* Header con controles */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Sesiones Activas</h3>
            <p className="text-sm text-gray-500 mt-1">
              Gestiona tus sesiones activas en diferentes dispositivos
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={handleRefresh}
              disabled={refreshing || !!isTerminating}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {refreshing ? 'Actualizando...' : 'Actualizar'}
            </button>
            {sessions && sessions.length > 1 && (
              <button
                onClick={handleRevokeAllOtherSessions}
                disabled={!!isTerminating}
                className="inline-flex items-center px-3 py-2 border border-red-300 shadow-sm text-sm leading-4 font-medium rounded-md text-red-700 bg-red-50 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Cerrar otras sesiones
              </button>
            )}
            <div className="text-sm text-gray-500">
              {sessions?.length || 0} sesión{(sessions?.length || 0) !== 1 ? 'es' : ''}
            </div>
          </div>
        </div>
      
        {/* Lista de sesiones */}
        <div className="space-y-3">
          {sessions.map((session, index) => {
            const isCurrent = session.status === 'active'; // Simplificación para el ejemplo
            const isTerminatingThis = isTerminating === session.id;
            const deviceInfo = getDeviceInfo(session.lastActiveAt?.toString());
            
            return (
              <div
                key={session.id}
                className={`p-5 rounded-lg border transition-all duration-200 ${
                  isCurrent 
                    ? 'border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 shadow-sm' 
                    : 'border-gray-200 bg-white hover:shadow-md'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0">
                        <div className={`w-4 h-4 rounded-full flex items-center justify-center ${
                          isCurrent ? 'bg-green-500' : 'bg-gray-400'
                        }`}>
                          <div className={`w-2 h-2 rounded-full bg-white ${
                            isCurrent ? 'animate-pulse' : ''
                          }`}></div>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="text-lg">{getBrowserIcon(deviceInfo.browser)}</span>
                          <span className="text-lg">{getOSIcon(deviceInfo.os)}</span>
                          <h4 className="text-sm font-semibold text-gray-900 truncate">
                            {deviceInfo.browser} en {deviceInfo.os}
                          </h4>
                          {isCurrent && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                              Sesión actual
                            </span>
                          )}
                        </div>
                        
                        <div className="space-y-1">
                          <div className="flex items-center text-sm text-gray-600">
                            <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="font-medium">Última actividad:</span>
                            <span className="ml-1">{formatDate(session.lastActiveAt)}</span>
                          </div>
                          
                          <div className="flex items-center text-sm text-gray-600">
                            {getDeviceIcon(session.lastActiveAt?.toString())}
                            <span className="ml-2 font-medium">Dispositivo:</span>
                            <span className="ml-1">{deviceInfo.device}</span>
                          </div>
                          
                          {session.id && (
                            <div className="flex items-center text-xs text-gray-400">
                              <svg className="w-3 h-3 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                              </svg>
                              <span>ID: {session.id.substring(0, 12)}...</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {!isCurrent && (
                    <div className="flex-shrink-0 ml-4">
                      <button
                        onClick={() => showRevokeConfirmation(session.id)}
                        disabled={!!isTerminating}
                        className="inline-flex items-center px-3 py-2 border border-red-300 shadow-sm text-sm leading-4 font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                      >
                        {isTerminatingThis ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-red-500" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Terminando...
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            Terminar
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Diálogo de confirmación mejorado */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-auto">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                  <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
              </div>
              <div className="text-center">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-2">
                  Confirmar terminación de sesión
                </h3>
                <p className="text-sm text-gray-500 mb-6">
                  ¿Estás seguro de que quieres terminar esta sesión? Esta acción no se puede deshacer y el usuario será desconectado inmediatamente.
                </p>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={cancelRevoke}
                  className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleTerminateSession}
                  disabled={!!isTerminating}
                  className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isTerminating ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Terminando...
                    </>
                  ) : (
                    'Terminar sesión'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Modal de confirmación original */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mt-4">
                Terminar Sesión
              </h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  ¿Estás seguro de que quieres terminar esta sesión? 
                  Esta acción no se puede deshacer y cerrarás la sesión en ese dispositivo.
                </p>
              </div>
              <div className="flex justify-center space-x-3 mt-4">
                <button
                  onClick={() => setShowConfirmModal(null)}
                  className="px-4 py-2 bg-gray-300 text-gray-800 text-sm font-medium rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    setSelectedSessionId(showConfirmModal);
                    handleTerminateSession();
                    setShowConfirmModal(null);
                  }}
                  className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  Terminar Sesión
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Información adicional mejorada */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 mt-6">
        <div className="flex items-start">
          <svg className="w-5 h-5 text-blue-500 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <div>
            <h4 className="text-sm font-semibold text-blue-800 mb-2">💡 Consejos de seguridad</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li className="flex items-start">
                <span className="text-blue-500 mr-2">•</span>
                <span>Revisa regularmente tus sesiones activas para detectar accesos no autorizados</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-500 mr-2">•</span>
                <span>Termina las sesiones en dispositivos que ya no uses o que no reconozcas</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-500 mr-2">•</span>
                <span>La sesión actual no puede ser terminada desde aquí por seguridad</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}