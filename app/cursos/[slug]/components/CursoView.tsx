import Image from 'next/image'
import type { Curso } from '@prisma/client-db2'

interface CursoViewProps {
  curso: Curso
}

export function CursoView({ curso }: CursoViewProps) {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Imagen principal */}
      {curso.url_remota && (
        <div className="mb-8">
          <Image
            src={curso.url_remota}
            alt={curso.titulo}
            width={1980}
            height={1080}
            className="w-full h-auto rounded-lg shadow-lg"
            priority
          />
        </div>
      )}

      {/* Título */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold tracking-tight">
          {curso.titulo}
        </h1>
      </div>

      {/* Contenido privado */}
      <div className="mb-8">
        {curso.contenido_privado ? (
          <div 
            className="prose prose-lg max-w-none prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground"
            dangerouslySetInnerHTML={{ __html: curso.contenido_privado }}
          />
        ) : curso.contenido ? (
          <div 
            className="prose prose-lg max-w-none prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground"
            dangerouslySetInnerHTML={{ __html: curso.contenido }}
          />
        ) : curso.contenido_publico ? (
          <div 
            className="prose prose-lg max-w-none prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground"
            dangerouslySetInnerHTML={{ __html: curso.contenido_publico }}
          />
        ) : (
          <div className="text-gray-500 italic">
            No hay contenido disponible para este curso.
          </div>
        )}
      </div>
    </div>
  )
}