import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-11 w-full min-w-0 rounded-lg border border-[var(--primary-100)] bg-[var(--white)] px-4 text-right text-[15px] text-[var(--black-300)] shadow-[inset_0_1px_2px_rgba(199,91,122,0.08)] transition-all outline-none [direction:rtl]",
        "placeholder:text-[var(--black-100)] selection:bg-[var(--primary-200)] selection:text-[var(--black-300)]",
        "focus-visible:border-[var(--primary-300)] focus-visible:ring-2 focus-visible:ring-[var(--primary-200)] focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--white-100)]",
        "data-[invalid]:border-[var(--danger)] data-[invalid]:focus-visible:ring-[var(--danger)] aria-invalid:ring-destructive/20 aria-invalid:border-destructive",
        "file:inline-flex file:h-8 file:rounded-md file:border-0 file:bg-[var(--primary-100)] file:px-3 file:text-sm file:font-medium file:text-[var(--primary-400)]",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        className
      )}
      {...props}
    />
  )
}

export { Input }
