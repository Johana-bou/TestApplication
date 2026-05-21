// src/utils/themeInjector.ts
// Injecte un <style> dynamique qui écrase les classes AdminKit/Bootstrap

import { ACCENT_COLORS, type ColorAccent, type AppMode, type Density, type FontSize } from '../store/themeStore'

const STYLE_ID = 'dynamic-theme-style'

export function injectThemeStyles(
  mode: AppMode,
  accent: ColorAccent,
  fontSize: FontSize,
  density: Density,
  animations: boolean,
) {
  const color = ACCENT_COLORS[accent]
  const isDark = mode === 'dark'

  // Tailles de police
  const fontSizeMap = { small: '13px', medium: '14px', large: '16px' }
  const fs = fontSizeMap[fontSize]

  // Densité → padding des cards et tableaux
  const padMap = { compact: '12px', normal: '20px', comfortable: '28px' }
  const pad = padMap[density]

  // Durée des transitions
  const dur = animations ? '0.2s' : '0s'

  // Palette sombre
  const dark = {
    bgMain:   '#0f1117',
    bgCard:   '#1a1d27',
    bgInput:  '#22263a',
    textMain: '#e8eaf0',
    textMuted:'#8b92a9',
    border:   '#2e3347',
    bgHover:  '#22263a',
    bgTable:  '#1e2130',
    bgTableTh:'#161926',
  }

  const css = `
    /* ── Variables globales ── */
    :root {
      --accent:        ${color.primary};
      --accent-light:  ${color.light};
      --font-base:     ${fs};
      --pad-card:      ${pad};
      --transition:    ${dur};
    }

    /* ── Base ── */
    body {
      font-size: ${fs} !important;
      background-color: ${isDark ? dark.bgMain : '#f2f4f9'} !important;
      color: ${isDark ? dark.textMain : '#353535'} !important;
      transition: background-color ${dur}, color ${dur};
    }

    /* ── Cards ── */
    .card-box {
      background-color: ${isDark ? dark.bgCard : '#ffffff'} !important;
      border: 1px solid ${isDark ? dark.border : 'transparent'} !important;
      box-shadow: ${isDark ? '0 2px 12px rgba(0,0,0,0.3)' : '0 2px 10px rgba(0,0,0,0.06)'} !important;
      padding: ${pad} !important;
      transition: background-color ${dur}, border-color ${dur};
    }

    /* ── Textes ── */
    .card-box h1, .card-box h2, .card-box h3,
    .card-box h4, .card-box h5, .card-box h6,
    .card-box p, .card-box span, .card-box label,
    .card-box .weight-600, .card-box .font-14 {
      color: ${isDark ? dark.textMain : 'inherit'} !important;
    }
    .text-muted, .font-weight-400 {
      color: ${isDark ? dark.textMuted : '#888'} !important;
    }
    .text-blue {
      color: ${color.primary} !important;
    }

    /* ── Navbar ── */
    nav {
      background: ${color.primary} !important;
      background: linear-gradient(135deg, ${color.primary}ee 0%, ${color.primary} 100%) !important;
    }

    /* ── Boutons primaires ── */
    .btn-primary {
      background-color: ${color.primary} !important;
      border-color: ${color.primary} !important;
      transition: all ${dur} !important;
    }
    .btn-primary:hover {
      background-color: ${color.primary}cc !important;
      border-color: ${color.primary}cc !important;
    }
    .btn-outline-primary {
      color: ${color.primary} !important;
      border-color: ${color.primary} !important;
    }
    .btn-outline-primary:hover,
    .btn-outline-primary.active {
      background-color: ${color.primary} !important;
      border-color: ${color.primary} !important;
      color: #fff !important;
    }

    /* ── Formulaires ── */
    .form-control {
      background-color: ${isDark ? dark.bgInput : '#fff'} !important;
      border-color: ${isDark ? dark.border : '#ced4da'} !important;
      color: ${isDark ? dark.textMain : '#353535'} !important;
      font-size: ${fs} !important;
      transition: border-color ${dur}, background-color ${dur};
    }
    .form-control:focus {
      border-color: ${color.primary} !important;
      box-shadow: 0 0 0 0.2rem ${color.primary}30 !important;
    }
    .form-control::placeholder {
      color: ${isDark ? dark.textMuted : '#aaa'} !important;
    }
    select.form-control option {
      background-color: ${isDark ? dark.bgInput : '#fff'} !important;
      color: ${isDark ? dark.textMain : '#353535'} !important;
    }
    label {
      color: ${isDark ? dark.textMain : '#555'} !important;
      font-size: ${fs} !important;
    }
    .input-group-text {
      background-color: ${isDark ? dark.bgInput : '#f8f9fa'} !important;
      border-color: ${isDark ? dark.border : '#ced4da'} !important;
      color: ${isDark ? dark.textMuted : '#555'} !important;
    }

    /* ── Tableaux ── */
    .table {
      color: ${isDark ? dark.textMain : '#353535'} !important;
      font-size: ${fs} !important;
    }
    .table th {
      background-color: ${isDark ? dark.bgTableTh : '#f8f9fa'} !important;
      color: ${isDark ? dark.textMuted : '#555'} !important;
      border-color: ${isDark ? dark.border : '#dee2e6'} !important;
      font-size: calc(${fs} - 1px) !important;
      padding: ${density === 'compact' ? '8px' : density === 'comfortable' ? '14px' : '10px'} !important;
    }
    .table td {
      background-color: ${isDark ? dark.bgTable : 'transparent'} !important;
      border-color: ${isDark ? dark.border : '#dee2e6'} !important;
      padding: ${density === 'compact' ? '8px' : density === 'comfortable' ? '14px' : '10px'} !important;
    }
    .table-hover tbody tr:hover td {
      background-color: ${isDark ? dark.bgHover : color.light} !important;
    }
    .table-striped tbody tr:nth-of-type(odd) td {
      background-color: ${isDark ? '#1e2130' : '#fafafa'} !important;
    }

    /* ── Badges ── */
    .badge-primary { background-color: ${color.primary} !important; }
    .badge-success { background-color: #28a745 !important; }

    /* ── Liens actifs sidebar/nav ── */
    .active > a, a.active {
      color: ${color.primary} !important;
    }

    /* ── Modals ── */
    .modal-content {
      background-color: ${isDark ? dark.bgCard : '#fff'} !important;
      border-color: ${isDark ? dark.border : '#dee2e6'} !important;
      color: ${isDark ? dark.textMain : '#353535'} !important;
    }
    .modal-header {
      border-color: ${isDark ? dark.border : '#dee2e6'} !important;
      background-color: ${isDark ? dark.bgTableTh : '#f8f9fa'} !important;
    }
    .modal-footer {
      border-color: ${isDark ? dark.border : '#dee2e6'} !important;
    }

    /* ── Dropdowns Bootstrap ── */
    .dropdown-menu {
      background-color: ${isDark ? dark.bgCard : '#fff'} !important;
      border-color: ${isDark ? dark.border : '#f0f0f0'} !important;
    }
    .dropdown-item {
      color: ${isDark ? dark.textMain : '#353535'} !important;
      font-size: ${fs} !important;
    }
    .dropdown-item:hover {
      background-color: ${isDark ? dark.bgHover : color.light} !important;
      color: ${color.primary} !important;
    }

    /* ── Alertes ── */
    .alert-info    { border-color: ${color.primary}50 !important; background: ${color.light} !important; color: ${color.primary} !important; }
    .alert-success { border-color: #28a74550 !important; }

    /* ── Pagination ── */
    .page-link {
      color: ${color.primary} !important;
      background-color: ${isDark ? dark.bgCard : '#fff'} !important;
      border-color: ${isDark ? dark.border : '#dee2e6'} !important;
    }
    .page-item.active .page-link {
      background-color: ${color.primary} !important;
      border-color: ${color.primary} !important;
      color: #fff !important;
    }

    /* ── Scrollbar (mode sombre) ── */
    ${isDark ? `
    ::-webkit-scrollbar { width: 6px; height: 6px; }
    ::-webkit-scrollbar-track { background: ${dark.bgMain}; }
    ::-webkit-scrollbar-thumb { background: ${dark.border}; border-radius: 3px; }
    ::-webkit-scrollbar-thumb:hover { background: #444; }
    ` : ''}

    /* ── Transitions globales ── */
    .card-box, .form-control, .btn, .table td, .table th,
    .modal-content, .dropdown-menu {
      transition: background-color ${dur}, color ${dur}, border-color ${dur} !important;
    }
  `

  // Injecter ou remplacer le style
  let styleEl = document.getElementById(STYLE_ID) as HTMLStyleElement | null
  if (!styleEl) {
    styleEl = document.createElement('style')
    styleEl.id = STYLE_ID
    document.head.appendChild(styleEl)
  }
  styleEl.textContent = css
}