/**
 * @fileoverview Componente de UI de ShadCN (Skeleton).
 * Este archivo contiene un componente predefinido de la biblioteca ShadCN/UI.
 * Se utiliza para mostrar un marcador de posición de la interfaz mientras
 * el contenido se está cargando, mejorando la experiencia del usuario.
 */
import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  )
}

export { Skeleton }
