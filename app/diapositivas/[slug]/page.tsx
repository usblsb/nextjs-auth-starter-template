import { notFound } from 'next/navigation'
// import { redirect } from 'next/navigation'
// import { contenidoService, userTypeService } from '@/lib/services'
import { contenidoService } from '@/lib/services'
import Image from 'next/image'
import Header from '../../components/layouts/header'
import { ConditionalFooter } from '../../components/ConditionalFooter'
import '@/styles/pages-contenido.css'

export default async function DiapositivaPage({ 
  params 
}: { 
  params: Promise<{ slug: string }>
}) {
  // TODO: Temporal - acceso abierto para pruebas
  // const tipoUsuario = await userTypeService.getTipoUsuarioActual()
  // if (tipoUsuario === 'publico') {
  //   redirect('/sign-in')
  // }
  const tipoUsuario = 'free' // Temporal para pruebas

  const resolvedParams = await params
  const diapositiva = await contenidoService.getDiapositivaBySlug(resolvedParams.slug, tipoUsuario)
  
  if (!diapositiva) {
    notFound()
  }

  return (
    <>
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1">
          <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Imagen principal */}
      {diapositiva.url_remota && (
        <div className="mb-8">
          <Image
            src={diapositiva.url_remota}
            alt={diapositiva.titulo}
            width={1980}
            height={1080}
            className="w-full h-auto rounded-lg shadow-lg"
            priority
          />
        </div>
      )}

      {/* Título */}
      <h1 className="text-4xl font-bold tracking-tight mb-8">
        {diapositiva.titulo}
      </h1>

      {/* Contenido HTML */}
      {diapositiva.contenido && (
        <div 
          className="contenido-html-raw prose prose-lg max-w-none prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground"
          dangerouslySetInnerHTML={{ __html: diapositiva.contenido }}
        />
      )}
          </div>
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
  const diapositiva = await contenidoService.getDiapositivaBySlug(resolvedParams.slug, tipoUsuario)

  if (!diapositiva) {
    return {
      title: 'Diapositiva no encontrada'
    }
  }

  return {
    title: diapositiva.meta_titulo || diapositiva.titulo,
    description: diapositiva.meta_description,
    openGraph: {
      title: diapositiva.titulo,
      description: diapositiva.meta_description,
      images: diapositiva.url_remota ? [diapositiva.url_remota] : [],
    },
  }
}