import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
 "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-black tracking-wide uppercase ring-offset-background transition-all active-press focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-5 [&_svg]:shrink-0",
 {
  variants: {
   variant: {
    default: "bg-gradient-to-r from-primary to-purple-600 text-white shadow-[0_8px_30px_rgba(156,39,176,0.3)] hover:brightness-110 border border-white/20",
    destructive:
     "bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-[0_8px_30px_rgba(239,68,68,0.3)] hover:brightness-110 border border-white/20",
    outline:
     "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
    secondary:
     "bg-secondary text-secondary-foreground hover:bg-secondary/80",
    ghost: "hover:bg-accent hover:text-accent-foreground",
    link: "text-primary underline-offset-4 hover:underline",
   },
   size: {
    default: "h-12 px-6 py-2 shadow-md",
    sm: "h-10 rounded-full px-4 shadow-sm text-[10px]",
    lg: "h-14 rounded-full px-10 shadow-lg text-base",
    icon: "h-12 w-12 rounded-full",
   },
  },
  defaultVariants: {
   variant: "default",
   size: "default",
  },
 }
)

export interface ButtonProps
 extends React.ButtonHTMLAttributes<HTMLButtonElement>,
  VariantProps<typeof buttonVariants> {
 asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
 ({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button"
  return (
   <Comp
    className={cn(buttonVariants({ variant, size, className }))}
    ref={ref}
    {...props}
   />
  )
 }
)
Button.displayName = "Button"

export { Button, buttonVariants }
