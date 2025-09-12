import { notFound } from 'next/navigation'
// TODO: Temporal - acceso abierto para pruebas
import { contenidoService } from '@/lib/services'
import { CursoView } from './components/CursoView'
import Header from '../../components/layouts/header'
import { ConditionalFooter } from '../../components/ConditionalFooter'

export default async function CursoPage({ 
  params 
}: { 
  params: Promise<{ slug: string }>
}) {
  // TODO: Temporal - acceso abierto para pruebas
  const tipoUsuario = 'free' // Temporal para pruebas

  const resolvedParams = await params
  const curso = await contenidoService.getCursoBySlug(resolvedParams.slug, tipoUsuario)
  
  if (!curso) {
    notFound()
  }

  return (
    <>
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1">
          <CursoView curso={curso} tipoUsuario={tipoUsuario} />
        </main>
        <ConditionalFooter />
      </div>
    </>
  )
}

// Meta tags dinámicos
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  // TODO: Temporal - acceso abierto para pruebas
  const tipoUsuario = 'free' // Temporal para pruebas
  const resolvedParams = await params
  const curso = await contenidoService.getCursoBySlug(resolvedParams.slug, tipoUsuario)

  if (!curso) {
    return {
      title: 'Curso no encontrado'
    }
  }

  return {
    title: curso.meta_titulo || curso.titulo,
    description: curso.meta_description,
    openGraph: {
      title: curso.titulo,
      description: curso.meta_description,
      images: curso.url_remota ? [curso.url_remota] : [],
    },
  }
}