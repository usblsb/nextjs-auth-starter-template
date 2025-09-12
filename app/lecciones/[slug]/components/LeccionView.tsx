import Image from 'next/image'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Shield, Lock, Globe, BookOpen } from 'lucide-react'
import { contenidoService } from '@/lib/services'
import type { Leccion } from '@prisma/client-db2'
import type { TipoUsuario } from '@/lib/services'
import '@/styles/pages-contenido.css'

interface LeccionHermana {
  id: number
  titulo: string
  slug: string | null
  indice: number
  es_leccion_actual: boolean
  curso_id: number
}

interface LeccionViewProps {
  leccion: Leccion
  tipoUsuario: TipoUsuario
  leccionesHermanas: LeccionHermana[]
}

function AccessBadge({ features }: { features: string }) {
  switch (features) {
    case 'OPEN':
      return (
        <Badge variant="secondary" className="gap-1">
          <Globe className="h-3 w-3" />
          Acceso libre
        </Badge>
      )
    case 'FREE':
      return (
        <Badge variant="outline" className="gap-1">
          <Shield className="h-3 w-3" />
          Registro requerido
        </Badge>
      )
    case 'PREMIUM':
      return (
        <Badge variant="default" className="gap-1 bg-amber-500 hover:bg-amber-600">
          <Lock className="h-3 w-3" />
          Premium
        </Badge>
      )
    default:
      return null
  }
}

function ContentByPermission({ leccion, tipoUsuario }: { leccion: Leccion, tipoUsuario: TipoUsuario }) {
  const { contenido, tieneAcceso, mensaje } = contenidoService.getContenidoLeccion(leccion, tipoUsuario)

  return (
    <div className="space-y-6">
      {/* Contenido principal */}
      {contenido && (
        <div 
          className="contenido-html-raw prose prose-lg max-w-none prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground"
          dangerouslySetInnerHTML={{ __html: contenido }}
        />
      )}

      {/* Mensaje de acceso restringido */}
      {mensaje && (
        <Card className={`${tieneAcceso ? 'border-blue-200 bg-blue-50' : 'border-amber-200 bg-amber-50'}`}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              {tieneAcceso ? (
                <Shield className="h-4 w-4 text-blue-600" />
              ) : (
                <Lock className="h-4 w-4 text-amber-600" />
              )}
              <p className={`text-sm font-medium ${tieneAcceso ? 'text-blue-800' : 'text-amber-800'}`}>
                {mensaje}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Información adicional para usuarios sin acceso completo */}
      {!tieneAcceso && tipoUsuario === 'free' && (leccion as any).features === 'PREMIUM' && (
        <Card className="border-gradient-to-r from-amber-200 to-orange-200 bg-gradient-to-r from-amber-50 to-orange-50">
          <CardContent className="p-6">
            <div className="text-center space-y-3">
              <Lock className="h-8 w-8 text-amber-600 mx-auto" />
              <h3 className="font-semibold text-amber-900">Contenido Premium</h3>
              <p className="text-amber-800 text-sm">
                Accede a todo el contenido, ejercicios prácticos y recursos adicionales con una suscripción Premium.
              </p>
              <Link href="/web-dashboard/billing?upgrade=true">
                <Button className="bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium">
                  Actualizar a Premium
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Call to action para usuarios públicos */}
      {tipoUsuario === 'publico' && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-6">
            <div className="text-center space-y-3">
              <Shield className="h-8 w-8 text-blue-600 mx-auto" />
              <h3 className="font-semibold text-blue-900">¡Regístrate gratis!</h3>
              <p className="text-blue-800 text-sm">
                Crea tu cuenta gratuita para acceder a más contenido educativo y seguir tu progreso.
              </p>
              <div className="flex gap-2 justify-center">
                <Link href="/sign-up">
                  <Button className="bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium">
                    Registrarse
                  </Button>
                </Link>
                <Link href="/sign-in">
                  <Button variant="outline" className="border-blue-300 text-blue-700 hover:bg-blue-100 text-sm font-medium">
                    Iniciar sesión
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export function LeccionView({ leccion, tipoUsuario, leccionesHermanas }: LeccionViewProps) {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Imagen principal */}
      {leccion.url_remota && (
        <div className="mb-8 relative">
          <Image
            src={leccion.url_remota}
            alt={leccion.titulo}
            width={1980}
            height={1080}
            className="w-full h-auto rounded-lg shadow-lg"
            priority
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
          />
          
          {/* Badge de tipo de acceso superpuesto */}
          <div className="absolute top-4 right-4">
            <div role="status" aria-label={`Tipo de acceso: ${(leccion as any).features || 'OPEN'}`}>
              <AccessBadge features={(leccion as any).features || 'OPEN'} />
            </div>
          </div>
        </div>
      )}

      {/* Header con título y badge */}
      <div className="mb-8">
        <div className="flex items-start justify-between gap-4 mb-4">
          <h1 className="text-4xl font-bold tracking-tight flex-1">
            {leccion.titulo}
          </h1>
          
          {/* Badge para cuando no hay imagen */}
          {!leccion.url_remota && (
            <div role="status" aria-label={`Tipo de acceso: ${(leccion as any).features || 'OPEN'}`}>
              <AccessBadge features={(leccion as any).features || 'OPEN'} />
            </div>
          )}
        </div>

        {/* Meta información */}
        {leccion.descripcion_corta && (
          <div 
            className="text-xl text-muted-foreground leading-relaxed prose max-w-none"
            dangerouslySetInnerHTML={{ __html: leccion.descripcion_corta }}
          />
        )}

        {/* Información de la lección */}
        <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
          <span>
            Creado: {new Date(leccion.fecha_creacion).toLocaleDateString('es-ES', {
              day: 'numeric',
              month: 'long', 
              year: 'numeric'
            })}
          </span>
          
          {leccion.fecha_actualizacion && leccion.fecha_actualizacion !== leccion.fecha_creacion && (
            <span>
              Actualizado: {new Date(leccion.fecha_actualizacion).toLocaleDateString('es-ES', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
              })}
            </span>
          )}
        </div>
      </div>

      {/* Contenido condicional según permisos */}
      <div className="mb-12">
        <ContentByPermission leccion={leccion} tipoUsuario={tipoUsuario} />
      </div>

      {/* Listado de lecciones hermanas */}
      {leccionesHermanas.length > 0 && (
        <div className="mb-8">
          <h3 className="text-2xl font-semibold mb-6 flex items-center gap-2">
            <BookOpen className="h-6 w-6" />
            Listado de las lecciones
          </h3>
          
          <div className="grid gap-3">
            {leccionesHermanas.map((leccionHermana) => {
              const cardContent = (
                <CardHeader className="py-3 px-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className={`font-semibold text-base flex-1 ${leccionHermana.es_leccion_actual ? 'text-primary' : 'text-foreground'}`}>
                      <h3>{leccionHermana.titulo}</h3>
                    </div>
                    <Badge 
                      variant={leccionHermana.es_leccion_actual ? 'default' : 'secondary'}
                      className="flex-shrink-0 min-w-[2rem] justify-center"
                    >
                      {leccionHermana.indice}
                    </Badge>
                  </div>
                </CardHeader>
              )

              // Si es la lección actual o no tiene slug, renderizar como div
              if (leccionHermana.es_leccion_actual || !leccionHermana.slug) {
                return (
                  <Card 
                    key={leccionHermana.id} 
                    className={`transition-all duration-200 ${
                      leccionHermana.es_leccion_actual 
                        ? 'border-primary bg-primary/5 shadow-sm' 
                        : 'hover:shadow-md hover:border-muted-foreground/20'
                    }`}
                  >
                    {cardContent}
                  </Card>
                )
              }

              // Si no es la lección actual y tiene slug, renderizar como enlace
              return (
                <Link 
                  key={leccionHermana.id}
                  href={`/lecciones/${leccionHermana.slug}`}
                  className="block"
                >
                  <Card className="transition-all duration-200 hover:shadow-md hover:border-muted-foreground/20 hover:text-primary">
                    {cardContent}
                  </Card>
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}