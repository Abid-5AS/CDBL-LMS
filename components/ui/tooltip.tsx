"use client"

import * as React from "react"
import * as TooltipPrimitive from "@radix-ui/react-tooltip"

import { cn } from "@/lib/utils"

function TooltipProvider({
  delayDuration = 100,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Provider>) {
  return (
    <TooltipPrimitive.Provider
      data-slot="tooltip-provider"
      delayDuration={delayDuration}
      {...props}
    />
  )
}

function Tooltip({
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Root>) {
  return (
    <TooltipProvider>
      <TooltipPrimitive.Root data-slot="tooltip" {...props} />
    </TooltipProvider>
  )
}

function TooltipTrigger({
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Trigger>) {
  return <TooltipPrimitive.Trigger data-slot="tooltip-trigger" {...props} />
}

function TooltipContent({
  className,
  sideOffset = 6,
  children,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Content>) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        data-slot="tooltip-content"
        sideOffset={sideOffset}
        className={cn(
          // Base styles - Material 3 + Glass aesthetic
          "z-50 w-fit rounded-xl px-4 py-3 text-sm font-medium text-balance",
          // High contrast backgrounds for accessibility (≥4.5:1 contrast ratio)
          "bg-card/80 text-foreground",
          // Subtle border with glass effect
          "border border-border/50",
          // Backdrop blur for glassmorphism
          "backdrop-blur-xl",
          // Material 3 elevation shadow
          "shadow-lg shadow-black/10",
          // Smooth fade-in animation (0.2s ease)
          "animate-in fade-in-0 duration-200 ease-out",
          // Smooth fade-out animation (0.15s ease)
          "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:duration-150 data-[state=closed]:ease-in",
          // Subtle slide-in from trigger direction
          "data-[side=bottom]:slide-in-from-top-1 data-[side=left]:slide-in-from-right-1 data-[side=right]:slide-in-from-left-1 data-[side=top]:slide-in-from-bottom-1",
          // Prevent text selection
          "select-none",
          className
        )}
        {...props}
      >
        {children}
        <TooltipPrimitive.Arrow
          className={cn(
            "z-50 fill-card/80",
            // Match border color
            "stroke-border/50",
            "size-2.5"
          )}
        />
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
  )
}

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider }
