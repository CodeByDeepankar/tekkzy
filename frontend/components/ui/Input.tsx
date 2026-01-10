import * as React from "react"
import { cn } from "@/lib/utils"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, error, ...props }, ref) => {
    return (
      <div className="w-full space-y-2">
         {label && (
            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-foreground/90">
                {label}
            </label>
         )}
         <input
            type={type}
            className={cn(
            "flex h-11 w-full rounded-xl border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
             error ? "border-destructive focus-visible:ring-destructive" : "",
            className
            )}
            ref={ref}
            {...props}
        />
        {error && <p className="text-sm font-medium text-destructive">{error}</p>}
      </div>
    )
  }
)
Input.displayName = "Input"
