import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary-200)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--white-100)] disabled:pointer-events-none disabled:opacity-60 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 shadow-sm aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--primary-300)] text-white hover:bg-[var(--primary-400)] active:bg-[var(--primary-500)] border border-transparent",
        destructive:
          "bg-[var(--danger)] text-white hover:bg-[#cb4b4b] active:bg-[#b74343] border border-transparent",
        outline:
          "border border-[var(--primary-300)] bg-[var(--white-100)] text-[var(--primary-300)] hover:bg-[var(--primary-100)]",
        secondary:
          "bg-[var(--secondary-300)] text-white hover:bg-[var(--secondary-400)] active:bg-[var(--secondary-500)] border border-transparent",
        ghost:
          "bg-transparent text-[var(--primary-400)] hover:bg-[var(--primary-100)]",
        link: "text-[var(--primary-400)] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 px-6 text-[15px] has-[>svg]:px-5",
        sm: "h-9 rounded-md gap-1.5 px-4 text-sm has-[>svg]:px-3.5",
        lg: "h-12 rounded-lg px-8 text-base has-[>svg]:px-6",
        icon: "size-11 p-0",
        "icon-sm": "size-9 p-0",
        "icon-lg": "size-12 p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
