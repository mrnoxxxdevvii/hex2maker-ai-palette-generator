import { Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'
import { PROVIDERS } from '../lib/ai'

export function ApiSettings({
  provider,
  onProviderChange,
  endpoint,
  onEndpointChange,
  apiKey,
  onApiKeyChange,
  model,
  onModelChange,
}) {
  const [showKey, setShowKey] = useState(false)
  const isApi = provider === 'api'

  return (
    <section aria-labelledby="provider-heading">
      <h2 id="provider-heading" className="text-sm font-semibold text-ink">
        Provider
      </h2>
      <p className="mt-1 text-xs text-ink-subtle">
        Run a model locally with Ollama or connect a chat completions API.
      </p>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="provider" className="text-xs font-medium text-ink-muted">
            Service
          </label>
          <select
            id="provider"
            value={provider}
            onChange={(event) => onProviderChange(event.target.value)}
            className="field mt-1.5 w-full"
          >
            <option value="ollama">Ollama (local)</option>
            <option value="api">API</option>
          </select>
        </div>

        <div>
          <label htmlFor="ai-model" className="text-xs font-medium text-ink-muted">
            Model
          </label>
          <input
            id="ai-model"
            type="text"
            value={model}
            onChange={(event) => onModelChange(event.target.value)}
            placeholder={isApi ? 'model-name' : 'llama3.2'}
            autoComplete="off"
            spellCheck={false}
            className="field mt-1.5 w-full font-mono text-xs"
          />
        </div>
      </div>

      {isApi ? (
        <div className="mt-4 space-y-4">
          <div>
            <label htmlFor="api-endpoint" className="text-xs font-medium text-ink-muted">
              API URL
            </label>
            <input
              id="api-endpoint"
              type="text"
              inputMode="url"
              value={endpoint}
              onChange={(event) => onEndpointChange(event.target.value)}
              placeholder="https://api.example.com/v1/chat/completions"
              autoComplete="off"
              spellCheck={false}
              className="field mt-1.5 w-full font-mono text-xs"
            />
            <p className="mt-2 text-xs leading-5 text-ink-subtle">
              Full chat completions URL. HTTPS is required for remote hosts; HTTP is allowed only
              for localhost.
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between gap-3">
              <label htmlFor="api-key" className="text-xs font-medium text-ink-muted">
                API key <span className="font-normal text-ink-subtle">(optional)</span>
              </label>
              {apiKey ? (
                <button
                  type="button"
                  onClick={() => onApiKeyChange('')}
                  className="text-xs text-ink-subtle transition-colors hover:text-ink"
                >
                  Forget key
                </button>
              ) : null}
            </div>

            <div className="relative mt-1.5">
              <input
                id="api-key"
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(event) => onApiKeyChange(event.target.value)}
                placeholder="Bearer token"
                autoComplete="off"
                spellCheck={false}
                className="field w-full pr-10 font-mono text-xs"
              />
              <button
                type="button"
                onClick={() => setShowKey((current) => !current)}
                aria-label={showKey ? 'Hide API key' : 'Show API key'}
                className="absolute inset-y-0 right-0 flex w-9 items-center justify-center text-ink-subtle transition-colors hover:text-ink"
              >
                {showKey ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
              </button>
            </div>

            <p className="mt-2 text-xs leading-5 text-ink-subtle">
              Stored in this tab only and sent directly to the URL above. Leave empty if your
              endpoint does not need a key.
            </p>
          </div>
        </div>
      ) : (
        <div className="mt-4">
          <p className="text-xs font-medium text-ink-muted">Endpoint</p>
          <div className="field mt-1.5 overflow-x-auto whitespace-nowrap font-mono text-xs text-ink-muted">
            {PROVIDERS.ollama.endpoint}
          </div>
          <p className="mt-2 text-xs leading-5 text-ink-subtle">
            If the browser blocks Ollama, allow this origin with{' '}
            <span className="font-mono text-ink-muted">OLLAMA_ORIGINS</span>.
          </p>
        </div>
      )}
    </section>
  )
}
