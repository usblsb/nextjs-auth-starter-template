/**
 * Componente para capturar dirección de facturación
 * Incluye validación de códigos postales españoles y cálculo de impuestos en tiempo real
 * Refactorizado con shadcn/ui components y diseño mobile-first
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { isCanaryIslandsPostalCode } from '@/lib/services/taxService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info, Loader2 } from 'lucide-react';

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

  const updateTaxPreview = useCallback(async (addr: BillingAddress) => {
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
  }, [onTaxInfoChange]);

  useEffect(() => {
    // Validación inicial si hay datos
    if (initialData && Object.keys(initialData).length > 0) {
      const isValid = validateAddress(address);
      onAddressChange(address, isValid);
      
      if (showTaxPreview && address.postalCode) {
        updateTaxPreview(address);
      }
    }
  }, [address, initialData, onAddressChange, showTaxPreview, updateTaxPreview]);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg">Dirección de facturación</CardTitle>
        <CardDescription>
          Introduce tu dirección para calcular los impuestos correspondientes
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <Label htmlFor="line1">Dirección *</Label>
            <Input
              id="line1"
              value={address.line1}
              onChange={(e) => handleInputChange('line1', e.target.value)}
              placeholder="Calle, número, piso..."
              className={errors.line1 ? 'border-destructive' : ''}
            />
            {errors.line1 && (
              <p className="text-destructive text-sm mt-1">{errors.line1}</p>
            )}
          </div>

          <div className="sm:col-span-2">
            <Label htmlFor="line2">Dirección 2 (opcional)</Label>
            <Input
              id="line2"
              value={address.line2}
              onChange={(e) => handleInputChange('line2', e.target.value)}
              placeholder="Escalera, portal, etc."
            />
          </div>

          <div>
            <Label htmlFor="postalCode">Código Postal *</Label>
            <Input
              id="postalCode"
              value={address.postalCode}
              onChange={(e) => handleInputChange('postalCode', e.target.value)}
              placeholder="28001"
              maxLength={5}
              className={errors.postalCode ? 'border-destructive' : ''}
            />
            {errors.postalCode && (
              <p className="text-destructive text-sm mt-1">{errors.postalCode}</p>
            )}
          </div>

          <div>
            <Label htmlFor="city">Ciudad *</Label>
            <Input
              id="city"
              value={address.city}
              onChange={(e) => handleInputChange('city', e.target.value)}
              placeholder="Madrid"
              className={errors.city ? 'border-destructive' : ''}
            />
            {errors.city && (
              <p className="text-destructive text-sm mt-1">{errors.city}</p>
            )}
          </div>

          <div>
            <Label htmlFor="state">Provincia</Label>
            <Select value={address.state} onValueChange={(value) => handleInputChange('state', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar provincia" />
              </SelectTrigger>
              <SelectContent>
                {spanishProvinces.map(province => (
                  <SelectItem key={province} value={province}>
                    {province}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="country">País *</Label>
            <Select value={address.country} onValueChange={(value) => handleInputChange('country', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ES">España</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Preview de impuestos */}
        {showTaxPreview && (
          <Alert className="mt-4" role="status" aria-live="polite">
            <Info className="h-4 w-4" aria-hidden="true" />
            <AlertDescription>
              <div className="font-medium mb-1">Información fiscal</div>
              {loadingTax ? (
                <div className="flex items-center gap-2 text-sm">
                  <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
                  <span aria-live="polite">Calculando impuestos...</span>
                </div>
              ) : taxPreview ? (
                <div className="text-sm space-y-1">
                  <p>
                    <strong>{taxPreview.description}</strong>
                  </p>
                  <p>
                    Tipo impositivo: <strong>{(taxPreview.rate * 100).toFixed(0)}%</strong>
                  </p>
                  {taxPreview.isCanaryIslands && (
                    <p className="text-orange-600 dark:text-orange-400 font-medium">
                      <span aria-hidden="true">📍</span> Código postal de Canarias detectado - Se aplicará IGIC
                    </p>
                  )}
                </div>
              ) : address.postalCode && address.postalCode.length === 5 ? (
                <p className="text-sm">
                  Introduce un código postal válido para ver los impuestos aplicables
                </p>
              ) : null}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}