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
          "z-50 w-fit rounded-lg px-3 py-2 text-xs font-medium text-balance",
          // High contrast backgrounds for accessibility (≥4.5:1 contrast ratio)
          "bg-[rgba(30,30,30,0.95)] dark:bg-[rgba(255,255,255,0.15)]",
          // White text for maximum readability
          "text-text-inverted dark:text-[#fefefe]",
          // Subtle border with glass effect
          "border border-bg-primary/20 dark:border-bg-primary/10",
          // Backdrop blur for glassmorphism
          "backdrop-blur-md",
          // Material 3 elevation shadow
          "shadow-[0_2px_8px_rgba(0,0,0,0.25)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.4)]",
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
            "z-50 size-2.5",
            // Match tooltip background
            "fill-[rgba(30,30,30,0.95)] dark:fill-[rgba(255,255,255,0.15)]",
            // Match border color
            "text-text-inverted/20 dark:text-text-inverted/10",
            "stroke-[0.5]"
          )}
        />
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
  )
}

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider }
