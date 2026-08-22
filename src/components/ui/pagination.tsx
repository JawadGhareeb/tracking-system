import * as React from "react"
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  MoreHorizontalIcon,
} from "lucide-react"
import { useTranslation } from "react-i18next"

import { cn } from "@/lib/utils"

function Pagination({ className, ...props }: React.ComponentProps<"nav">) {
  const { t } = useTranslation()

  return (
    <nav
      role="navigation"
      aria-label={t("pagination.label")}
      data-slot="pagination"
      className={cn("mx-auto flex w-full justify-center", className)}
      {...props}
    />
  )
}

function PaginationContent({
  className,
  ...props
}: React.ComponentProps<"ul">) {
  return (
    <ul
      data-slot="pagination-content"
      className={cn("flex flex-row items-center gap-1", className)}
      {...props}
    />
  )
}

function PaginationItem({ ...props }: React.ComponentProps<"li">) {
  return <li data-slot="pagination-item" {...props} />
}

type PaginationLinkProps = {
  isActive?: boolean
  size?: "default" | "compact"
} & React.ComponentProps<"a">

function PaginationLink({
  className,
  isActive,
  size = "compact",
  ...props
}: PaginationLinkProps) {
  return (
    <a
      aria-current={isActive ? "page" : undefined}
      data-slot="pagination-link"
      data-active={isActive}
      className={cn(
        "inline-flex items-center justify-center font-semibold transition-colors",
        size === "compact" ? "size-10 rounded-lg" : "h-11 min-w-[3rem] rounded-xl px-4",
        isActive
          ? "border border-[var(--primary-300)] bg-[var(--primary-300)] text-white shadow-sm"
          : "border border-[var(--primary-100)] bg-[var(--white)] text-[var(--black-200)] hover:border-[var(--primary-200)] hover:text-[var(--primary-400)]",
        className
      )}
      {...props}
    />
  )
}

function PaginationPrevious({
  className,
  ...props
}: React.ComponentProps<typeof PaginationLink>) {
  const { t } = useTranslation()

  return (
    <PaginationLink
      aria-label={t("pagination.previousAria")}
      size="default"
      className={cn("gap-1 px-3 sm:pl-3", className)}
      {...props}
    >
      <ChevronLeftIcon />
      <span className="hidden sm:block">{t("common.previous")}</span>
    </PaginationLink>
  )
}

function PaginationNext({
  className,
  ...props
}: React.ComponentProps<typeof PaginationLink>) {
  const { t } = useTranslation()

  return (
    <PaginationLink
      aria-label={t("pagination.nextAria")}
      size="default"
      className={cn("gap-1 px-3 sm:pr-3", className)}
      {...props}
    >
      <span className="hidden sm:block">{t("common.next")}</span>
      <ChevronRightIcon />
    </PaginationLink>
  )
}

function PaginationEllipsis({
  className,
  ...props
}: React.ComponentProps<"span">) {
  const { t } = useTranslation()

  return (
    <span
      aria-hidden
      data-slot="pagination-ellipsis"
      className={cn("flex size-9 items-center justify-center", className)}
      {...props}
    >
      <MoreHorizontalIcon className="size-4" />
      <span className="sr-only">{t("pagination.morePages")}</span>
    </span>
  )
}

export {
  Pagination,
  PaginationContent,
  PaginationLink,
  PaginationItem,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
}
