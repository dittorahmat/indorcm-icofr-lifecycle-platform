import * as React from "react"

import { cn } from "@/lib/utils"

export interface TableProps extends React.HTMLAttributes<HTMLTableElement> {
  noWrapper?: boolean
  wrapperProps?: React.HTMLAttributes<HTMLDivElement> & {
    "data-testid"?: string
    [key: `data-${string}`]: unknown
  }
}

const Table = React.forwardRef<
  HTMLTableElement,
  TableProps
>(({ className, noWrapper, wrapperProps, ...props }, ref) => {
  if (noWrapper) {
    return (
      <table
        ref={ref}
        className={cn("w-full caption-bottom text-sm", className)}
        {...props}
      />
    )
  }

  const {
    "aria-label": tableAriaLabel,
    "aria-labelledby": tableAriaLabelledby,
    ...tableRestProps
  } = props

  const {
    className: wrapperClassName,
    role = "region",
    tabIndex = 0,
    "aria-label": wrapperAriaLabel = tableAriaLabel,
    "aria-labelledby": wrapperAriaLabelledby = tableAriaLabelledby,
    ...restWrapperProps
  } = wrapperProps ?? {}

  return (
    <div
      role={role}
      tabIndex={tabIndex}
      aria-label={wrapperAriaLabel}
      aria-labelledby={wrapperAriaLabelledby}
      className={cn(
        "@container relative w-full max-w-full overflow-x-auto touch-pan-x overscroll-x-contain table-scroll-hint focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
        wrapperClassName
      )}
      {...restWrapperProps}
    >
      <table
        ref={ref}
        className={cn("w-full caption-bottom text-sm", className)}
        {...tableRestProps}
      />
    </div>
  )
})
Table.displayName = "Table"

export interface TableHeaderProps extends React.HTMLAttributes<HTMLTableSectionElement> {
  sticky?: boolean
}

const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  TableHeaderProps
>(({ className, sticky, ...props }, ref) => (
  <thead
    ref={ref}
    className={cn(
      "[&_tr]:border-b-2 [&_tr]:border-slate-300 bg-slate-50",
      sticky && "sticky top-0 z-10 shadow-sm",
      className
    )}
    {...props}
  />
))
TableHeader.displayName = "TableHeader"

const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody
    ref={ref}
    className={cn("[&_tr:last-child]:border-0", className)}
    {...props}
  />
))
TableBody.displayName = "TableBody"

const TableFooter = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tfoot
    ref={ref}
    className={cn(
      "border-t-2 border-slate-300 bg-muted/50 font-medium [&>tr]:last:border-b-0",
      className
    )}
    {...props}
  />
))
TableFooter.displayName = "TableFooter"

const TableRow = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement>
>(({ className, ...props }, ref) => (
  <tr
    ref={ref}
    className={cn(
      "border-b-2 border-slate-200 transition-colors hover:bg-blue-50/50 data-[state=selected]:bg-muted",
      className
    )}
    {...props}
  />
))
TableRow.displayName = "TableRow"

export interface TableHeadProps extends React.ThHTMLAttributes<HTMLTableCellElement> {
  stickyLeft?: boolean
}

const TableHead = React.forwardRef<
  HTMLTableCellElement,
  TableHeadProps
>(({ className, stickyLeft, ...props }, ref) => (
  <th
    ref={ref}
    className={cn(
      "h-10 px-2 text-left align-middle font-bold text-slate-900 border-r-2 border-slate-200 last:border-r-0 [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
      stickyLeft && "sticky left-0 z-20 bg-slate-50",
      className
    )}
    {...props}
  />
))
TableHead.displayName = "TableHead"

export interface TableCellProps extends React.TdHTMLAttributes<HTMLTableCellElement> {
  stickyLeft?: boolean
}

const TableCell = React.forwardRef<
  HTMLTableCellElement,
  TableCellProps
>(({ className, stickyLeft, ...props }, ref) => (
  <td
    ref={ref}
    className={cn(
      "p-2 align-middle border-r-2 border-slate-100 last:border-r-0 [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
      stickyLeft && "sticky left-0 z-[2] bg-white",
      className
    )}
    {...props}
  />
))
TableCell.displayName = "TableCell"

const TableCaption = React.forwardRef<
  HTMLTableCaptionElement,
  React.HTMLAttributes<HTMLTableCaptionElement>
>(({ className, ...props }, ref) => (
  <caption
    ref={ref}
    className={cn("mt-4 text-sm text-muted-foreground", className)}
    {...props}
  />
))
TableCaption.displayName = "TableCaption"

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
}
