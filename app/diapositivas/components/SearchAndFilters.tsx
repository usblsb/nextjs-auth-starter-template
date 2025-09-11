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
import { Search, X, SlidersHorizontal } from 'lucide-react'

export function SearchAndFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [busqueda, setBusqueda] = useState(searchParams.get('q') || '')
  const [ordenPor, setOrdenPor] = useState(searchParams.get('orden') || 'reciente')

  // Actualizar URL cuando cambien los filtros
  const actualizarURL = (nuevaBusqueda: string, nuevoOrden: string) => {
    const params = new URLSearchParams()
    
    if (nuevaBusqueda.trim()) {
      params.set('q', nuevaBusqueda.trim())
    }
    
    if (nuevoOrden !== 'reciente') {
      params.set('orden', nuevoOrden)
    }
    
    // Resetear página al filtrar
    if (params.toString()) {
      router.push(`/diapositivas?${params.toString()}`)
    } else {
      router.push('/diapositivas')
    }
  }

  const handleBusquedaSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    actualizarURL(busqueda, ordenPor)
  }

  const handleOrdenChange = (nuevoOrden: string) => {
    setOrdenPor(nuevoOrden)
    actualizarURL(busqueda, nuevoOrden)
  }

  const limpiarFiltros = () => {
    setBusqueda('')
    setOrdenPor('reciente')
    router.push('/diapositivas')
  }

  const tienesFiltros = busqueda.trim() || ordenPor !== 'reciente'

  return (
    <div className="space-y-4 mb-6">
      {/* Búsqueda */}
      <form onSubmit={handleBusquedaSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Buscar diapositivas por título, contenido..."
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
          <span className="text-sm font-medium">Ordenar por:</span>
        </div>
        
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
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Filtros activos:</span>
          {busqueda.trim() && (
            <span className="bg-muted px-2 py-1 rounded text-xs">
              Búsqueda: "{busqueda}"
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