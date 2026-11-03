import { ChevronDown, Copy, LoaderCircle, RotateCcw } from 'lucide-react'
import { getContrastReport } from '../lib/palette'
import { PaletteRow } from './PaletteRow'

function gradeColor(grade) {
  if (grade === 'Fail') return 'text-danger'
  if (grade === 'AA Large') return 'text-warning'
  return 'text-success'
}

export function PalettePanel({
  palette,
  slots,
  isGenerating,
  onColorChange,
  onReset,
  onCopyPalette,
  onCopyHex,
}) {
  const report = getContrastReport(palette)

  return (
    <section aria-labelledby="palette-heading" className="min-w-0 lg:sticky lg:top-6 lg:self-start">
      <div className="overflow-hidden rounded-md border border-line bg-panel">
        <div className="flex h-12 items-center justify-between gap-3 border-b border-line-soft px-4">
          <div className="flex items-baseline gap-2">
            <h2 id="palette-heading" className="text-sm font-semibold text-ink">
              Palette
            </h2>
            <span className="text-xs text-ink-subtle">{slots.length} colors</span>
          </div>

          <div className="flex items-center gap-2">
            {isGenerating ? (
              <span className="flex items-center gap-1.5 text-xs text-ink-subtle">
                <LoaderCircle className="size-3 animate-spin" />
                Generating
              </span>
            ) : null}
            <button
              type="button"
              onClick={onReset}
              className="btn btn-ghost h-7 px-2 text-xs"
            >
              <RotateCcw className="size-3" />
              Reset
            </button>
          </div>
        </div>

        <ul
          aria-busy={isGenerating}
          className={`transition-opacity ${isGenerating ? 'opacity-60' : ''}`}
        >
          {slots.map((slot) => (
            <PaletteRow
              key={slot.key}
              slot={slot}
              color={palette[slot.key]}
              onChange={onColorChange}
              onCopy={onCopyHex}
            />
          ))}
        </ul>

        <div className="border-t border-line-soft p-3">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => onCopyPalette('css')}
              className="btn btn-secondary h-8 px-2 text-xs"
            >
              <Copy className="size-3" />
              CSS variables
            </button>
            <button
              type="button"
              onClick={() => onCopyPalette('tailwind')}
              className="btn btn-secondary h-8 px-2 text-xs"
            >
              <Copy className="size-3" />
              Tailwind config
            </button>
          </div>
        </div>

        <details className="group border-t border-line-soft">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-xs text-ink-muted transition-colors hover:text-ink [&::-webkit-details-marker]:hidden">
            <span className="flex items-center gap-1.5">
              <ChevronDown className="size-3.5 transition-transform group-open:rotate-180" />
              Contrast check
            </span>
            <span className="text-ink-subtle">WCAG 2.1</span>
          </summary>

          <ul className="space-y-2 px-4 pb-4">
            {report.map((item) => (
              <li key={item.label} className="flex items-center justify-between gap-3 text-xs">
                <span className="text-ink-muted">{item.label}</span>
                <span className="font-mono text-ink-subtle">
                  {item.ratio?.toFixed(2) ?? '—'}:1{' '}
                  <span className={gradeColor(item.grade)}>{item.grade}</span>
                </span>
              </li>
            ))}
          </ul>
        </details>
      </div>

      <p className="mt-3 text-xs text-ink-subtle">
        Click a swatch or HEX value to edit. Values are validated before export.
      </p>
    </section>
  )
}
