// src/store/themeStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ColorAccent = 'green' | 'blue' | 'purple' | 'orange' | 'red'
export type AppMode = 'light' | 'dark'
export type FontSize = 'small' | 'medium' | 'large'
export type Density = 'compact' | 'normal' | 'comfortable'
export type NavbarStyle = 'gradient' | 'flat' | 'glass'

export const ACCENT_COLORS: Record<ColorAccent, { primary: string; light: string; name: string }> = {
  green:  { primary: '#0d6b29', light: '#f0faf4', name: 'Vert'    },
  blue:   { primary: '#1a56db', light: '#eff6ff', name: 'Bleu'    },
  purple: { primary: '#7934f3', light: '#f5eeff', name: 'Violet'  },
  orange: { primary: '#d97706', light: '#fffbeb', name: 'Orange'  },
  red:    { primary: '#dc2626', light: '#fef2f2', name: 'Rouge'   },
}

interface ThemeState {
  // Existant
  headerTheme: string
  sidebarTheme: string
  dropdownIcon: string
  listIcon: string
  // Nouveau
  appMode: AppMode
  accentColor: ColorAccent
  fontSize: FontSize
  density: Density
  navbarStyle: NavbarStyle
  compactSidebar: boolean
  animationsEnabled: boolean
  // Actions
  setHeaderTheme: (v: string) => void
  setSidebarTheme: (v: string) => void
  setDropdownIcon: (v: string) => void
  setListIcon: (v: string) => void
  setAppMode: (v: AppMode) => void
  setAccentColor: (v: ColorAccent) => void
  setFontSize: (v: FontSize) => void
  setDensity: (v: Density) => void
  setNavbarStyle: (v: NavbarStyle) => void
  setCompactSidebar: (v: boolean) => void
  setAnimationsEnabled: (v: boolean) => void
  reset: () => void
}

const defaults = {
  headerTheme: 'header-white',
  sidebarTheme: 'sidebar-dark',
  dropdownIcon: 'icon-style-1',
  listIcon: 'icon-list-style-1',
  appMode: 'light' as AppMode,
  accentColor: 'green' as ColorAccent,
  fontSize: 'medium' as FontSize,
  density: 'normal' as Density,
  navbarStyle: 'gradient' as NavbarStyle,
  compactSidebar: false,
  animationsEnabled: true,
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      ...defaults,
      setHeaderTheme:      (v) => set({ headerTheme: v }),
      setSidebarTheme:     (v) => set({ sidebarTheme: v }),
      setDropdownIcon:     (v) => set({ dropdownIcon: v }),
      setListIcon:         (v) => set({ listIcon: v }),
      setAppMode:          (v) => set({ appMode: v }),
      setAccentColor:      (v) => set({ accentColor: v }),
      setFontSize:         (v) => set({ fontSize: v }),
      setDensity:          (v) => set({ density: v }),
      setNavbarStyle:      (v) => set({ navbarStyle: v }),
      setCompactSidebar:   (v) => set({ compactSidebar: v }),
      setAnimationsEnabled:(v) => set({ animationsEnabled: v }),
      reset: () => set(defaults),
    }),
    { name: 'theme-preferences' }
  )
)