// src/utils/themeUtils.ts
import { useThemeStore } from '../store/themeStore'
import { injectThemeStyles } from './themeInjector'

const HEADER_GROUP = ['header-white', 'header-dark']
const SIDEBAR_GROUP = ['sidebar-light', 'sidebar-dark']

export const applyThemeToBody = (header: string, sidebar: string) => {
  document.body.classList.remove(...HEADER_GROUP, ...SIDEBAR_GROUP)
  document.body.classList.add(header, sidebar)
}

export const applyFullTheme = (
  mode: Parameters<typeof injectThemeStyles>[0],
  accent: Parameters<typeof injectThemeStyles>[1],
  fontSize: Parameters<typeof injectThemeStyles>[2],
  density: Parameters<typeof injectThemeStyles>[3],
  animations: boolean,
) => {
  injectThemeStyles(mode, accent, fontSize, density, animations)
}

export const initThemePreferences = () => {
  const s = useThemeStore.getState()
  applyThemeToBody(s.headerTheme, s.sidebarTheme)
  injectThemeStyles(s.appMode, s.accentColor, s.fontSize, s.density, s.animationsEnabled)
}