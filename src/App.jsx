import { useCallback, useState } from 'react'
import { AppHeader } from './components/AppHeader'
import { GeneratorPanel } from './components/GeneratorPanel'
import { PalettePanel } from './components/PalettePanel'
import { ToastStack } from './components/ToastStack'
import { useSessionState } from './hooks/useSessionState'
import { useToasts } from './hooks/useToasts'
import { DEFAULT_PROVIDER, PROVIDERS, generatePalette } from './lib/ai'
import { copyText } from './lib/clipboard'
import {
  DEFAULT_PALETTE,
  buildCssExport,
  buildTailwindExport,
  getPaletteSlots,
  normalizeHex,
} from './lib/palette'

const BASE_TOKEN_COUNT = 8

export default function App() {
  const [palette, setPalette] = useState(DEFAULT_PALETTE)
  const [prompt, setPrompt] = useState('')
  const [provider, setProvider] = useSessionState('hex2maker.provider', DEFAULT_PROVIDER)
  const [endpoint, setEndpoint] = useSessionState('hex2maker.apiEndpoint', '')
  const [apiKey, setApiKey] = useSessionState('hex2maker.apiKey', '')
  const [ollamaModel, setOllamaModel] = useSessionState('hex2maker.ollamaModel', 'llama3.2')
  const [apiModel, setApiModel] = useSessionState('hex2maker.apiModel', '')
  const [isGenerating, setIsGenerating] = useState(false)
  const { toasts, pushToast, dismissToast } = useToasts()

  const slots = getPaletteSlots(palette)
  const activeProvider = Object.hasOwn(PROVIDERS, provider) ? provider : DEFAULT_PROVIDER
  const model = activeProvider === 'api' ? apiModel : ollamaModel

  const handleProviderChange = (value) => {
    setProvider(value === 'api' ? 'api' : DEFAULT_PROVIDER)
  }

  const handleModelChange = (value) => {
    if (activeProvider === 'api') setApiModel(value)
    else setOllamaModel(value)
  }

  const handleColorChange = useCallback((key, nextColor) => {
    const color = normalizeHex(nextColor)
    if (!color) return

    setPalette((current) => (current[key] === color ? current : { ...current, [key]: color }))
  }, [])

  const handleReset = () => {
    setPalette({ ...DEFAULT_PALETTE })
    pushToast({
      type: 'info',
      title: 'Palette reset',
      message: 'All colors are back to the studio defaults.',
    })
  }

  const handleGenerate = async () => {
    if (isGenerating) return

    const cleanPrompt = prompt.trim()

    if (cleanPrompt.length < 12) {
      pushToast({
        type: 'error',
        title: 'Add more detail',
        message: 'Describe the project, its audience and the visual direction in at least 12 characters.',
      })
      return
    }

    if (activeProvider === 'api' && endpoint.trim().length === 0) {
      pushToast({
        type: 'error',
        title: 'API URL required',
        message: 'Add the chat completions URL under Provider.',
      })
      return
    }

    if (model.trim().length === 0) {
      pushToast({
        type: 'error',
        title: 'Model required',
        message: 'Enter a model name before generating a palette.',
      })
      return
    }

    setIsGenerating(true)

    try {
      const nextPalette = await generatePalette({
        provider: activeProvider,
        endpoint,
        apiKey,
        model,
        prompt: cleanPrompt,
      })

      setPalette(nextPalette)

      const extraTokens = Object.keys(nextPalette).length - BASE_TOKEN_COUNT
      pushToast({
        type: 'success',
        title: 'Palette ready',
        message:
          extraTokens > 0
            ? `8 base colors and ${extraTokens} additional ${
                extraTokens === 1 ? 'color' : 'colors'
              } generated.`
            : '8 colors generated. Edit any value in the panel or copy the CSS.',
      })
    } catch (error) {
      pushToast({
        type: 'error',
        title: 'Could not generate palette',
        message:
          error instanceof Error
            ? error.message
            : 'Something unexpected happened. Check the provider and try again.',
        duration: 7500,
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const handleCopyPalette = async (format) => {
    const text = format === 'tailwind' ? buildTailwindExport(palette) : buildCssExport(palette)

    try {
      await copyText(text)
      pushToast({
        type: 'success',
        title: format === 'tailwind' ? 'Tailwind config copied' : 'CSS variables copied',
        message: 'The palette is on your clipboard.',
        duration: 3200,
      })
    } catch {
      pushToast({
        type: 'error',
        title: 'Copy failed',
        message: 'The browser blocked clipboard access. Allow it and try again.',
        duration: 5000,
      })
    }
  }

  const handleCopyHex = async (slot) => {
    const color = normalizeHex(palette[slot.key])
    if (!color) return

    try {
      await copyText(color)
      pushToast({
        type: 'success',
        title: 'HEX copied',
        message: `${color} is on your clipboard.`,
        duration: 2500,
      })
    } catch {
      pushToast({
        type: 'error',
        title: 'Copy failed',
        message: 'The browser blocked clipboard access. Allow it and try again.',
        duration: 5000,
      })
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-canvas text-ink">
      <AppHeader />

      <main className="mx-auto grid w-full max-w-[1180px] flex-1 items-start gap-10 px-5 pb-16 pt-10 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(360px,420px)] lg:gap-12 lg:pt-12">
        <GeneratorPanel
          prompt={prompt}
          onPromptChange={setPrompt}
          onGenerate={handleGenerate}
          isGenerating={isGenerating}
          provider={activeProvider}
          onProviderChange={handleProviderChange}
          endpoint={endpoint}
          onEndpointChange={setEndpoint}
          apiKey={apiKey}
          onApiKeyChange={setApiKey}
          model={model}
          onModelChange={handleModelChange}
        />

        <PalettePanel
          palette={palette}
          slots={slots}
          isGenerating={isGenerating}
          onColorChange={handleColorChange}
          onReset={handleReset}
          onCopyPalette={handleCopyPalette}
          onCopyHex={handleCopyHex}
        />
      </main>

      <footer className="border-t border-line-soft">
        <div className="mx-auto flex max-w-[1180px] flex-col gap-2 px-5 py-5 text-xs text-ink-subtle sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>Hex2Maker · MIT License</p>
          <a
            href="https://github.com/mrnoxxxdevvii"
            target="_blank"
            rel="noreferrer"
            className="transition-colors hover:text-ink"
          >
            Built by Mr. Nox
          </a>
        </div>
      </footer>

      <ToastStack toasts={toasts} onDismiss={dismissToast} />
    </div>
  )
}
