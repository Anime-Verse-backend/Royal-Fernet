/**
 * @fileoverview Componente de UI de ShadCN (Collapsible).
 * Este archivo contiene un componente predefinido de la biblioteca ShadCN/UI.
 * Permite crear una sección de contenido que puede ser expandida o colapsada
 * por el usuario.
 */
"use client"

import * as CollapsiblePrimitive from "@radix-ui/react-collapsible"

const Collapsible = CollapsiblePrimitive.Root

const CollapsibleTrigger = CollapsiblePrimitive.CollapsibleTrigger

const CollapsibleContent = CollapsiblePrimitive.CollapsibleContent

export { Collapsible, CollapsibleTrigger, CollapsibleContent }
