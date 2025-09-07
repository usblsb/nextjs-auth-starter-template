/**
 * Página de Facturación del Dashboard
 * Muestra estado de suscripción, planes disponibles y portal de Stripe
 */

import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { BillingDashboard } from '@/app/components/billing/BillingDashboard';

export default async function BillingPage() {
  const { userId } = await auth();
  
  if (!userId) {
    redirect('/sign-in');
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Facturación y Suscripción
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Gestiona tu suscripción, métodos de pago y acceso a contenido premium
        </p>
      </div>

      <BillingDashboard userId={userId} />
    </div>
  );
}

export const metadata = {
  title: 'Facturación - Academia de Electrónica',
  description: 'Gestiona tu suscripción y acceso a contenido premium',
};