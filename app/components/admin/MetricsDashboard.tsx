/**
 * Dashboard de métricas administrativas
 * Visualiza analytics del sistema, conversiones y rendimiento
 */

'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';

interface MetricsData {
  summary: {
    totalUsers: number;
    newUsers: number;
    activeSubscriptions: number;
    newSubscriptions: number;
    conversionRate: number;
    totalRevenue: number;
    avgRevenuePerUser: number;
  };
  growth: {
    userGrowthRate: number;
    subscriptionGrowthRate: number;
  };
  activity: {
    recentActions: Array<{ action: string; count: number }>;
    totalRecentActivity: number;
  };
  conversion: {
    funnel: {
      registrations: number;
      profileCompletions: number;
      subscriptionAttempts: number;
      successfulSubscriptions: number;
    };
    rates: {
      profileCompletionRate: number;
      subscriptionConversionRate: number;
      subscriptionSuccessRate: number;
    };
  };
  cache?: {
    subscription: {
      size: number;
      hitRate: number;
      missRate: number;
      avgAccessTime: number;
    };
    performance: {
      avgResponseTime: number;
      cacheHitLatency: number;
      cacheMissLatency: number;
      memoryUsage: number;
    };
  };
  rateLimit?: {
    subscription: { requests: number; remaining: number; resetTime: number };
    billing: { requests: number; remaining: number; resetTime: number };
    user: { requests: number; remaining: number; resetTime: number };
    public: { requests: number; remaining: number; resetTime: number };
  };
  metadata: {
    timeRange: string;
    startDate: string;
    endDate: string;
    generatedAt: string;
  };
}

interface MetricsDashboardProps {
  className?: string;
}

export function MetricsDashboard({ className = '' }: MetricsDashboardProps) {
  const { user } = useUser();
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState('7d');
  const [includeCache, setIncludeCache] = useState(false);
  const [includeRateLimit, setIncludeRateLimit] = useState(false);

  useEffect(() => {
    fetchMetrics();
  }, [timeRange, includeCache, includeRateLimit]);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        range: timeRange,
        cache: includeCache.toString(),
        rateLimit: includeRateLimit.toString(),
      });

      const response = await fetch(`/api/admin/metrics?${params}`);
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setMetrics(data.metrics);
      } else {
        throw new Error(data.message || 'Error al obtener métricas');
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      console.error('Error fetching metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-ES');
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center min-h-96 ${className}`}>
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="text-gray-600">Cargando métricas...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg p-6 ${className}`}>
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error al cargar métricas</h3>
            <p className="text-sm text-red-700 mt-1">{error}</p>
            <button
              onClick={fetchMetrics}
              className="mt-3 bg-red-600 text-white px-4 py-2 rounded-md text-sm hover:bg-red-700"
            >
              Reintentar
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className={`text-center text-gray-500 py-8 ${className}`}>
        No hay métricas disponibles
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Controles */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Panel de Métricas</h1>
            <p className="text-sm text-gray-600 mt-1">
              Última actualización: {formatDate(metrics.metadata.generatedAt)}
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="1d">Último día</option>
              <option value="7d">Últimos 7 días</option>
              <option value="30d">Últimos 30 días</option>
            </select>
            
            <div className="flex items-center gap-3">
              <label className="flex items-center text-sm">
                <input
                  type="checkbox"
                  checked={includeCache}
                  onChange={(e) => setIncludeCache(e.target.checked)}
                  className="mr-2"
                />
                Cache
              </label>
              <label className="flex items-center text-sm">
                <input
                  type="checkbox"
                  checked={includeRateLimit}
                  onChange={(e) => setIncludeRateLimit(e.target.checked)}
                  className="mr-2"
                />
                Rate Limits
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Resumen general */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Usuarios Totales</p>
              <p className="text-2xl font-semibold text-gray-900">{metrics.summary.totalUsers.toLocaleString('es-ES')}</p>
              <p className="text-xs text-green-600">+{metrics.summary.newUsers} nuevos</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Suscripciones Activas</p>
              <p className="text-2xl font-semibold text-gray-900">{metrics.summary.activeSubscriptions}</p>
              <p className="text-xs text-green-600">+{metrics.summary.newSubscriptions} nuevas</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Revenue Total</p>
              <p className="text-2xl font-semibold text-gray-900">{formatCurrency(metrics.summary.totalRevenue)}</p>
              <p className="text-xs text-gray-500">{formatCurrency(metrics.summary.avgRevenuePerUser)}/usuario</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Tasa de Conversión</p>
              <p className="text-2xl font-semibold text-gray-900">{formatPercentage(metrics.summary.conversionRate)}</p>
              <p className="text-xs text-gray-500">de usuarios a premium</p>
            </div>
          </div>
        </div>
      </div>

      {/* Funnel de conversión */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Funnel de Conversión</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="bg-blue-100 text-blue-800 text-2xl font-bold py-4 rounded-lg">
              {metrics.conversion.funnel.registrations}
            </div>
            <p className="text-sm text-gray-600 mt-2">Registros</p>
          </div>
          <div className="text-center">
            <div className="bg-indigo-100 text-indigo-800 text-2xl font-bold py-4 rounded-lg">
              {metrics.conversion.funnel.profileCompletions}
            </div>
            <p className="text-sm text-gray-600 mt-2">Perfiles Completados</p>
            <p className="text-xs text-indigo-600 mt-1">
              {formatPercentage(metrics.conversion.rates.profileCompletionRate)}
            </p>
          </div>
          <div className="text-center">
            <div className="bg-purple-100 text-purple-800 text-2xl font-bold py-4 rounded-lg">
              {metrics.conversion.funnel.subscriptionAttempts}
            </div>
            <p className="text-sm text-gray-600 mt-2">Intentos de Suscripción</p>
          </div>
          <div className="text-center">
            <div className="bg-green-100 text-green-800 text-2xl font-bold py-4 rounded-lg">
              {metrics.conversion.funnel.successfulSubscriptions}
            </div>
            <p className="text-sm text-gray-600 mt-2">Suscripciones Exitosas</p>
            <p className="text-xs text-green-600 mt-1">
              {formatPercentage(metrics.conversion.rates.subscriptionSuccessRate)}
            </p>
          </div>
        </div>
      </div>

      {/* Actividad reciente */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Actividad Reciente</h2>
        <div className="space-y-2">
          {metrics.activity.recentActions.map((action, index) => (
            <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-sm font-medium text-gray-700">{action.action.replace('_', ' ')}</span>
              <span className="text-sm text-gray-500">{action.count} veces</span>
            </div>
          ))}
        </div>
        <div className="mt-4 text-sm text-gray-600">
          Total de actividades recientes: {metrics.activity.totalRecentActivity}
        </div>
      </div>

      {/* Métricas de caché */}
      {includeCache && metrics.cache && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Rendimiento del Caché</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{formatPercentage(metrics.cache.subscription.hitRate)}</div>
              <p className="text-sm text-gray-600">Hit Rate</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{metrics.cache.performance.avgResponseTime}ms</div>
              <p className="text-sm text-gray-600">Tiempo Promedio</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{metrics.cache.performance.memoryUsage}MB</div>
              <p className="text-sm text-gray-600">Uso de Memoria</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{metrics.cache.subscription.size}</div>
              <p className="text-sm text-gray-600">Entradas Cacheadas</p>
            </div>
          </div>
        </div>
      )}

      {/* Rate limits */}
      {includeRateLimit && metrics.rateLimit && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Estado de Rate Limits</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(metrics.rateLimit).map(([key, limit]) => (
              <div key={key} className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 capitalize">{key}</h3>
                <div className="mt-2 space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Requests:</span>
                    <span className="font-medium">{limit.requests}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Remaining:</span>
                    <span className="font-medium text-green-600">{limit.remaining}</span>
                  </div>
                </div>
                <div className="mt-2">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${((limit.requests - limit.remaining) / limit.requests) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}