/**
 * Address Element en modo solo lectura
 * Muestra los datos capturados del modal anterior
 * Configurado para países: España, EU, Norte América, Sur América
 */

'use client';

import { AddressElement } from '@stripe/react-stripe-js';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { BillingAddress } from '../billing/BillingAddressForm';

interface AddressElementReadOnlyProps {
  billingAddress: BillingAddress;
  className?: string;
}

export function AddressElementReadOnly({ 
  billingAddress, 
  className = '' 
}: AddressElementReadOnlyProps) {
  
  // Configuración de países según documento de migración
  const allowedCountries = [
    // España (principal)
    'ES',
    // Unión Europea
    'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK', 'SI', 'SE',
    // Norte América
    'US', 'CA', 'MX',
    // Sur América principales
    'AR', 'BR', 'CL', 'CO', 'PE', 'UY', 'VE', 'EC', 'BO', 'PY'
  ];

  console.log('🌍 Countries configured for Address Element:', allowedCountries.length, 'countries');

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Dirección de facturación</CardTitle>
          <CardDescription>
            Esta información se usará para el cálculo de impuestos y facturación
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AddressElement
            options={{
              mode: 'billing',
              allowedCountries,
              fields: {
                phone: 'never', // No pedimos teléfono
              },
              // Removido validation.phone porque phone está en 'never'
              // Pre-llenar con datos del modal (pero permitir edición para testing)
              defaultValues: {
                name: '', // Se llenará desde Clerk si es necesario
                address: {
                  line1: billingAddress.line1,
                  line2: billingAddress.line2 || '',
                  city: billingAddress.city,
                  postal_code: billingAddress.postalCode,
                  country: billingAddress.country,
                  state: billingAddress.state || '',
                },
              },
              display: {
                name: 'split', // Mostrar campos de nombre separados
              },
            }}
            onChange={(event) => {
              console.log('📍 Address changed:', event.value);
            }}
          />
          
          {/* Indicador visual de solo lectura */}
          <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded text-sm text-blue-700">
            ℹ️ Si necesitas cambiar la dirección, regresa al paso anterior
          </div>
        </CardContent>
      </Card>
    </div>
  );
}