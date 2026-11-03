import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react'

const TOAST_STYLES = {
  success: { icon: CheckCircle2, iconClass: 'text-success' },
  error: { icon: AlertCircle, iconClass: 'text-danger' },
  info: { icon: Info, iconClass: 'text-link' },
}

export function ToastStack({ toasts, onDismiss }) {
  if (toasts.length === 0) return null

  return (
    <div className="fixed inset-x-4 bottom-4 z-50 flex flex-col gap-2 sm:left-auto sm:right-5 sm:w-[360px]">
      {toasts.map((toast) => {
        const style = TOAST_STYLES[toast.type] ?? TOAST_STYLES.info
        const Icon = style.icon

        return (
          <div
            key={toast.id}
            role={toast.type === 'error' ? 'alert' : 'status'}
            className="toast-item relative flex items-start gap-2.5 rounded-md border border-line bg-panel py-2.5 pl-3 pr-9 shadow-lg shadow-black/25"
          >
            <Icon className={`mt-0.5 size-4 shrink-0 ${style.iconClass}`} />
            <div className="min-w-0">
              <p className="text-[13px] font-medium leading-5 text-ink">{toast.title}</p>
              {toast.message ? (
                <p className="mt-0.5 text-xs leading-5 text-ink-muted">{toast.message}</p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={() => onDismiss(toast.id)}
              aria-label="Dismiss notification"
              className="absolute right-1.5 top-1.5 flex size-6 items-center justify-center rounded text-ink-subtle transition-colors hover:bg-inset hover:text-ink"
            >
              <X className="size-3.5" />
            </button>
          </div>
        )
      })}
    </div>
  )
}
