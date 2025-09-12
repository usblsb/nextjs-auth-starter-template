'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { Search, X, SlidersHorizontal, Globe, Shield, Lock } from 'lucide-react'

export function SearchAndFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [busqueda, setBusqueda] = useState(searchParams.get('q') || '')
  const [ordenPor, setOrdenPor] = useState(searchParams.get('orden') || 'reciente')
  const [features, setFeatures] = useState(searchParams.get('tipo') || '')

  // Actualizar URL cuando cambien los filtros
  const actualizarURL = (nuevaBusqueda: string, nuevoOrden: string, nuevoTipo: string) => {
    const params = new URLSearchParams()
    
    if (nuevaBusqueda.trim()) {
      params.set('q', nuevaBusqueda.trim())
    }
    
    if (nuevoOrden !== 'reciente') {
      params.set('orden', nuevoOrden)
    }
    
    if (nuevoTipo) {
      params.set('tipo', nuevoTipo)
    }
    
    // Resetear página al filtrar
    if (params.toString()) {
      router.push(`/lecciones?${params.toString()}`)
    } else {
      router.push('/lecciones')
    }
  }

  const handleBusquedaSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    actualizarURL(busqueda, ordenPor, features)
  }

  const handleOrdenChange = (nuevoOrden: string) => {
    setOrdenPor(nuevoOrden)
    actualizarURL(busqueda, nuevoOrden, features)
  }

  const handleFeaturesChange = (nuevoTipo: string) => {
    const valor = nuevoTipo === 'todos' ? '' : nuevoTipo
    setFeatures(valor)
    actualizarURL(busqueda, ordenPor, valor)
  }

  const limpiarFiltros = () => {
    setBusqueda('')
    setOrdenPor('reciente')
    setFeatures('')
    router.push('/lecciones')
  }

  const tienesFiltros = busqueda.trim() || ordenPor !== 'reciente' || features

  return (
    <div className="space-y-4 mb-6">
      {/* Búsqueda */}
      <form onSubmit={handleBusquedaSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Buscar lecciones por título, descripción..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button type="submit" variant="default">
          Buscar
        </Button>
      </form>

      {/* Filtros */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Filtros:</span>
        </div>
        
        {/* Filtro por tipo */}
        <Select value={features || "todos"} onValueChange={handleFeaturesChange}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Todos los tipos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los tipos</SelectItem>
            <SelectItem value="OPEN">
              <div className="flex items-center gap-2">
                <Globe className="h-3 w-3" />
                Acceso libre
              </div>
            </SelectItem>
            <SelectItem value="FREE">
              <div className="flex items-center gap-2">
                <Shield className="h-3 w-3" />
                Registro requerido
              </div>
            </SelectItem>
            <SelectItem value="PREMIUM">
              <div className="flex items-center gap-2">
                <Lock className="h-3 w-3" />
                Premium
              </div>
            </SelectItem>
          </SelectContent>
        </Select>

        {/* Ordenar por */}
        <Select value={ordenPor} onValueChange={handleOrdenChange}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="reciente">Más reciente</SelectItem>
            <SelectItem value="antiguo">Más antiguo</SelectItem>
            <SelectItem value="titulo">Por título</SelectItem>
          </SelectContent>
        </Select>

        {tienesFiltros && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={limpiarFiltros}
            className="gap-1"
          >
            <X className="h-3 w-3" />
            Limpiar filtros
          </Button>
        )}
      </div>

      {/* Indicador de filtros activos */}
      {tienesFiltros && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
          <span>Filtros activos:</span>
          {busqueda.trim() && (
            <span className="bg-muted px-2 py-1 rounded text-xs">
              Búsqueda: &ldquo;{busqueda}&rdquo;
            </span>
          )}
          {features && (
            <span className="bg-muted px-2 py-1 rounded text-xs flex items-center gap-1">
              Tipo: 
              {features === 'OPEN' && <><Globe className="h-3 w-3" /> Acceso libre</>}
              {features === 'FREE' && <><Shield className="h-3 w-3" /> Registro requerido</>}
              {features === 'PREMIUM' && <><Lock className="h-3 w-3" /> Premium</>}
            </span>
          )}
          {ordenPor !== 'reciente' && (
            <span className="bg-muted px-2 py-1 rounded text-xs">
              Orden: {
                ordenPor === 'antiguo' ? 'Más antiguo' :
                ordenPor === 'titulo' ? 'Por título' : 'Más reciente'
              }
            </span>
          )}
        </div>
      )}
    </div>
  )
}