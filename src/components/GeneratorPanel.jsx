import { LoaderCircle } from 'lucide-react'
import { ApiSettings } from './ApiSettings'

const MAX_PROMPT_LENGTH = 2000

export function GeneratorPanel({
  prompt,
  onPromptChange,
  onGenerate,
  isGenerating,
  provider,
  onProviderChange,
  endpoint,
  onEndpointChange,
  apiKey,
  onApiKeyChange,
  model,
  onModelChange,
}) {
  const handleSubmit = (event) => {
    event.preventDefault()
    onGenerate()
  }

  const handleKeyDown = (event) => {
    if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
      event.preventDefault()
      onGenerate()
    }
  }

  return (
    <section aria-labelledby="generator-heading" className="min-w-0">
      <h1
        id="generator-heading"
        className="text-2xl font-semibold tracking-[-0.01em] text-ink"
      >
        Palette generator
      </h1>
      <p className="mt-1.5 max-w-xl text-sm leading-6 text-ink-muted">
        Describe the project. The palette appears on the right, ready to edit and copy.
      </p>

      <form onSubmit={handleSubmit} className="mt-7">
        <div className="flex items-center justify-between gap-3">
          <label htmlFor="project-description" className="text-sm font-medium text-ink">
            Project description
          </label>
          <span className="font-mono text-xs text-ink-subtle">
            {prompt.length}/{MAX_PROMPT_LENGTH}
          </span>
        </div>

        <textarea
          id="project-description"
          value={prompt}
          onChange={(event) => onPromptChange(event.target.value)}
          onKeyDown={handleKeyDown}
          maxLength={MAX_PROMPT_LENGTH}
          rows={8}
          placeholder="Describe the product, who it is for, and the visual direction. Example: a dark analytics dashboard for infrastructure teams, with dense tables, muted surfaces and a blue accent."
          className="field mt-2 w-full resize-y leading-6 placeholder:leading-6"
        />

        <div className="mt-3 flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={isGenerating}
            aria-busy={isGenerating}
            className="btn btn-primary"
          >
            {isGenerating ? <LoaderCircle className="size-4 animate-spin" /> : null}
            {isGenerating ? 'Generating…' : 'Generate palette'}
          </button>
          <span className="hidden text-xs text-ink-subtle sm:inline">
            <kbd className="rounded border border-line px-1 py-0.5 font-mono text-[10px]">Ctrl</kbd>
            {' + '}
            <kbd className="rounded border border-line px-1 py-0.5 font-mono text-[10px]">
              Enter
            </kbd>
          </span>
        </div>
      </form>

      <div className="mt-10 border-t border-line-soft pt-6">
        <ApiSettings
          provider={provider}
          onProviderChange={onProviderChange}
          endpoint={endpoint}
          onEndpointChange={onEndpointChange}
          apiKey={apiKey}
          onApiKeyChange={onApiKeyChange}
          model={model}
          onModelChange={onModelChange}
        />
      </div>
    </section>
  )
}
