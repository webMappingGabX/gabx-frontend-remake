// Fichier: src/components/ui/toast.tsx
import * as React from "react"
import { X } from "lucide-react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "../../lib/utils"
import { useToast } from "../../hooks/useToast"

const ToastProvider = ({ children }: { children: React.ReactNode }) => {
  const { toasts } = useToast()

  return (
    <>
      {children}
      <ToastViewport toasts={toasts} />
    </>
  )
}

const ToastViewport = ({ toasts }: { toasts: any[] }) => {
  return (
    <div className="fixed top-0 z-100 flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]">
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} />
      ))}
    </div>
  )
}

const toastVariants = cva(
  "group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-6 pr-8 shadow-lg transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full data-[state=open]:sm:slide-in-from-bottom-full",
  {
    variants: {
      variant: {
        default: "border bg-background text-foreground",
        destructive:
          "destructive group border-destructive bg-destructive text-destructive-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const Toast = ({ toast }: { toast: any }) => {
  const { dismiss } = useToast()

  return (
    <div className={toastVariants({ variant: toast.variant })}>
      <div className="grid gap-1">
        {toast.title && (
          <div className="text-sm font-semibold">{toast.title}</div>
        )}
        {toast.description && (
          <div className="text-sm opacity-90">{toast.description}</div>
        )}
      </div>
      <button
        onClick={() => dismiss(toast.id)}
        className="absolute p-1 transition-opacity rounded-md opacity-0 right-2 top-2 text-foreground/50 hover:text-foreground focus:opacity-100 focus:outline-none focus:ring-2 group-hover:opacity-100"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}

export { ToastProvider, Toast }