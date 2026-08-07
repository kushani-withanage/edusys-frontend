import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/utils/utils"

const alertVariants = cva(
  "group/alert relative w-full rounded-2xl border p-4 shadow-[0_12px_40px_rgba(0,0,0,0.12)] flex items-start gap-3 border-l-4 text-[#111111] transition-all duration-300",
  {
    variants: {
      variant: {
        default: "bg-[#F8FAFC] border-[#E2E8F0] border-l-slate-500 text-slate-850",
        destructive: "bg-[#FFF5F5] border-[#FEE2E2] border-l-rose-500 text-rose-900",
        success: "bg-[#F0FDF4] border-[#DCFCE7] border-l-emerald-500 text-emerald-950",
        warning: "bg-[#FFFBEB] border-[#FEF3C7] border-l-amber-500 text-amber-950",
        info: "bg-[#F0F9FF] border-[#E0F2FE] border-l-sky-500 text-sky-950",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Alert({
  className,
  variant,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof alertVariants>) {
  return (
    <div
      data-slot="alert"
      role="alert"
      className={cn(alertVariants({ variant }), className)}
      {...props}
    />
  )
}

function AlertTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-title"
      className={cn(
        "font-extrabold tracking-tight text-sm text-inherit",
        className
      )}
      {...props}
    />
  )
}

function AlertDescription({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-description"
      className={cn(
        "font-semibold text-xs mt-1 leading-relaxed text-inherit opacity-90",
        className
      )}
      {...props}
    />
  )
}

function AlertAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-action"
      className={cn("absolute top-2 right-2", className)}
      {...props}
    />
  )
}

export { Alert, AlertTitle, AlertDescription, AlertAction }

