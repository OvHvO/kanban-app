import * as React from "react"
import { cn } from "@/lib/utils"

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost" | "danger"
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap px-4 py-2 text-sm font-bold transition-all border-sketchy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 disabled:pointer-events-none disabled:opacity-50",
          {
            "bg-slate-900 text-slate-50 hover:bg-slate-900/90 shadow-sketchy hover:shadow-sketchy-active active:shadow-none active:translate-x-1 active:translate-y-1":
              variant === "default",
            "bg-transparent text-slate-900 hover:bg-slate-100":
              variant === "outline",
            "border-transparent hover:bg-slate-100":
              variant === "ghost",
            "bg-red-500 text-white border-red-900 shadow-sketchy hover:bg-red-600 active:shadow-none active:translate-x-1 active:translate-y-1":
              variant === "danger",
          },
          className
        )}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
