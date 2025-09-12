import { contenidoService } from '@/lib/services'
import { userTypeService } from '@/lib/services/userTypeService'
import { LeccionesGrid } from './components/LeccionesGrid'
import { SearchAndFilters } from './components/SearchAndFilters'
import { Pagination } from '../diapositivas/components/Pagination'
import Header from '../components/layouts/header'
import Footer from '../components/layouts/footer'

export default async function LeccionesPage({ 
  searchParams 
}: { 
  searchParams: Promise<{ 
    page?: string
    q?: string
    orden?: string
    tipo?: string
  }>
}) {
  // Obtener tipo de usuario actual (integrado con Clerk + Stripe)
  const tipoUsuario = await userTypeService.getTipoUsuarioActual()

  const params = await searchParams
  const page = Number(params.page) || 1
  const limit = 12

  const leccionesData = await contenidoService.getLeccionesPaginados(
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
    <>
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1">
          <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Lecciones</h1>
        <p className="text-muted-foreground mt-2">
          Explora nuestra colección de lecciones educativas
        </p>
      </div>

      <SearchAndFilters />
      
      {leccionesData.total > 0 && (
        <div className="mb-6 text-sm text-muted-foreground">
          Mostrando {((page - 1) * limit) + 1} - {Math.min(page * limit, leccionesData.total)} de {leccionesData.total} lecciones
          {params.q && (
            <span className="ml-2">
              para &ldquo;{params.q}&rdquo;
            </span>
          )}
          {params.tipo && (
            <span className="ml-2">
              del tipo {params.tipo}
            </span>
          )}
        </div>
      )}

      <LeccionesGrid 
        lecciones={leccionesData.data}
        isEmpty={leccionesData.total === 0}
      />

      <Pagination
        currentPage={leccionesData.currentPage}
        totalPages={leccionesData.totalPages}
        basePath="/lecciones"
        hasNext={leccionesData.hasNext}
        hasPrev={leccionesData.hasPrev}
        searchParams={{
          ...(params.q && { q: params.q }),
          ...(params.orden && params.orden !== 'reciente' && { orden: params.orden }),
          ...(params.tipo && { tipo: params.tipo })
        }}
      />
          </div>
        </main>
        <Footer />
      </div>
    </>
  )
}

export const metadata = {
  title: 'Lecciones - Electrónica Escuela',
  description: 'Explora nuestra colección de lecciones educativas sobre electrónica y conceptos técnicos.',
  robots: 'index, follow, noarchive, nosnippet, notranslate',
}