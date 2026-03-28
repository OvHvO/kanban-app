import * as React from "react"
import { cn } from "@/lib/utils"

const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "border-sketchy bg-white text-slate-950 shadow-sketchy-active p-4",
        className
      )}
      {...props}
    />
  )
)
Card.displayName = "Card"

export { Card }
