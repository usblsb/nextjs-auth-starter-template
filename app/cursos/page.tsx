// TODO: Temporal - acceso abierto para pruebas
import { contenidoService } from '@/lib/services'
import { CursosGrid } from './components/CursosGrid'
import { SearchAndFilters } from './components/SearchAndFilters'
import { Pagination } from '../diapositivas/components/Pagination'

export default async function CursosPage({ 
  searchParams 
}: { 
  searchParams: Promise<{ 
    page?: string
    q?: string
    orden?: string
    tipo?: string
  }>
}) {
  // TODO: Temporal - acceso abierto para pruebas
  const tipoUsuario = 'free' // Temporal para pruebas

  const params = await searchParams
  const page = Number(params.page) || 1
  const limit = 12

  const cursosData = await contenidoService.getCursosPaginados(
    page, 
    limit, 
    tipoUsuario,
    {
      busqueda: params.q,
      ordenPor: (params.orden as 'reciente' | 'antiguo' | 'titulo') || 'reciente',
      features: params.tipo
    }
  )

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Cursos</h1>
        <p className="text-muted-foreground mt-2">
          Explora nuestra colección de cursos educativos
        </p>
      </div>

      <SearchAndFilters />
      
      {cursosData.total > 0 && (
        <div className="mb-6 text-sm text-muted-foreground">
          Mostrando {((page - 1) * limit) + 1} - {Math.min(page * limit, cursosData.total)} de {cursosData.total} cursos
          {params.q && (
            <span className="ml-2">
              para "{params.q}"
            </span>
          )}
          {params.tipo && (
            <span className="ml-2">
              del tipo {params.tipo}
            </span>
          )}
        </div>
      )}

      <CursosGrid 
        cursos={cursosData.data}
        isEmpty={cursosData.total === 0}
      />

      <Pagination
        currentPage={cursosData.currentPage}
        totalPages={cursosData.totalPages}
        basePath="/cursos"
        hasNext={cursosData.hasNext}
        hasPrev={cursosData.hasPrev}
        searchParams={{
          ...(params.q && { q: params.q }),
          ...(params.orden && params.orden !== 'reciente' && { orden: params.orden }),
          ...(params.tipo && { tipo: params.tipo })
        }}
      />
    </div>
  )
}

export const metadata = {
  title: 'Cursos - Electrónica Escuela',
  description: 'Explora nuestra colección de cursos educativos sobre electrónica y conceptos técnicos.',
}