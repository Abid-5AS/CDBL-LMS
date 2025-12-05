"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import Image from "next/image"

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string
}

const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full",
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)
Avatar.displayName = "Avatar"

const AvatarFallback = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "flex h-full w-full items-center justify-center rounded-full bg-muted text-sm font-medium",
        className
      )}
      {...props}
    />
  )
})
AvatarFallback.displayName = "AvatarFallback"

const AvatarImage = React.forwardRef<
  HTMLImageElement,
  Omit<React.ComponentProps<typeof Image>, "alt"> & { alt?: string }
>(({ className, src, alt = "Avatar", ...props }, ref) => {
  // If no src is provided, we can't render next/image properly without crashing or empty.
  // The fallback should handle this case if this component returns null, but Radix primitive usually handles switching.
  // Since this is a custom implementation, the AvatarFallback is likely rendered as a sibling.
  // But here, Avatar renders children. Usually usage is: <Avatar><AvatarImage /><AvatarFallback /></Avatar>.
  // If Image fails to load, we want Fallback to show.
  // next/image has an onError prop we can use if needed, but for now let's just render it.
  // Note: next/image with fill requires parent to have relative position (Avatar has it).
  
  if (!src) return null;

  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes="40px"
      className={cn("aspect-square h-full w-full object-cover", className)}
      {...props}
    />
  )
})
AvatarImage.displayName = "AvatarImage"

export { Avatar, AvatarImage, AvatarFallback }

