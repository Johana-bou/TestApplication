// src/components/layout/RightSidebar.tsx
import { useState } from 'react'
import { useThemeStore, ACCENT_COLORS, type ColorAccent, type AppMode, type FontSize, type Density, type NavbarStyle } from '../../store/themeStore'
import { useUIStore } from '../../store/uiStore'
import { applyThemeToBody, applyFullTheme } from '../../utils/themeUtils'

type Tab = 'apparence' | 'accessibilite' | 'affichage'

// ─── Composants UI internes ───────────────────────────────────────────────────

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.2, color: '#aaa',
      textTransform: 'uppercase', marginBottom: 10, marginTop: 4 }}>
      {children}
    </div>
  )
}

function OptionCard({ label, desc, selected, onClick, icon }: {
  label: string; desc?: string; selected: boolean; onClick: () => void; icon?: string
}) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1, border: `2px solid ${selected ? '#0d6b29' : '#e5e7eb'}`,
        borderRadius: 10, padding: '10px 8px', background: selected ? '#f0faf4' : '#fafafa',
        cursor: 'pointer', transition: 'all .15s', display: 'flex',
        flexDirection: 'column', alignItems: 'center', gap: 6, minWidth: 0,
      }}
    >
      {icon && <i className={icon} style={{ fontSize: 18, color: selected ? '#0d6b29' : '#888' }} />}
      <div style={{ fontSize: 12, fontWeight: selected ? 700 : 500, color: selected ? '#0d6b29' : '#555' }}>
        {label}
      </div>
      {desc && <div style={{ fontSize: 10, color: '#aaa', textAlign: 'center' }}>{desc}</div>}
      {selected && (
        <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#0d6b29',
          display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <i className="dw dw-check" style={{ color: '#fff', fontSize: 10 }} />
        </div>
      )}
    </button>
  )
}

function Toggle({ checked, onChange, label, desc }: {
  checked: boolean; onChange: (v: boolean) => void; label: string; desc?: string
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '10px 0', borderBottom: '1px solid #f5f5f5' }}>
      <div>
        <div style={{ fontSize: 13, fontWeight: 500, color: '#353535' }}>{label}</div>
        {desc && <div style={{ fontSize: 11, color: '#aaa', marginTop: 2 }}>{desc}</div>}
      </div>
      <button
        onClick={() => onChange(!checked)}
        style={{
          width: 44, height: 24, borderRadius: 12, border: 'none',
          background: checked ? '#0d6b29' : '#d1d5db',
          position: 'relative', cursor: 'pointer', transition: 'background 0.2s',
          flexShrink: 0, marginLeft: 12,
        }}
      >
        <div style={{
          position: 'absolute', top: 3,
          left: checked ? 23 : 3,
          width: 18, height: 18, borderRadius: '50%', background: '#fff',
          boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
          transition: 'left 0.2s',
        }} />
      </button>
    </div>
  )
}

function SliderOption({ label, value, min, max, step, format, onChange }: {
  label: string; value: number; min: number; max: number
  step: number; format: (v: number) => string; onChange: (v: number) => void
}) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: 12, fontWeight: 500, color: '#555' }}>{label}</span>
        <span style={{ fontSize: 12, fontWeight: 700, color: '#0d6b29' }}>{format(value)}</span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{ width: '100%', accentColor: '#0d6b29' }}
      />
    </div>
  )
}

// ─── Composant principal ─────────────────────────────────────────────────────

export default function RightSidebar() {
  const {
    appMode, accentColor, fontSize, density, navbarStyle, animationsEnabled,
    setAppMode, setAccentColor, setFontSize, setDensity, setNavbarStyle, setAnimationsEnabled,
    reset,
  } = useThemeStore()

  const { rightSidebarOpen, closeRightSidebar } = useUIStore()
  const [activeTab, setActiveTab] = useState<Tab>('apparence')

  const apply = (overrides: Partial<{
    mode: AppMode; accent: ColorAccent; fs: FontSize; den: Density; anim: boolean
  }> = {}) => {
    applyFullTheme(
      overrides.mode   ?? appMode,
      overrides.accent ?? accentColor,
      overrides.fs     ?? fontSize,
      overrides.den    ?? density,
      overrides.anim   ?? animationsEnabled,
    )
  }

  const handleMode = (v: AppMode) => { setAppMode(v); apply({ mode: v }) }
  const handleAccent = (v: ColorAccent) => { setAccentColor(v); apply({ accent: v }) }
  const handleFontSize = (v: FontSize) => { setFontSize(v); apply({ fs: v }) }
  const handleDensity = (v: Density) => { setDensity(v); apply({ den: v }) }
  const handleAnimations = (v: boolean) => { setAnimationsEnabled(v); apply({ anim: v }) }
  const handleNavbarStyle = (v: NavbarStyle) => setNavbarStyle(v)

  const handleReset = () => {
    reset()
    applyThemeToBody('header-white', 'sidebar-dark')
    applyFullTheme('light', 'green', 'medium', 'normal', true)
  }

  if (!rightSidebarOpen) return null

  const tabs: { key: Tab; label: string; icon: string }[] = [
    { key: 'apparence',     label: 'Apparence',      icon: 'dw dw-paint-brush' },
    { key: 'affichage',     label: 'Affichage',       icon: 'dw dw-eye'         },
    { key: 'accessibilite', label: 'Accessibilité',   icon: 'dw dw-user1'       },
  ]

  return (
    <>
      {/* Overlay */}
      <div onClick={closeRightSidebar} style={{
        position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)',
        zIndex: 1040, backdropFilter: 'blur(2px)',
      }} />

      {/* Panel */}
      <div style={{
        position: 'fixed', right: 0, top: 0, width: 360, height: '100%',
        background: '#fff', boxShadow: '-4px 0 24px rgba(0,0,0,0.14)',
        zIndex: 1050, display: 'flex', flexDirection: 'column',
      }}>

        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #0d6b29, #106938)',
          padding: '18px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ color: '#fff', fontWeight: 700, fontSize: 15 }}>
              <i className="dw dw-settings2" style={{ marginRight: 8 }} />
              Paramètres
            </div>
            <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: 11, marginTop: 2 }}>
              Personnalisez votre interface
            </div>
          </div>
          <button onClick={closeRightSidebar} style={{
            background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff',
            width: 32, height: 32, borderRadius: 6, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
          }}>✕</button>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex', borderBottom: '1px solid #f0f0f0',
          background: '#fafafa',
        }}>
          {tabs.map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key)} style={{
              flex: 1, border: 'none', background: 'transparent',
              padding: '12px 4px', cursor: 'pointer', fontSize: 11, fontWeight: 600,
              color: activeTab === t.key ? '#0d6b29' : '#888',
              borderBottom: `2px solid ${activeTab === t.key ? '#0d6b29' : 'transparent'}`,
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
              transition: 'all 0.15s',
            }}>
              <i className={t.icon} style={{ fontSize: 16 }} />
              {t.label}
            </button>
          ))}
        </div>

        {/* Contenu scrollable */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>

          {/* ── APPARENCE ── */}
          {activeTab === 'apparence' && (
            <div>
              <SectionTitle>Mode d'affichage</SectionTitle>
              <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
                <OptionCard label="Clair" icon="dw dw-sun"
                  desc="Fond blanc" selected={appMode === 'light'} onClick={() => handleMode('light')} />
                <OptionCard label="Sombre" icon="dw dw-moon"
                  desc="Fond noir" selected={appMode === 'dark'} onClick={() => handleMode('dark')} />
              </div>

              <SectionTitle>Couleur d'accent</SectionTitle>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20 }}>
                {(Object.entries(ACCENT_COLORS) as [ColorAccent, typeof ACCENT_COLORS[ColorAccent]][]).map(([key, val]) => (
                  <button
                    key={key}
                    onClick={() => handleAccent(key)}
                    title={val.name}
                    style={{
                      width: 36, height: 36, borderRadius: '50%',
                      background: val.primary, border: accentColor === key
                        ? `3px solid ${val.primary}` : '3px solid transparent',
                      outline: accentColor === key ? `2px solid ${val.primary}` : '2px solid transparent',
                      outlineOffset: 2,
                      cursor: 'pointer', transition: 'all 0.15s',
                      boxShadow: accentColor === key ? `0 0 0 4px ${val.light}` : 'none',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    {accentColor === key && <i className="dw dw-check" style={{ color: '#fff', fontSize: 14 }} />}
                  </button>
                ))}
              </div>
              <div style={{ fontSize: 11, color: '#aaa', marginBottom: 20 }}>
                Couleur sélectionnée : <strong style={{ color: ACCENT_COLORS[accentColor].primary }}>
                  {ACCENT_COLORS[accentColor].name}
                </strong>
              </div>

              <SectionTitle>Style de la navbar</SectionTitle>
              <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
                <OptionCard label="Dégradé" selected={navbarStyle === 'gradient'} onClick={() => handleNavbarStyle('gradient')} />
                <OptionCard label="Plat" selected={navbarStyle === 'flat'} onClick={() => handleNavbarStyle('flat')} />
                <OptionCard label="Verre" selected={navbarStyle === 'glass'} onClick={() => handleNavbarStyle('glass')} />
              </div>
            </div>
          )}

          {/* ── AFFICHAGE ── */}
          {activeTab === 'affichage' && (
            <div>
              <SectionTitle>Taille de police</SectionTitle>
              <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
                <OptionCard label="Petite" desc="13px" selected={fontSize === 'small'} onClick={() => handleFontSize('small')} />
                <OptionCard label="Normale" desc="14px" selected={fontSize === 'medium'} onClick={() => handleFontSize('medium')} />
                <OptionCard label="Grande" desc="16px" selected={fontSize === 'large'} onClick={() => handleFontSize('large')} />
              </div>

              <SectionTitle>Densité d'affichage</SectionTitle>
              <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
                <OptionCard label="Compact" desc="Serré" selected={density === 'compact'} onClick={() => handleDensity('compact')} />
                <OptionCard label="Normal" desc="Standard" selected={density === 'normal'} onClick={() => handleDensity('normal')} />
                <OptionCard label="Aéré" desc="Espacé" selected={density === 'comfortable'} onClick={() => handleDensity('comfortable')} />
              </div>

              <SectionTitle>Options</SectionTitle>
              <Toggle
                label="Animations"
                desc="Transitions et effets visuels"
                checked={animationsEnabled}
                onChange={handleAnimations}
              />
            </div>
          )}

          {/* ── ACCESSIBILITÉ ── */}
          {activeTab === 'accessibilite' && (
            <div>
              <SectionTitle>Aperçu des couleurs</SectionTitle>
              <div style={{ borderRadius: 10, overflow: 'hidden', marginBottom: 20, border: '1px solid #f0f0f0' }}>
                <div style={{ background: ACCENT_COLORS[accentColor].primary, padding: '14px 16px' }}>
                  <div style={{ color: '#fff', fontWeight: 700, fontSize: 13 }}>Couleur principale</div>
                  <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11 }}>{ACCENT_COLORS[accentColor].primary}</div>
                </div>
                <div style={{ background: ACCENT_COLORS[accentColor].light, padding: '14px 16px' }}>
                  <div style={{ color: ACCENT_COLORS[accentColor].primary, fontWeight: 700, fontSize: 13 }}>Couleur claire</div>
                  <div style={{ color: '#aaa', fontSize: 11 }}>{ACCENT_COLORS[accentColor].light}</div>
                </div>
                <div style={{ padding: '14px 16px', background: '#fff' }}>
                  <div style={{ fontSize: 12, color: '#555', marginBottom: 8 }}>Aperçu bouton</div>
                  <button style={{
                    background: ACCENT_COLORS[accentColor].primary, color: '#fff',
                    border: 'none', borderRadius: 6, padding: '7px 16px', fontSize: 12,
                    fontWeight: 600, cursor: 'default',
                  }}>Action principale</button>
                  &nbsp;
                  <button style={{
                    background: ACCENT_COLORS[accentColor].light,
                    color: ACCENT_COLORS[accentColor].primary,
                    border: `1px solid ${ACCENT_COLORS[accentColor].primary}`,
                    borderRadius: 6, padding: '7px 16px', fontSize: 12,
                    fontWeight: 600, cursor: 'default',
                  }}>Secondaire</button>
                </div>
              </div>

              <SectionTitle>Mode d'affichage actuel</SectionTitle>
              <div style={{
                background: appMode === 'dark' ? '#1a1d27' : '#f8f9fa',
                borderRadius: 10, padding: '16px', marginBottom: 20,
                border: '1px solid #f0f0f0',
              }}>
                <div style={{ color: appMode === 'dark' ? '#e8eaf0' : '#353535', fontSize: 13, fontWeight: 600 }}>
                  Mode {appMode === 'dark' ? 'sombre 🌙' : 'clair ☀️'}
                </div>
                <div style={{ color: appMode === 'dark' ? '#8b92a9' : '#888', fontSize: 11, marginTop: 4 }}>
                  Taille : {fontSize === 'small' ? 'Petite' : fontSize === 'medium' ? 'Normale' : 'Grande'} •
                  Densité : {density === 'compact' ? 'Compacte' : density === 'normal' ? 'Normale' : 'Confortable'}
                </div>
              </div>

              <SectionTitle>Informations</SectionTitle>
              <div style={{ fontSize: 11, color: '#aaa', lineHeight: 1.6 }}>
                Les paramètres sont sauvegardés automatiquement et persistés entre les sessions.
                La couleur d'accent s'applique aux boutons, liens actifs et éléments interactifs.
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div style={{
          padding: '14px 20px', borderTop: '1px solid #f0f0f0',
          display: 'flex', gap: 10,
        }}>
          <button onClick={handleReset} style={{
            flex: 1, border: '1.5px solid #e5e7eb', background: '#fff',
            borderRadius: 8, padding: '10px', cursor: 'pointer',
            fontSize: 12, fontWeight: 600, color: '#555',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          }}>
            <i className="dw dw-refresh" />
            Réinitialiser
          </button>
          <button onClick={closeRightSidebar} style={{
            flex: 1, border: 'none',
            background: 'linear-gradient(135deg, #0d6b29, #106938)',
            borderRadius: 8, padding: '10px', cursor: 'pointer',
            fontSize: 12, fontWeight: 600, color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          }}>
            <i className="dw dw-check" />
            Appliquer
          </button>
        </div>

      </div>
    </>
  )
}