/**
 * Componente para capturar dirección de facturación
 * Incluye validación de códigos postales españoles y cálculo de impuestos en tiempo real
 */

'use client';

import { useState, useEffect } from 'react';
import { isCanaryIslandsPostalCode } from '@/lib/services/taxService';

export interface BillingAddress {
  country: string;
  postalCode: string;
  city: string;
  state?: string;
  line1: string;
  line2?: string;
}

interface BillingAddressFormProps {
  onAddressChange: (address: BillingAddress, isValid: boolean) => void;
  onTaxInfoChange?: (taxInfo: TaxPreview) => void;
  initialData?: Partial<BillingAddress>;
  showTaxPreview?: boolean;
  className?: string;
}

export interface TaxPreview {
  region: 'mainland' | 'canary_islands';
  description: string;
  rate: number;
  isCanaryIslands: boolean;
  country: string;
}

export function BillingAddressForm({ 
  onAddressChange, 
  onTaxInfoChange,
  initialData = {},
  showTaxPreview = true,
  className = '' 
}: BillingAddressFormProps) {
  const [address, setAddress] = useState<BillingAddress>({
    country: 'ES',
    postalCode: '',
    city: '',
    state: '',
    line1: '',
    line2: '',
    ...initialData,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [taxPreview, setTaxPreview] = useState<TaxPreview | null>(null);
  const [loadingTax, setLoadingTax] = useState(false);

  // Lista de provincias españolas principales
  const spanishProvinces = [
    'Álava', 'Albacete', 'Alicante', 'Almería', 'Asturias', 'Ávila', 'Badajoz', 'Barcelona',
    'Burgos', 'Cáceres', 'Cádiz', 'Cantabria', 'Castellón', 'Ciudad Real', 'Córdoba',
    'Cuenca', 'Girona', 'Granada', 'Guadalajara', 'Guipúzcoa', 'Huelva', 'Huesca',
    'Jaén', 'La Coruña', 'La Rioja', 'Las Palmas', 'León', 'Lérida', 'Lugo',
    'Madrid', 'Málaga', 'Murcia', 'Navarra', 'Orense', 'Palencia', 'Pontevedra',
    'Salamanca', 'Santa Cruz de Tenerife', 'Segovia', 'Sevilla', 'Soria', 'Tarragona',
    'Teruel', 'Toledo', 'Valencia', 'Valladolid', 'Vizcaya', 'Zamora', 'Zaragoza'
  ];

  const handleInputChange = (field: keyof BillingAddress, value: string) => {
    const newAddress = { ...address, [field]: value };
    setAddress(newAddress);
    
    // Limpiar error del campo
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }

    // Validar y notificar cambios
    const isValid = validateAddress(newAddress);
    onAddressChange(newAddress, isValid);

    // Si cambió código postal o país, actualizar preview de impuestos
    if ((field === 'postalCode' || field === 'country') && showTaxPreview) {
      updateTaxPreview(newAddress);
    }
  };

  const validateAddress = (addr: BillingAddress): boolean => {
    const newErrors: Record<string, string> = {};

    if (!addr.line1.trim()) {
      newErrors.line1 = 'Dirección es requerida';
    }

    if (!addr.city.trim()) {
      newErrors.city = 'Ciudad es requerida';
    }

    if (!addr.postalCode.trim()) {
      newErrors.postalCode = 'Código postal es requerido';
    } else if (addr.country === 'ES') {
      // Validar formato código postal español
      if (!/^\d{5}$/.test(addr.postalCode)) {
        newErrors.postalCode = 'Código postal debe tener 5 dígitos';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const updateTaxPreview = async (addr: BillingAddress) => {
    if (!addr.postalCode || addr.postalCode.length < 5) {
      setTaxPreview(null);
      return;
    }

    setLoadingTax(true);

    try {
      const response = await fetch(
        `/api/stripe/tax-preview?country=${addr.country}&postalCode=${addr.postalCode}`
      );

      if (response.ok) {
        const data = await response.json();
        
        const preview: TaxPreview = {
          region: data.taxInfo.region,
          description: data.taxInfo.description,
          rate: data.taxInfo.rate,
          isCanaryIslands: data.taxInfo.isCanaryIslands,
          country: data.taxInfo.country,
        };

        setTaxPreview(preview);
        onTaxInfoChange?.(preview);
      }
    } catch (error) {
      console.error('Error fetching tax preview:', error);
    } finally {
      setLoadingTax(false);
    }
  };

  useEffect(() => {
    // Validación inicial si hay datos
    if (initialData && Object.keys(initialData).length > 0) {
      const isValid = validateAddress(address);
      onAddressChange(address, isValid);
      
      if (showTaxPreview && address.postalCode) {
        updateTaxPreview(address);
      }
    }
  }, []);

  return (
    <div className={className}>
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label htmlFor="line1" className="block text-sm font-medium text-gray-700 mb-1">
              Dirección *
            </label>
            <input
              type="text"
              id="line1"
              value={address.line1}
              onChange={(e) => handleInputChange('line1', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.line1 ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
              placeholder="Calle, número, piso..."
            />
            {errors.line1 && (
              <p className="text-red-600 text-xs mt-1">{errors.line1}</p>
            )}
          </div>

          <div className="md:col-span-2">
            <label htmlFor="line2" className="block text-sm font-medium text-gray-700 mb-1">
              Dirección 2 (opcional)
            </label>
            <input
              type="text"
              id="line2"
              value={address.line2}
              onChange={(e) => handleInputChange('line2', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Escalera, portal, etc."
            />
          </div>

          <div>
            <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700 mb-1">
              Código Postal *
            </label>
            <input
              type="text"
              id="postalCode"
              value={address.postalCode}
              onChange={(e) => handleInputChange('postalCode', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.postalCode ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
              placeholder="28001"
              maxLength={5}
            />
            {errors.postalCode && (
              <p className="text-red-600 text-xs mt-1">{errors.postalCode}</p>
            )}
          </div>

          <div>
            <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
              Ciudad *
            </label>
            <input
              type="text"
              id="city"
              value={address.city}
              onChange={(e) => handleInputChange('city', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.city ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
              placeholder="Madrid"
            />
            {errors.city && (
              <p className="text-red-600 text-xs mt-1">{errors.city}</p>
            )}
          </div>

          <div>
            <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1">
              Provincia
            </label>
            <select
              id="state"
              value={address.state}
              onChange={(e) => handleInputChange('state', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Seleccionar provincia</option>
              {spanishProvinces.map(province => (
                <option key={province} value={province}>
                  {province}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">
              País *
            </label>
            <select
              id="country"
              value={address.country}
              onChange={(e) => handleInputChange('country', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ES">España</option>
            </select>
          </div>
        </div>

        {/* Preview de impuestos */}
        {showTaxPreview && (
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-sm font-medium text-blue-800">
                  Información fiscal
                </h3>
                {loadingTax ? (
                  <p className="text-sm text-blue-600 mt-1">
                    Calculando impuestos...
                  </p>
                ) : taxPreview ? (
                  <div className="text-sm text-blue-600 mt-1">
                    <p>
                      <strong>{taxPreview.description}</strong>
                    </p>
                    <p>
                      Tipo impositivo: <strong>{(taxPreview.rate * 100).toFixed(0)}%</strong>
                    </p>
                    {taxPreview.isCanaryIslands && (
                      <p className="text-orange-600 font-medium">
                        📍 Código postal de Canarias detectado - Se aplicará IGIC
                      </p>
                    )}
                  </div>
                ) : address.postalCode && address.postalCode.length === 5 ? (
                  <p className="text-sm text-blue-600 mt-1">
                    Introduce un código postal válido para ver los impuestos aplicables
                  </p>
                ) : null}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}