"use client"

import * as React from "react"
import * as AvatarPrimitive from "@radix-ui/react-avatar"

import { cn } from "@/lib/utils"
import { getOptimizedMediaUrl } from "@/lib/media-proxy"

const Avatar = React.forwardRef<
 React.ElementRef<typeof AvatarPrimitive.Root>,
 React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>
>(({ className, ...props }, ref) => (
 <AvatarPrimitive.Root
  ref={ref}
  className={cn(
   "relative flex h-8 w-8 shrink-0 overflow-hidden rounded-full",
   className
  )}
  {...props}
 />
))
Avatar.displayName = AvatarPrimitive.Root.displayName

const AvatarImage = React.forwardRef<
 React.ElementRef<typeof AvatarPrimitive.Image>,
 React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>
>(({ className, src, ...props }, ref) => (
 <AvatarPrimitive.Image
  ref={ref}
  src={src ? getOptimizedMediaUrl(src) : undefined}
  className={cn("aspect-square h-full w-full", className)}
  {...props}
 />
))
AvatarImage.displayName = AvatarPrimitive.Image.displayName

const AvatarFallback = React.forwardRef<
 React.ElementRef<typeof AvatarPrimitive.Fallback>,
 React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>
>(({ className, ...props }, ref) => (
 <AvatarPrimitive.Fallback
  ref={ref}
  className={cn(
   "flex h-full w-full items-center justify-center rounded-full bg-muted",
   className
  )}
  {...props}
 />
))
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName

export { Avatar, AvatarImage, AvatarFallback }
