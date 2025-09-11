import type { Curso } from '@prisma/client-db2'
import { CursoCard } from './CursoCard'

interface CursosGridProps {
  cursos: Curso[]
  isEmpty?: boolean
}

export function CursosGrid({ cursos, isEmpty = false }: CursosGridProps) {
  if (isEmpty || cursos.length === 0) {
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
              d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" 
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold mb-2">No hay cursos disponibles</h3>
        <p className="text-muted-foreground max-w-md">
          Actualmente no hay cursos que mostrar. Vuelve más tarde para ver nuevo contenido educativo.
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {cursos.map((curso) => (
        <CursoCard 
          key={curso.id} 
          curso={curso}
        />
      ))}
    </div>
  )
}