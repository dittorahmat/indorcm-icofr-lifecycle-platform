import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<
  HTMLInputElement,
  React.ComponentProps<"input"> & { isInvalid?: boolean }
>(({ className, type, isInvalid, ...props }, ref) => {
  return (
    <input
      type={type}
      aria-invalid={isInvalid ? "true" : undefined}
      className={cn(
        "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors duration-150 ease-[cubic-bezier(0.22,1,0.36,1)] file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        isInvalid && "border-destructive text-destructive focus-visible:ring-destructive t-shake",
        className
      )}
      ref={ref}
      {...props}
    />
  )
})
Input.displayName = "Input"

export { Input }
