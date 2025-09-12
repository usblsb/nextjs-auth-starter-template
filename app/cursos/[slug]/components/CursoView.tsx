import Image from 'next/image'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CalendarDays, BookOpen } from 'lucide-react'
import type { Curso } from '@prisma/client-db2'
import '@/styles/pages-contenido.css'

interface Leccion {
  id: number
  titulo: string
  descripcion_corta: string | null
  slug: string | null
  fecha_creacion: Date
  indice: number
}

interface CursoViewProps {
  curso: Curso
  lecciones: Leccion[]
}

export function CursoView({ curso, lecciones }: CursoViewProps) {
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
      <div className="mb-12">
        {curso.contenido_privado ? (
          <div 
            className="contenido-html-raw prose prose-lg max-w-none prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground"
            dangerouslySetInnerHTML={{ __html: curso.contenido_privado }}
          />
        ) : curso.contenido ? (
          <div 
            className="contenido-html-raw prose prose-lg max-w-none prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground"
            dangerouslySetInnerHTML={{ __html: curso.contenido }}
          />
        ) : curso.contenido_publico ? (
          <div 
            className="contenido-html-raw prose prose-lg max-w-none prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground"
            dangerouslySetInnerHTML={{ __html: curso.contenido_publico }}
          />
        ) : (
          <div className="text-gray-500 italic">
            No hay contenido disponible para este curso.
          </div>
        )}
      </div>

      {/* Listado de lecciones */}
      <div className="mb-8">
        <h3 className="text-2xl font-semibold mb-6 flex items-center gap-2">
          <BookOpen className="h-6 w-6" />
          Listado de las lecciones
        </h3>
        
        {lecciones.length > 0 ? (
          <div className="grid gap-4 md:gap-6">
            {lecciones.map((leccion) => (
              <Card key={leccion.id} className="hover:shadow-md transition-shadow duration-200">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <CardTitle className="text-lg">
                        {leccion.slug ? (
                          <Link 
                            href={`/lecciones/${leccion.slug}`}
                            className="text-foreground hover:text-primary transition-colors"
                          >
                            {leccion.titulo}
                          </Link>
                        ) : (
                          leccion.titulo
                        )}
                      </CardTitle>
                      {leccion.descripcion_corta && (
                        <CardDescription className="mt-2 text-muted-foreground">
                          {leccion.descripcion_corta}
                        </CardDescription>
                      )}
                    </div>
                    <Badge variant="secondary" className="flex-shrink-0">
                      {leccion.indice}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <CalendarDays className="h-4 w-4 mr-1" />
                    {new Date(leccion.fecha_creacion).toLocaleDateString('es-ES', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-6 text-center">
              <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <p className="text-muted-foreground">
                Este curso aún no tiene lecciones disponibles.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}