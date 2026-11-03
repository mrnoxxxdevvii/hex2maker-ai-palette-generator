import { Copy } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { normalizeHex } from '../lib/palette'

function isPartialHex(value) {
  if (value.length === 0) return true

  const body = value.replace('#', '')
  return /^#?[A-Fa-f0-9]{0,6}$/.test(value) && body.length < 6
}

export function PaletteRow({ slot, color, onChange, onCopy }) {
  const [draft, setDraft] = useState(color)
  const [showError, setShowError] = useState(false)
  const textInputRef = useRef(null)

  useEffect(() => {
    if (document.activeElement === textInputRef.current) return

    setDraft(color)
    setShowError(false)
  }, [color])

  const handleTextChange = (event) => {
    const next = event.target.value.toUpperCase()
    setDraft(next)

    if (isPartialHex(next)) {
      setShowError(false)
      if (/^#[A-Fa-f0-9]{3}$/.test(next)) onChange(slot.key, normalizeHex(next))
      return
    }

    const normalized = normalizeHex(next)

    if (normalized) {
      setShowError(false)
      onChange(slot.key, normalized)
    } else {
      setShowError(true)
    }
  }

  const handleBlur = () => {
    const normalized = normalizeHex(draft)

    if (!normalized) {
      setDraft(color)
      setShowError(false)
      return
    }

    setDraft(normalized)
    setShowError(false)
    onChange(slot.key, normalized)
  }

  const handlePickerChange = (event) => {
    const normalized = normalizeHex(event.target.value)
    if (!normalized) return

    setShowError(false)
    onChange(slot.key, normalized)
  }

  const errorId = `hex-error-${slot.key}`

  return (
    <li className="border-b border-line-soft last:border-b-0">
      <div className="flex items-center gap-3 px-4 py-2.5">
        <div className="color-swatch">
          <span
            aria-hidden="true"
            className="absolute inset-0"
            style={{ backgroundColor: color }}
          />
          <input
            type="color"
            value={normalizeHex(color)?.toLowerCase() ?? '#000000'}
            onChange={handlePickerChange}
            aria-label={`Choose ${slot.label} color`}
            className="absolute inset-0 size-full cursor-pointer opacity-0"
          />
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-medium leading-5 text-ink">{slot.label}</p>
          <p className="truncate text-xs leading-5 text-ink-subtle">{slot.description}</p>
        </div>

        <input
          ref={textInputRef}
          type="text"
          value={draft}
          onChange={handleTextChange}
          onBlur={handleBlur}
          maxLength={7}
          spellCheck={false}
          autoComplete="off"
          aria-label={`${slot.label} HEX value`}
          aria-invalid={showError}
          aria-describedby={showError ? errorId : undefined}
          className={`w-[88px] rounded border bg-transparent px-1.5 py-1 text-right font-mono text-xs uppercase tracking-wide transition-colors ${
            showError
              ? 'border-danger text-danger'
              : 'border-transparent text-ink-muted hover:border-line focus:border-link focus:bg-inset focus:text-ink'
          }`}
        />

        <button
          type="button"
          onClick={() => onCopy(slot)}
          aria-label={`Copy ${slot.label} HEX value`}
          title="Copy HEX"
          className="-mr-1.5 flex size-7 items-center justify-center rounded text-ink-subtle transition-colors hover:bg-inset hover:text-ink"
        >
          <Copy className="size-3.5" />
        </button>
      </div>

      {showError ? (
        <p id={errorId} className="pb-2 pl-[3.75rem] pr-4 text-xs text-danger">
          Use #RGB or #RRGGBB.
        </p>
      ) : null}
    </li>
  )
}
