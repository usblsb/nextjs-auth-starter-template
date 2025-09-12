import { notFound } from 'next/navigation'
import { contenidoService } from '@/lib/services'
import { userTypeService } from '@/lib/services/userTypeService'
import { LeccionView } from './components/LeccionView'
import Header from '../../components/layouts/header'
import { ConditionalFooter } from '../../components/ConditionalFooter'

export default async function LeccionPage({ 
  params 
}: { 
  params: Promise<{ slug: string }>
}) {
  // Obtener tipo de usuario actual (integrado con Clerk + Stripe)
  const tipoUsuario = await userTypeService.getTipoUsuarioActual()

  const resolvedParams = await params
  const leccion = await contenidoService.getLeccionBySlugWithFeatures(resolvedParams.slug, tipoUsuario)
  
  if (!leccion) {
    notFound()
  }

  return (
    <>
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1">
          <LeccionView leccion={leccion} tipoUsuario={tipoUsuario} />
        </main>
        <ConditionalFooter />
      </div>
    </>
  )
}

// Meta tags dinámicos
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  // Obtener tipo de usuario actual para metadatos
  const tipoUsuario = await userTypeService.getTipoUsuarioActual()
  const resolvedParams = await params
  const leccion = await contenidoService.getLeccionBySlugWithFeatures(resolvedParams.slug, tipoUsuario)

  if (!leccion) {
    return {
      title: 'Lección no encontrada'
    }
  }

  return {
    title: leccion.meta_titulo || leccion.titulo,
    description: leccion.meta_description,
    robots: 'index, follow, noarchive, nosnippet, notranslate, noai, noimageai',
    other: {
      'ai-consent': 'search-only',
      'donottrain': 'true',
    },
    openGraph: {
      title: leccion.titulo,
      description: leccion.meta_description,
      images: leccion.url_remota ? [leccion.url_remota] : [],
    },
  }
}