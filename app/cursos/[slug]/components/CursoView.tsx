import Image from 'next/image'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Shield, Lock, Globe } from 'lucide-react'
import { contenidoService } from '@/lib/services'
import type { Curso } from '@prisma/client-db2'
import type { TipoUsuario } from '@/lib/services'

interface CursoViewProps {
  curso: Curso
  tipoUsuario: TipoUsuario
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

function ContentByPermission({ curso, tipoUsuario }: { curso: Curso, tipoUsuario: TipoUsuario }) {
  const { contenido, tieneAcceso, mensaje } = contenidoService.getContenidoCurso(curso, tipoUsuario)

  return (
    <div className="space-y-6">
      {/* Contenido principal */}
      {contenido && (
        <div 
          className="prose prose-lg max-w-none prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground"
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
      {!tieneAcceso && tipoUsuario === 'free' && curso.features === 'PREMIUM' && (
        <Card className="border-gradient-to-r from-amber-200 to-orange-200 bg-gradient-to-r from-amber-50 to-orange-50">
          <CardContent className="p-6">
            <div className="text-center space-y-3">
              <Lock className="h-8 w-8 text-amber-600 mx-auto" />
              <h3 className="font-semibold text-amber-900">Contenido Premium</h3>
              <p className="text-amber-800 text-sm">
                Accede a todo el contenido, ejercicios prácticos y recursos adicionales con una suscripción Premium.
              </p>
              <button className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors">
                Actualizar a Premium
              </button>
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
                <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors">
                  Registrarse
                </button>
                <button className="border border-blue-300 text-blue-700 hover:bg-blue-100 px-4 py-2 rounded-md text-sm font-medium transition-colors">
                  Iniciar sesión
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export function CursoView({ curso, tipoUsuario }: CursoViewProps) {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Imagen principal */}
      {curso.url_remota && (
        <div className="mb-8 relative">
          <Image
            src={curso.url_remota}
            alt={curso.titulo}
            width={1980}
            height={1080}
            className="w-full h-auto rounded-lg shadow-lg"
            priority
          />
          
          {/* Badge de tipo de acceso superpuesto */}
          <div className="absolute top-4 right-4">
            <AccessBadge features={curso.features || 'OPEN'} />
          </div>
        </div>
      )}

      {/* Header con título y badge */}
      <div className="mb-8">
        <div className="flex items-start justify-between gap-4 mb-4">
          <h1 className="text-4xl font-bold tracking-tight flex-1">
            {curso.titulo}
          </h1>
          
          {/* Badge para cuando no hay imagen */}
          {!curso.url_remota && (
            <AccessBadge features={curso.features || 'OPEN'} />
          )}
        </div>

        {/* Meta información */}
        {curso.descripcion_corta && (
          <p className="text-xl text-muted-foreground leading-relaxed">
            {curso.descripcion_corta}
          </p>
        )}

        {/* Información del curso */}
        <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
          <span>
            Creado: {new Date(curso.fecha_creacion).toLocaleDateString('es-ES', {
              day: 'numeric',
              month: 'long', 
              year: 'numeric'
            })}
          </span>
          
          {curso.fecha_actualizacion && curso.fecha_actualizacion !== curso.fecha_creacion && (
            <span>
              Actualizado: {new Date(curso.fecha_actualizacion).toLocaleDateString('es-ES', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
              })}
            </span>
          )}
        </div>
      </div>

      {/* Contenido condicional según permisos */}
      <ContentByPermission curso={curso} tipoUsuario={tipoUsuario} />
    </div>
  )
}