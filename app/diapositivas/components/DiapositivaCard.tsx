import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Image from "next/image"
import Link from "next/link"
import type { Diapositiva } from '@prisma/client-db2'

interface DiapositivaCardProps {
  diapositiva: Diapositiva
}

export function DiapositivaCard({ diapositiva }: DiapositivaCardProps) {
  return (
    <Link href={`/diapositivas/${diapositiva.slug}`}>
      <Card className="group hover:shadow-lg transition-all duration-200 overflow-hidden">
        <div className="aspect-video relative overflow-hidden">
          {diapositiva.url_remota ? (
            <Image
              src={diapositiva.url_remota}
              alt={diapositiva.titulo}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-200"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="w-full h-full bg-muted flex items-center justify-center">
              <div className="text-muted-foreground text-sm">Sin imagen</div>
            </div>
          )}
          
          {/* Overlay con estado */}
          <div className="absolute top-2 right-2">
            <Badge variant="secondary" className="text-xs">
              {diapositiva.estado}
            </Badge>
          </div>
        </div>
        
        <CardContent className="p-4">
          <h3 className="font-semibold text-base line-clamp-2 group-hover:text-primary transition-colors">
            {diapositiva.titulo}
          </h3>
          
          {diapositiva.meta_description && (
            <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
              {diapositiva.meta_description}
            </p>
          )}
          
          <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
            <span>
              {new Date(diapositiva.fecha_creacion).toLocaleDateString('es-ES', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
              })}
            </span>
            
            {diapositiva.url_remota && (
              <Badge variant="outline" className="text-xs">
                Con imagen
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}