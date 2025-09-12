import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Image from "next/image"
import Link from "next/link"
import { Globe, Shield, Lock } from "lucide-react"
import type { Diapositiva } from '@prisma/client-db2'

interface DiapositivaCardProps {
  diapositiva: Diapositiva
}

function AccessBadge({ features }: { features: string }) {
  switch (features) {
    case 'OPEN':
      return (
        <Badge variant="outline" className="gap-1 text-xs bg-yellow-100 border-yellow-300 text-yellow-800 hover:bg-yellow-200">
          <Globe className="h-3 w-3" />
          Open
        </Badge>
      )
    case 'FREE':
      return (
        <Badge variant="outline" className="gap-1 text-xs bg-green-100 border-green-300 text-green-800 hover:bg-green-200">
          <Shield className="h-3 w-3" />
          Free
        </Badge>
      )
    case 'PREMIUM':
      return (
        <Badge variant="outline" className="gap-1 text-xs bg-red-100 border-red-300 text-red-800 hover:bg-red-200">
          <Lock className="h-3 w-3" />
          Premium
        </Badge>
      )
    default:
      return null
  }
}

export function DiapositivaCard({ diapositiva }: DiapositivaCardProps) {
  return (
    <Link href={`/diapositivas/${diapositiva.slug}`} className="h-full">
      <Card className="group hover:shadow-lg transition-all duration-200 overflow-hidden h-full flex flex-col p-0">
        <div className="aspect-video relative overflow-hidden">
          {diapositiva.url_remota ? (
            <Image
              src={diapositiva.url_remota}
              alt={diapositiva.titulo}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="w-full h-full bg-muted flex items-center justify-center">
              <div className="text-muted-foreground text-sm">Sin imagen</div>
            </div>
          )}
          
        </div>
        
        <CardContent className="p-4 flex-1 flex flex-col">
          <h3 className="font-semibold text-base line-clamp-2 group-hover:text-primary transition-colors">
            {diapositiva.titulo}
          </h3>
          
          {diapositiva.meta_description && (
            <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
              {diapositiva.meta_description}
            </p>
          )}
          
          <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground mt-auto">
            <span>
              {new Date(diapositiva.fecha_creacion).toLocaleDateString('es-ES', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
              })}
            </span>
            
            <div role="status" aria-label={`Tipo de acceso: ${(diapositiva as any).features || 'OPEN'}`}>
              <AccessBadge features={(diapositiva as any).features || 'OPEN'} />
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}