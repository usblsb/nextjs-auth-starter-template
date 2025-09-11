import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Image from "next/image"
import Link from "next/link"
import { Globe, Shield, Lock } from "lucide-react"
import type { Curso } from '@prisma/client-db2'

interface CursoCardProps {
  curso: Curso
}

function AccessBadge({ features }: { features: string }) {
  switch (features) {
    case 'OPEN':
      return (
        <Badge variant="secondary" className="gap-1 text-xs">
          <Globe className="h-3 w-3" />
          Acceso libre
        </Badge>
      )
    case 'FREE':
      return (
        <Badge variant="outline" className="gap-1 text-xs">
          <Shield className="h-3 w-3" />
          Registro requerido
        </Badge>
      )
    case 'PREMIUM':
      return (
        <Badge variant="default" className="gap-1 text-xs bg-amber-500 hover:bg-amber-600">
          <Lock className="h-3 w-3" />
          Premium
        </Badge>
      )
    default:
      return null
  }
}

export function CursoCard({ curso }: CursoCardProps) {
  return (
    <Link href={`/cursos/${curso.slug}`}>
      <Card className="group hover:shadow-lg transition-all duration-200 overflow-hidden">
        <div className="aspect-video relative overflow-hidden">
          {curso.url_remota ? (
            <Image
              src={curso.url_remota}
              alt={curso.titulo}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-200"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="w-full h-full bg-muted flex items-center justify-center">
              <div className="text-muted-foreground text-sm">Sin imagen</div>
            </div>
          )}
          
          {/* Overlay con badge de tipo */}
          <div className="absolute top-2 right-2">
            <AccessBadge features={curso.features || 'OPEN'} />
          </div>
        </div>
        
        <CardContent className="p-4">
          <h3 className="font-semibold text-base line-clamp-2 group-hover:text-primary transition-colors mb-2">
            {curso.titulo}
          </h3>
          
          {curso.descripcion_corta && (
            <p className="text-sm text-muted-foreground line-clamp-3 mb-3">
              {curso.descripcion_corta.replace(/<[^>]*>/g, '')} {/* Remove HTML tags */}
            </p>
          )}
          
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {new Date(curso.fecha_creacion).toLocaleDateString('es-ES', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
              })}
            </span>
            
            {curso.estado && (
              <Badge variant="outline" className="text-xs">
                {curso.estado}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}