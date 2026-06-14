export const ICON_OPTIONS = [
  { key: 'Building', label: 'Edificio', glyph: '🏢' },
  { key: 'School', label: 'Escuela', glyph: '🏫' },
  { key: 'Tools', label: 'Herramientas', glyph: '🛠️' },
  { key: 'Coffee', label: 'Cafetería', glyph: '☕' },
  { key: 'Parking', label: 'Parqueo', glyph: '🅿️' },
  { key: 'Pool', label: 'Piscina', glyph: '🏊' },
  { key: 'Sports', label: 'Deporte', glyph: '⚽' },
  { key: 'Tree', label: 'Zona verde', glyph: '🌳' },
  { key: 'Road', label: 'Camino', glyph: '🛣️' },
  { key: 'Gate', label: 'Puerta', glyph: '🚪' },
  { key: 'Bus', label: 'Bus', glyph: '🚌' },
  { key: 'Pin', label: 'Pin', glyph: '📍' },
  { key: 'Eye', label: 'Vista', glyph: '👁️' },
  { key: 'Layers', label: 'Capas', glyph: '🗂️' },
  { key: 'Route', label: 'Ruta', glyph: '🧭' },
  { key: 'Goto', label: 'Ir a', glyph: '➡️' },
  { key: 'Share', label: 'Compartir', glyph: '🔗' },
  { key: 'Clock', label: 'Horario', glyph: '🕒' },
  { key: 'Phone', label: 'Teléfono', glyph: '☎️' },
  { key: 'Warn', label: 'Aviso', glyph: '⚠️' },
  { key: 'Reset', label: 'Reiniciar', glyph: '↺' },
  { key: 'Plus', label: 'Más', glyph: '＋' },
  { key: 'Minus', label: 'Menos', glyph: '−' },
  { key: 'Search', label: 'Buscar', glyph: '🔎' },
  { key: 'Menu', label: 'Menú', glyph: '☰' },
  { key: 'User', label: 'Usuario', glyph: '👤' },
  { key: 'Lock', label: 'Bloqueo', glyph: '🔒' },
  { key: 'Arrow', label: 'Flecha', glyph: '➜' },
  { key: 'Chevron', label: 'Desplegar', glyph: '⌄' },
  { key: 'Sun', label: 'Sol', glyph: '☀️' },
  { key: 'Moon', label: 'Luna', glyph: '🌙' },
]

export const ICON_KEY_TO_GLYPH = Object.fromEntries(
  ICON_OPTIONS.map(option => [option.key, option.glyph])
)

export function getIconGlyphByKey(iconKey) {
  return ICON_KEY_TO_GLYPH[iconKey] || '📍'
}
