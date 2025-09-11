import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Skeleton para imagen */}
      <Skeleton className="w-full h-96 rounded-lg mb-8" />
      
      {/* Skeleton para título */}
      <Skeleton className="h-12 w-3/4 mb-8" />
      
      {/* Skeleton para contenido */}
      <div className="space-y-4">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    </div>
  )
}