import { ExternalLink } from 'lucide-react'

export function AppHeader() {
  return (
    <header className="border-b border-line-soft bg-canvas">
      <div className="mx-auto flex h-14 max-w-[1180px] items-center justify-between gap-4 px-5 sm:px-6">
        <a href="/" className="flex items-center" aria-label="Hex2Maker home">
          <img
            src="/logo.png"
            alt=""
            width="384"
            height="90"
            className="h-7 w-auto sm:h-8"
          />
        </a>

        <a
          href="https://github.com/mrnoxxxdevvii"
          target="_blank"
          rel="noreferrer"
          className="btn btn-secondary h-8 px-3 text-xs"
        >
          GitHub
          <ExternalLink className="size-3 text-ink-subtle" aria-hidden="true" />
        </a>
      </div>
    </header>
  )
}
