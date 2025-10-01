// Fichier: src/components/ui/toast.tsx
import * as React from "react"
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from "lucide-react"
import { cva, type VariantProps } from "class-variance-authority"
import { motion, AnimatePresence } from "framer-motion"

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
    <div className="fixed top-20 right-1 md:right-4 z-[2000] flex flex-col gap-2 max-w-md w-[95%] sm:max-w-sm">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <Toast key={toast.id} toast={toast} />
        ))}
      </AnimatePresence>
    </div>
  )
}

const toastVariants = cva(
  "group pointer-events-auto relative flex w-full items-start space-x-3 overflow-hidden rounded-lg border p-4 shadow-lg transition-all",
  {
    variants: {
      variant: {
        default: "border-gray-200 bg-white text-gray-900",
        destructive: "border-red-200 bg-red-50 text-red-900",
        success: "border-green-200 bg-green-50 text-green-900",
        warning: "border-orange-200 bg-orange-50 text-orange-900",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const getToastIcon = (variant: string) => {
  switch (variant) {
    case "destructive":
      return <AlertCircle className="w-5 h-5 mt-0.5 text-red-500" />
    case "success":
      return <CheckCircle className="w-5 h-5 mt-0.5 text-green-500" />
    case "warning":
      return <AlertTriangle className="w-5 h-5 mt-0.5 text-orange-500" />
    default:
      return <Info className="w-5 h-5 mt-0.5 text-blue-500" />
  }
}

const Toast = ({ toast }: { toast: any }) => {
  const { dismiss } = useToast()
  const [progress, setProgress] = React.useState(100)
  const progressRef = React.useRef<NodeJS.Timeout>()

  React.useEffect(() => {
    if (toast.duration === 0) return // Pas de progression pour les toasts persistants

    const startTime = Date.now()
    const totalDuration = toast.duration || 5000

    const updateProgress = () => {
      const elapsed = Date.now() - startTime
      const remaining = Math.max(0, 100 - (elapsed / totalDuration) * 100)
      setProgress(remaining)

      if (remaining > 0) {
        progressRef.current = setTimeout(updateProgress, 50)
      }
    }

    progressRef.current = setTimeout(updateProgress, 50)

    return () => {
      if (progressRef.current) {
        clearTimeout(progressRef.current)
      }
    }
  }, [toast.duration])

  const handleMouseEnter = () => {
    if (progressRef.current) {
      clearTimeout(progressRef.current)
    }
  }

  const handleMouseLeave = () => {
    if (toast.duration === 0) return
    
    const startTime = Date.now()
    const totalDuration = toast.duration || 5000
    const remainingTime = (progress / 100) * totalDuration

    progressRef.current = setTimeout(() => {
      const updateProgress = () => {
        const elapsed = Date.now() - startTime
        const remaining = Math.max(0, 100 - (elapsed / remainingTime) * 100)
        setProgress(remaining)

        if (remaining > 0) {
          progressRef.current = setTimeout(updateProgress, 50)
        }
      }
      updateProgress()
    }, 100)
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, /*x: 300,*/ scale: 0.9 }}
      animate={{ opacity: 1, /*x: 0,*/ scale: 1 }}
      exit={{ opacity: 0, /*x: 300,*/ scale: 0.9 }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
      className={toastVariants({ variant: toast.variant })}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Icône */}
      <div className="flex-shrink-0">
        {toast.icon || getToastIcon(toast.variant)}
      </div>

      {/* Contenu */}
      <div className="flex-1 min-w-0 space-y-1">
        {toast.title && (
          <div className="text-sm font-semibold leading-tight">{toast.title}</div>
        )}
        {toast.description && (
          <div className="text-sm leading-tight text-gray-600">{toast.description}</div>
        )}
        {toast.action && (
          <div className="pt-2">
            {toast.action}
          </div>
        )}
      </div>

      {/* Bouton de fermeture */}
      <button
        onClick={() => dismiss(toast.id)}
        className="flex-shrink-0 p-1 transition-all rounded-md opacity-70 hover:opacity-100 hover:bg-black/5 focus:outline-none focus:ring-2 focus:ring-offset-1"
      >
        <X className="w-4 h-4" />
      </button>

      {/* Barre de progression */}
      {toast.duration !== 0 && (
        <div className="absolute bottom-0 left-0 right-0 h-1 overflow-hidden bg-gray-200 rounded-b-lg">
          <motion.div
            className={cn(
              "h-full",
              toast.variant === "destructive" && "bg-red-500",
              toast.variant === "success" && "bg-green-500",
              toast.variant === "warning" && "bg-orange-500",
              toast.variant === "default" && "bg-blue-500"
            )}
            initial={{ width: "100%" }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.05 }}
          />
        </div>
      )}
    </motion.div>
  )
}

// Composant utilitaire pour faciliter l'utilisation
const toastFunctions = {
  success: (title: string, description?: string, options?: any) => 
    Toast({ title, description, variant: "success", ...options }),
  
  error: (title: string, description?: string, options?: any) => 
    Toast({ title, description, variant: "destructive", ...options }),
  
  warning: (title: string, description?: string, options?: any) => 
    Toast({ title, description, variant: "warning", ...options }),
  
  info: (title: string, description?: string, options?: any) => 
    Toast({ title, description, variant: "default", ...options }),
  
  // Toast persistant (ne disparaît pas automatiquement)
  persistent: (title: string, description?: string, options?: any) => 
    Toast({ title, description, duration: 0, ...options })
}

export { ToastProvider, Toast, toastFunctions }