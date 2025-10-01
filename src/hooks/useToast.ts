// Fichier: src/hooks/useToast.ts
import * as React from "react"

const TOAST_LIMIT = 5
const TOAST_REMOVE_DELAY = 5000 // Augmenté à 5 secondes pour une meilleure lisibilité
const TOAST_ANIMATION_DURATION = 300

type ToasterToast = {
  id: string
  title?: string
  description?: string
  action?: React.ReactElement
  variant?: "default" | "destructive" | "success" | "warning"
  duration?: number
  icon?: React.ReactElement
}

const actionTypes = {
  ADD_TOAST: "ADD_TOAST",
  UPDATE_TOAST: "UPDATE_TOAST",
  DISMISS_TOAST: "DISMISS_TOAST",
  REMOVE_TOAST: "REMOVE_TOAST",
} as const

let count = 0

function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER
  return `toast-${count}`
}

type Action =
  | {
      type: "ADD_TOAST"
      toast: ToasterToast
    }
  | {
      type: "UPDATE_TOAST"
      toast: Partial<ToasterToast>
    }
  | {
      type: "DISMISS_TOAST"
      toastId?: string
    }
  | {
      type: "REMOVE_TOAST"
      toastId?: string
    }

interface State {
  toasts: ToasterToast[]
}

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>()

const addToRemoveQueue = (toastId: string) => {
  if (toastTimeouts.has(toastId)) {
    return
  }

  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId)
    dispatch({
      type: "REMOVE_TOAST",
      toastId: toastId,
    })
  }, TOAST_ANIMATION_DURATION) // Retard pour l'animation de sortie

  toastTimeouts.set(toastId, timeout)
}

const addToAutoDismissQueue = (toastId: string, duration: number = TOAST_REMOVE_DELAY) => {
  const timeout = setTimeout(() => {
    dispatch({
      type: "DISMISS_TOAST",
      toastId: toastId,
    })
  }, duration)

  return timeout
}

export const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "ADD_TOAST":
      const newToast = action.toast
      // Démarrer le timer de disparition automatique
      if (newToast.duration !== 0) { // 0 = pas de disparition automatique
        const dismissTimeout = addToAutoDismissQueue(newToast.id, newToast.duration || TOAST_REMOVE_DELAY)
        toastTimeouts.set(`dismiss-${newToast.id}`, dismissTimeout)
      }
      
      return {
        ...state,
        toasts: [newToast, ...state.toasts].slice(0, TOAST_LIMIT),
      }

    case "UPDATE_TOAST":
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.toast.id ? { ...t, ...action.toast } : t
        ),
      }

    case "DISMISS_TOAST": {
      const { toastId } = action

      // Nettoyer le timer de disparition automatique
      if (toastId) {
        const dismissTimeout = toastTimeouts.get(`dismiss-${toastId}`)
        if (dismissTimeout) {
          clearTimeout(dismissTimeout)
          toastTimeouts.delete(`dismiss-${toastId}`)
        }
        addToRemoveQueue(toastId)
      } else {
        state.toasts.forEach((toast) => {
          const dismissTimeout = toastTimeouts.get(`dismiss-${toast.id}`)
          if (dismissTimeout) {
            clearTimeout(dismissTimeout)
            toastTimeouts.delete(`dismiss-${toast.id}`)
          }
          addToRemoveQueue(toast.id)
        })
      }

      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === toastId || toastId === undefined
            ? {
                ...t,
                open: false,
              }
            : t
        ),
      }
    }

    case "REMOVE_TOAST":
      if (action.toastId === undefined) {
        return {
          ...state,
          toasts: [],
        }
      }
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      }
  }
}

const listeners: Array<(state: State) => void> = []

let memoryState: State = { toasts: [] }

function dispatch(action: Action) {
  memoryState = reducer(memoryState, action)
  listeners.forEach((listener) => {
    listener(memoryState)
  })
}

type Toast = Omit<ToasterToast, "id">

function toast({ duration = TOAST_REMOVE_DELAY, ...props }: Toast & { duration?: number }) {
  const id = genId()

  const update = (props: Partial<ToasterToast>) =>
    dispatch({
      type: "UPDATE_TOAST",
      toast: { ...props, id },
    })
  const dismiss = () => dispatch({ type: "DISMISS_TOAST", toastId: id })

  dispatch({
    type: "ADD_TOAST",
    toast: {
      ...props,
      id,
      duration,
      open: true,
      onOpenChange: (open: boolean) => {
        if (!open) dismiss()
      },
    },
  })

  return {
    id: id,
    dismiss,
    update,
  }
}

function useToast() {
  const [state, setState] = React.useState<State>(memoryState)

  React.useEffect(() => {
    listeners.push(setState)
    return () => {
      const index = listeners.indexOf(setState)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }, [state])

  return {
    ...state,
    toast,
    dismiss: (toastId?: string) => dispatch({ type: "DISMISS_TOAST", toastId }),
  }
}

export { useToast, toast }