import * as React from "react"

import { cn } from "@/lib/utils"

export interface InputProps extends React.ComponentProps<"input"> {
  isInvalid?: boolean
  selectOnFocus?: boolean
}

const isNumericInput = (type?: string, inputMode?: string, value?: unknown) => {
  if (type === "number") return true
  if (inputMode === "numeric" || inputMode === "decimal") return true
  if (typeof value === "number") return true
  if (typeof value === "string" && value.trim() !== "" && /^(Rp\s?)?[-+]?\d+([.,]\d+)*%?$/.test(value.trim())) {
    return true
  }
  return false
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, isInvalid, selectOnFocus, onFocus, ...props }, ref) => {
    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      const target = e.currentTarget
      const shouldSelect = selectOnFocus ?? isNumericInput(type, props.inputMode, props.value)
      if (shouldSelect && target) {
        try {
          target.select()
        } catch {
          // ignore if not selectable
        }
        if (typeof window !== "undefined" && typeof window.requestAnimationFrame === "function") {
          window.requestAnimationFrame(() => {
            try {
              target.select()
            } catch {
              // ignore
            }
          })
        }
      }
      onFocus?.(e)
    }

    return (
      <input
        type={type}
        aria-invalid={isInvalid ? "true" : undefined}
        onFocus={handleFocus}
        className={cn(
          "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors duration-150 ease-[cubic-bezier(0.22,1,0.36,1)] file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
          isInvalid && "border-destructive text-destructive focus-visible:ring-destructive t-shake",
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
