import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react"

interface PaginationProps {
  currentPage: number
  totalPages: number
  basePath: string
  hasNext: boolean
  hasPrev: boolean
  searchParams?: Record<string, string>
}

export function Pagination({ 
  currentPage, 
  totalPages, 
  basePath, 
  hasNext, 
  hasPrev,
  searchParams = {}
}: PaginationProps) {
  if (totalPages <= 1) return null

  // Función para construir URL con parámetros
  const buildURL = (page: number) => {
    const params = new URLSearchParams()
    
    // Agregar parámetros de búsqueda existentes
    Object.entries(searchParams).forEach(([key, value]) => {
      if (value && key !== 'page') {
        params.set(key, value)
      }
    })
    
    // Agregar página si no es la primera
    if (page > 1) {
      params.set('page', page.toString())
    }
    
    const queryString = params.toString()
    return queryString ? `${basePath}?${queryString}` : basePath
  }

  const generatePageNumbers = () => {
    const pages = []
    const showEllipsis = totalPages > 7

    if (!showEllipsis) {
      // Mostrar todas las páginas si son pocas
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      // Lógica para mostrar páginas con ellipsis
      if (currentPage <= 4) {
        // Páginas iniciales: 1, 2, 3, 4, 5, ..., last
        for (let i = 1; i <= 5; i++) {
          pages.push(i)
        }
        pages.push('ellipsis')
        pages.push(totalPages)
      } else if (currentPage >= totalPages - 3) {
        // Páginas finales: 1, ..., n-4, n-3, n-2, n-1, n
        pages.push(1)
        pages.push('ellipsis')
        for (let i = totalPages - 4; i <= totalPages; i++) {
          pages.push(i)
        }
      } else {
        // Páginas del medio: 1, ..., current-1, current, current+1, ..., last
        pages.push(1)
        pages.push('ellipsis')
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i)
        }
        pages.push('ellipsis')
        pages.push(totalPages)
      }
    }

    return pages
  }

  const pageNumbers = generatePageNumbers()

  return (
    <div className="flex items-center justify-center space-x-1 mt-8">
      {/* Botón anterior */}
      {hasPrev ? (
        <Button asChild variant="outline" size="sm">
          <Link href={buildURL(currentPage - 1)}>
            <ChevronLeft className="h-4 w-4" />
            Anterior
          </Link>
        </Button>
      ) : (
        <Button variant="outline" size="sm" disabled>
          <ChevronLeft className="h-4 w-4" />
          Anterior
        </Button>
      )}

      {/* Números de página */}
      <div className="flex items-center space-x-1">
        {pageNumbers.map((page, index) => {
          if (page === 'ellipsis') {
            return (
              <div key={`ellipsis-${index}`} className="px-3 py-2">
                <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
              </div>
            )
          }

          const pageNumber = page as number
          const isActive = pageNumber === currentPage

          return (
            <Button
              key={pageNumber}
              asChild={!isActive}
              variant={isActive ? "default" : "outline"}
              size="sm"
              className="min-w-[40px]"
            >
              {isActive ? (
                <span>{pageNumber}</span>
              ) : (
                <Link href={buildURL(pageNumber)}>
                  {pageNumber}
                </Link>
              )}
            </Button>
          )
        })}
      </div>

      {/* Botón siguiente */}
      {hasNext ? (
        <Button asChild variant="outline" size="sm">
          <Link href={buildURL(currentPage + 1)}>
            Siguiente
            <ChevronRight className="h-4 w-4" />
          </Link>
        </Button>
      ) : (
        <Button variant="outline" size="sm" disabled>
          Siguiente
          <ChevronRight className="h-4 w-4" />
        </Button>
      )}
    </div>
  )
}