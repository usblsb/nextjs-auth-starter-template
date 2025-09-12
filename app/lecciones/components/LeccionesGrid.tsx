import type { Leccion } from '@prisma/client-db2'
import { LeccionCard } from './LeccionCard'

interface LeccionesGridProps {
  lecciones: Leccion[]
  isEmpty?: boolean
}

export function LeccionesGrid({ lecciones, isEmpty = false }: LeccionesGridProps) {
  if (isEmpty || lecciones.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
          <svg 
            className="w-10 h-10 text-muted-foreground" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold mb-2">No hay lecciones disponibles</h3>
        <p className="text-muted-foreground max-w-md">
          Actualmente no hay lecciones que mostrar. Vuelve más tarde para ver nuevo contenido educativo.
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {lecciones.map((leccion) => (
        <LeccionCard 
          key={leccion.id} 
          leccion={leccion}
        />
      ))}
    </div>
  )
}