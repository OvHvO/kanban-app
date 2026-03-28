import * as React from "react"
import { cn } from "@/lib/utils"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex w-full border-sketchy bg-white px-3 py-2 text-sm appearance-none outline-none focus:ring-2 focus:ring-slate-400 placeholder:text-slate-400 disabled:cursor-not-allowed disabled:opacity-50 shadow-[2px_2px_0px_#cbd5e1]",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
