export const HEX_PATTERN = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/

export const MAX_EXTRA_SLOTS = 4

export const BASE_SLOT_DEFINITIONS = [
  { key: 'bg_main', label: 'Background', description: 'Page background' },
  { key: 'bg_card', label: 'Surface', description: 'Panels and cards' },
  { key: 'text_main', label: 'Text', description: 'Primary text' },
  { key: 'text_muted', label: 'Muted text', description: 'Secondary text' },
  { key: 'primary', label: 'Primary', description: 'Main actions' },
  { key: 'primary_text', label: 'Primary text', description: 'Text on primary' },
  { key: 'accent', label: 'Accent', description: 'Links and highlights' },
  { key: 'border', label: 'Border', description: 'Dividers and outlines' },
]

export const DEFAULT_PALETTE = {
  bg_main: '#1E2530',
  bg_card: '#262F3B',
  text_main: '#E6EDF3',
  text_muted: '#9DA7B5',
  primary: '#F0F6FC',
  primary_text: '#0D1117',
  accent: '#58A6FF',
  border: '#3A4452',
}

const BASE_KEYS = new Set(BASE_SLOT_DEFINITIONS.map((slot) => slot.key))
const RESERVED_KEYS = new Set(['__proto__', 'prototype', 'constructor'])
const KEY_PATTERN = /^[a-z][a-z0-9]*(?:_[a-z0-9]+)*$/
const WORD_LABELS = {
  bg: 'Background',
  text: 'Text',
  primary: 'Primary',
  accent: 'Accent',
  border: 'Border',
  muted: 'Muted',
  card: 'Card',
  main: 'Main',
  surface: 'Surface',
  elevated: 'Elevated',
  subtle: 'Subtle',
  hover: 'Hover',
  success: 'Success',
  warning: 'Warning',
  danger: 'Danger',
  info: 'Info',
}

export class PaletteError extends Error {
  constructor(message) {
    super(message)
    this.name = 'PaletteError'
  }
}

export function normalizeHex(value) {
  if (typeof value !== 'string') return null

  const trimmed = value.trim()
  if (!HEX_PATTERN.test(trimmed)) return null

  const hex = trimmed.slice(1).toUpperCase()
  const expanded = hex.length === 3 ? hex.replace(/./g, (character) => character + character) : hex
  return `#${expanded}`
}

export function isSafeSlotKey(key) {
  return (
    typeof key === 'string' &&
    key.length > 0 &&
    key.length <= 32 &&
    KEY_PATTERN.test(key) &&
    !RESERVED_KEYS.has(key)
  )
}

export function cssVarName(key) {
  return `--color-${key.replaceAll('_', '-')}`
}

export function humanizeSlotKey(key) {
  return key
    .split('_')
    .filter(Boolean)
    .map((word) => WORD_LABELS[word] ?? `${word.charAt(0).toUpperCase()}${word.slice(1)}`)
    .join(' ')
}

export function getPaletteSlots(palette) {
  const baseSlots = BASE_SLOT_DEFINITIONS.filter((slot) => normalizeHex(palette?.[slot.key])).map(
    (slot) => ({ ...slot, cssVar: cssVarName(slot.key), isExtra: false }),
  )

  const extraSlots = Object.keys(palette ?? {})
    .filter((key) => !BASE_KEYS.has(key) && isSafeSlotKey(key) && normalizeHex(palette[key]))
    .map((key) => ({
      key,
      label: humanizeSlotKey(key),
      description: 'Additional token',
      cssVar: cssVarName(key),
      isExtra: true,
    }))

  return [...baseSlots, ...extraSlots]
}

export function parsePaletteResponse(raw) {
  if (typeof raw !== 'string' || raw.length === 0) {
    throw new PaletteError('The provider returned an empty response. Try again.')
  }

  const cleaned = raw
    .replace(/```(?:json)?/gi, '')
    .replace(/```/g, '')
    .trim()

  const start = cleaned.indexOf('{')
  const end = cleaned.lastIndexOf('}')

  if (start === -1 || end === -1 || end <= start) {
    throw new PaletteError('The response did not contain a JSON palette. Try again.')
  }

  let parsed

  try {
    parsed = JSON.parse(cleaned.slice(start, end + 1))
  } catch {
    throw new PaletteError('The response was not valid JSON. Try generating again.')
  }

  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new PaletteError('The response did not contain a palette object. Try again.')
  }

  const palette = {}

  for (const slot of BASE_SLOT_DEFINITIONS) {
    const color = normalizeHex(parsed[slot.key])

    if (!color) {
      throw new PaletteError(
        `The response is missing a valid color for “${slot.key}”. Try generating again.`,
      )
    }

    palette[slot.key] = color
  }

  let extraCount = 0

  for (const [rawKey, rawValue] of Object.entries(parsed)) {
    if (extraCount >= MAX_EXTRA_SLOTS) break

    const key = rawKey.trim().toLowerCase()
    if (BASE_KEYS.has(key) || !isSafeSlotKey(key) || Object.hasOwn(palette, key)) continue

    const color = normalizeHex(rawValue)
    if (!color) continue

    palette[key] = color
    extraCount += 1
  }

  return palette
}

function hexToRgb(hex) {
  const normalized = normalizeHex(hex)
  if (!normalized) return null

  return [
    Number.parseInt(normalized.slice(1, 3), 16),
    Number.parseInt(normalized.slice(3, 5), 16),
    Number.parseInt(normalized.slice(5, 7), 16),
  ]
}

function linearizeChannel(channel) {
  const value = channel / 255
  return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
}

function relativeLuminance(hex) {
  const rgb = hexToRgb(hex)
  if (!rgb) return null

  const [red, green, blue] = rgb.map(linearizeChannel)
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue
}

export function getContrastRatio(foreground, background) {
  const first = relativeLuminance(foreground)
  const second = relativeLuminance(background)

  if (first === null || second === null) return null

  const lighter = Math.max(first, second)
  const darker = Math.min(first, second)
  return (lighter + 0.05) / (darker + 0.05)
}

export const CONTRAST_PAIRS = [
  { label: 'Text / background', foreground: 'text_main', background: 'bg_main' },
  { label: 'Text / surface', foreground: 'text_main', background: 'bg_card' },
  { label: 'Muted / surface', foreground: 'text_muted', background: 'bg_card' },
  { label: 'Primary text / primary', foreground: 'primary_text', background: 'primary' },
]

export function getContrastReport(palette) {
  return CONTRAST_PAIRS.map((pair) => {
    const ratio = getContrastRatio(palette[pair.foreground], palette[pair.background])
    let grade = 'Fail'

    if (ratio !== null) {
      if (ratio >= 7) grade = 'AAA'
      else if (ratio >= 4.5) grade = 'AA'
      else if (ratio >= 3) grade = 'AA Large'
    }

    return { ...pair, ratio, grade }
  })
}

export function buildCssExport(palette) {
  const lines = getPaletteSlots(palette).map(
    (slot) => `  ${slot.cssVar}: ${normalizeHex(palette[slot.key])};`,
  )

  return `:root {\n${lines.join('\n')}\n}\n`
}

export function buildTailwindExport(palette) {
  const entries = getPaletteSlots(palette).map(
    (slot) => `        '${slot.key.replaceAll('_', '-')}': '${normalizeHex(palette[slot.key])}',`,
  )

  return `/** @type {import('tailwindcss').Config} */\nexport default {\n  theme: {\n    extend: {\n      colors: {\n${entries.join('\n')}\n      },\n    },\n  },\n};\n`
}
