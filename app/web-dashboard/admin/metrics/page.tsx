/**
 * Página del dashboard administrativo
 * /web-dashboard/admin/metrics - Panel de métricas y analytics
 */

import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { MetricsDashboard } from '@/app/components/admin/MetricsDashboard';
import { isUserAdmin } from '@/lib/services/adminService';

export default async function AdminMetricsPage() {
  // Verificar autenticación
  const { userId } = await auth();
  
  if (!userId) {
    redirect('/sign-in');
  }

  // Verificar rol de administrador
  const isAdmin = await isUserAdmin(userId);
  
  if (!isAdmin) {
    redirect('/web-dashboard'); // Redirigir al dashboard normal si no es admin
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <MetricsDashboard />
      </div>
    </div>
  );
}