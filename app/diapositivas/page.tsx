// import { redirect } from 'next/navigation'
// import { userTypeService, contenidoService } from '@/lib/services'
import { contenidoService } from '@/lib/services'
import { DiapositivasGrid } from './components/DiapositivasGrid'
import { Pagination } from './components/Pagination'
import { SearchAndFilters } from './components/SearchAndFilters'
import Header from '../components/layouts/header'
import Footer from '../components/layouts/footer'

export default async function DiapositivasPage({ 
  searchParams 
}: { 
  searchParams: Promise<{ 
    page?: string
    q?: string
    orden?: string
  }>
}) {
  // TODO: Temporal - acceso abierto para pruebas
  // const tipoUsuario = await userTypeService.getTipoUsuarioActual()
  // if (tipoUsuario === 'publico') {
  //   redirect('/sign-in')
  // }
  const tipoUsuario = 'free' // Temporal para pruebas

  const params = await searchParams
  const page = Number(params.page) || 1
  const limit = 12

  const diapositivasData = await contenidoService.getDiapositivasPaginadas(
    page, 
    limit, 
    tipoUsuario,
    {
      busqueda: params.q,
      ordenPor: (params.orden as 'reciente' | 'antiguo' | 'titulo') || 'reciente'
    }
  )


  return (
    <>
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1">
          <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Diapositivas</h1>
        <p className="text-muted-foreground mt-2">
          Explora nuestra colección de diapositivas educativas
        </p>
      </div>

      <SearchAndFilters />
      
      {diapositivasData.total > 0 && (
        <div className="mb-6 text-sm text-muted-foreground">
          Mostrando {((page - 1) * limit) + 1} - {Math.min(page * limit, diapositivasData.total)} de {diapositivasData.total} diapositivas
          {params.q && (
            <span className="ml-2">
              para &ldquo;{params.q}&rdquo;
            </span>
          )}
        </div>
      )}

      <DiapositivasGrid 
        diapositivas={diapositivasData.data}
        isEmpty={diapositivasData.total === 0}
      />

      <Pagination
        currentPage={diapositivasData.currentPage}
        totalPages={diapositivasData.totalPages}
        basePath="/diapositivas"
        hasNext={diapositivasData.hasNext}
        hasPrev={diapositivasData.hasPrev}
        searchParams={{
          ...(params.q && { q: params.q }),
          ...(params.orden && params.orden !== 'reciente' && { orden: params.orden })
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
  title: 'Diapositivas - Electrónica Escuela',
  description: 'Explora nuestra colección de diapositivas educativas sobre electrónica y conceptos técnicos.',
  robots: 'index, follow, noarchive, nosnippet, notranslate',
}