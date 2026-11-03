import { PaletteError, parsePaletteResponse } from './palette'

export const DEFAULT_PROVIDER = 'ollama'

export const PROVIDERS = {
  ollama: {
    id: 'ollama',
    label: 'Ollama (local)',
    endpoint: 'http://127.0.0.1:11434/api/chat',
    defaultModel: 'llama3.2',
  },
  api: {
    id: 'api',
    label: 'API',
    defaultModel: '',
  },
}

export const SYSTEM_PROMPT = `You are Hex2Maker Engine, an elite AI color theory and UI/UX design tool.

YOUR SOLE TASK:
Analyze the user's website/application description and generate a highly harmonious, aesthetically pleasing, and WCAG contrast-compliant color palette.

STRICT OUTPUT RULES:
1. Output MUST be RAW JSON ONLY.
2. DO NOT include any Markdown formatting, wrappers, backticks (e.g. NEVER use \`\`\`json), or conversational intro/outro text.
3. Every color code MUST be a valid 6-character uppercase HEX code starting with '#' (e.g., "#1E293B").
4. Ensure text colors (text_main, text_muted, primary_text) have high contrast against their respective backgrounds (bg_main, bg_card, primary). Just do your best to make it look as good as possible in line with the description—ensure it’s aesthetically pleasing and that the colors go well together.

JSON STRUCTURE TO RETURN:
{
  "bg_main": "#HEX",
  "bg_card": "#HEX",
  "text_main": "#HEX",
  "text_muted": "#HEX",
  "primary": "#HEX",
  "primary_text": "#HEX",
  "accent": "#HEX",
  "border": "#HEX"
}
Or more—if you determine that the user has additional slots for colors, you may add them (if NECESSARY). Please list only the colors; do not add any sentences of your own or anything else.`

const REQUEST_TIMEOUT_MS = 60_000
const MODEL_PATTERN = /^[A-Za-z0-9._:/-]{1,80}$/
const LOCAL_HOSTNAMES = new Set(['localhost', '127.0.0.1', '::1', '[::1]'])

export class AiError extends Error {
  constructor(message) {
    super(message)
    this.name = 'AiError'
  }
}

function extractProviderDetail(data) {
  const rawDetail = data?.error?.message ?? data?.error ?? data?.message
  if (typeof rawDetail !== 'string') return ''

  return rawDetail.replace(/\s+/g, ' ').trim().slice(0, 160)
}

function sanitizeProviderDetail(detail, apiKey) {
  if (!detail) return ''

  const withoutSecret = apiKey && apiKey.length > 3 ? detail.split(apiKey).join('[redacted]') : detail
  return withoutSecret.slice(0, 160)
}

function httpErrorMessage(status, data, provider, apiKey) {
  let message

  if (status === 400) {
    message = 'The API rejected the request. Check the URL, model and request format.'
  } else if (status === 401 || status === 403) {
    message = 'The API key was rejected. Check the key and try again.'
  } else if (status === 404) {
    message =
      provider === 'ollama'
        ? 'The Ollama model was not found. Pull it locally and check the model name.'
        : 'The API endpoint or model was not found. Check the URL and model name.'
  } else if (status === 429) {
    message = 'The API rate limit was reached. Wait a moment and try again.'
  } else if (status >= 500) {
    message = 'The API is temporarily unavailable. Try again in a moment.'
  } else {
    message = `The request failed with status ${status}. Try again.`
  }

  if (status === 401 || status === 403) return message

  const detail = sanitizeProviderDetail(extractProviderDetail(data), apiKey)
  return detail ? `${message} ${detail}` : message
}

function resolveEndpoint(provider, rawEndpoint) {
  if (provider === 'ollama') return PROVIDERS.ollama.endpoint

  const raw = typeof rawEndpoint === 'string' ? rawEndpoint.trim() : ''

  if (raw.length === 0) {
    throw new AiError('Add the chat completions URL for your API.')
  }

  if (raw.length > 2048) {
    throw new AiError('The API URL is too long. Check it and try again.')
  }

  let url

  try {
    url = new URL(raw)
  } catch {
    throw new AiError('Enter a valid API URL, including https://.')
  }

  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    throw new AiError('The API URL must start with https://.')
  }

  if (url.username || url.password) {
    throw new AiError('Remove credentials from the URL and use the API key field instead.')
  }

  if (url.protocol === 'http:' && !LOCAL_HOSTNAMES.has(url.hostname.toLowerCase())) {
    throw new AiError('Remote API URLs must use HTTPS. Plain HTTP is only allowed for localhost.')
  }

  return url.toString()
}

function buildRequest({ provider, endpoint, apiKey, model, prompt }) {
  const userMessage = `WEBSITE / APPLICATION DESCRIPTION:\n"""\n${prompt.trim()}\n"""\n\nReturn only the raw JSON palette object.`
  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: userMessage },
  ]

  if (provider === 'ollama') {
    return {
      endpoint,
      headers: { 'Content-Type': 'application/json' },
      body: {
        model,
        messages,
        stream: false,
        options: { temperature: 0.7 },
      },
    }
  }

  const headers = { 'Content-Type': 'application/json' }

  if (apiKey) headers.Authorization = `Bearer ${apiKey}`

  return {
    endpoint,
    headers,
    body: {
      model,
      messages,
      temperature: 0.7,
      stream: false,
    },
  }
}

export async function generatePalette({ provider, endpoint, apiKey, model, prompt }) {
  if (!Object.hasOwn(PROVIDERS, provider)) {
    throw new AiError('Choose a supported provider.')
  }

  if (typeof prompt !== 'string' || prompt.trim().length < 8) {
    throw new AiError('Add a more detailed project description before generating.')
  }

  if (prompt.length > 4_000) {
    throw new AiError('The project description is too long. Shorten it and try again.')
  }

  const cleanModel = typeof model === 'string' ? model.trim() : ''

  if (!MODEL_PATTERN.test(cleanModel)) {
    throw new AiError('Enter a valid model name, for example llama3.2.')
  }

  const cleanKey = typeof apiKey === 'string' ? apiKey.trim() : ''

  if (cleanKey.length > 512) {
    throw new AiError('The API key looks too long. Check it and try again.')
  }

  const resolvedEndpoint = resolveEndpoint(provider, endpoint)
  const { endpoint: requestUrl, headers, body } = buildRequest({
    provider,
    endpoint: resolvedEndpoint,
    apiKey: cleanKey,
    model: cleanModel,
    prompt,
  })
  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  try {
    const response = await fetch(requestUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: controller.signal,
    })

    const responseText = await response.text()
    let data = null

    try {
      data = JSON.parse(responseText)
    } catch {
      data = null
    }

    if (!response.ok) {
      throw new AiError(httpErrorMessage(response.status, data, provider, cleanKey))
    }

    const content =
      provider === 'ollama' ? data?.message?.content : data?.choices?.[0]?.message?.content

    if (typeof content !== 'string' || content.trim().length === 0) {
      throw new AiError('The API returned an empty response. Try again.')
    }

    return parsePaletteResponse(content)
  } catch (error) {
    if (error instanceof AiError || error instanceof PaletteError) throw error

    if (error?.name === 'AbortError') {
      throw new AiError('The request timed out. Check the provider and try again.')
    }

    if (provider === 'ollama') {
      throw new AiError(
        'Could not reach Ollama at 127.0.0.1:11434. Make sure it is running and that OLLAMA_ORIGINS allows this app.',
      )
    }

    throw new AiError('Could not reach the API endpoint. Check the URL, CORS settings and your connection.')
  } finally {
    window.clearTimeout(timeout)
  }
}
