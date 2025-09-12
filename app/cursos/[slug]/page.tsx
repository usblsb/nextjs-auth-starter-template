import { notFound } from 'next/navigation'
import { contenidoService } from '@/lib/services'
import { CursoView } from './components/CursoView'
import Header from '../../components/layouts/header'
import { ConditionalFooter } from '../../components/ConditionalFooter'

export default async function CursoPage({ 
  params 
}: { 
  params: Promise<{ slug: string }>
}) {
  const resolvedParams = await params
  const curso = await contenidoService.getCursoBySlugAbierto(resolvedParams.slug)
  
  if (!curso) {
    notFound()
  }

  // Obtener lecciones del curso
  const lecciones = await contenidoService.getLeccionesByCursoId(curso.id)

  return (
    <>
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1">
          <CursoView curso={curso} lecciones={lecciones} />
        </main>
        <ConditionalFooter />
      </div>
    </>
  )
}

// Meta tags dinámicos
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params
  const curso = await contenidoService.getCursoBySlugAbierto(resolvedParams.slug)

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