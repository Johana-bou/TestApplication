// src/components/layout/Navbar.tsx
import { NavLink, useNavigate } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import { useAuthStore } from "../../store/authStore";
import { useUIStore } from "../../store/uiStore";
import { useThemeStore, ACCENT_COLORS } from "../../store/themeStore";

type MenuKey = 'pv' | 'etat' | 'rapprochement' | 'encaissement' | 'protocole' | 'admin'

interface DropdownMenuProps {
  menuKey: MenuKey
  label: string
  icon: string
  children: React.ReactNode
  openMenu: MenuKey | null
  onToggle: (key: MenuKey | null) => void
}

function DropdownMenu({ menuKey, label, icon, children, openMenu, onToggle }: DropdownMenuProps) {
  const isOpen = openMenu === menuKey
  const ref = useRef<HTMLLIElement>(null)

  useEffect(() => {
    if (!isOpen) return
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onToggle(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen, onToggle])

  return (
    <li ref={ref} style={{ position: 'relative', listStyle: 'none' }}>
      <button
        onClick={() => onToggle(isOpen ? null : menuKey)}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: isOpen ? 'rgba(255,255,255,0.15)' : 'transparent',
          border: 'none', color: '#fff', padding: '8px 14px',
          borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 500,
          whiteSpace: 'nowrap', transition: 'background 0.15s',
        }}
        onMouseEnter={e => { if (!isOpen) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.1)' }}
        onMouseLeave={e => { if (!isOpen) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
      >
        <i className={`dw ${icon}`} style={{ fontSize: 15 }} />
        {label}
        <i className="fa fa-angle-down" style={{
          fontSize: 11, marginLeft: 2,
          transition: 'transform 0.2s',
          transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
        }} />
      </button>

      {isOpen && (
        <ul style={{
          position: 'absolute', top: '100%', left: 0, zIndex: 9999,
          background: '#fff', borderRadius: 8, minWidth: 210,
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          border: '1px solid #f0f0f0',
          padding: '6px 0', margin: 0, listStyle: 'none',
          marginTop: 4,
        }}>
          {children}
        </ul>
      )}
    </li>
  )
}

function DropdownLink({ to, label, icon, onClick, accentPrimary, accentLight }: {
  to: string; label: string; icon?: string; onClick: () => void
  accentPrimary: string; accentLight: string
}) {
  return (
    <li>
      <NavLink
        to={to}
        onClick={onClick}
        style={({ isActive }) => ({
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '9px 16px', fontSize: 13, textDecoration: 'none',
          color: isActive ? accentPrimary : '#353535',
          fontWeight: isActive ? 600 : 400,
          background: isActive ? accentLight : 'transparent',
          transition: 'background 0.1s',
        })}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#f8f9fa' }}
        onMouseLeave={e => {
          const active = (e.currentTarget as HTMLElement).style.color === accentPrimary
          ;(e.currentTarget as HTMLElement).style.background = active ? accentLight : 'transparent'
        }}
      >
        {icon && <i className={`dw ${icon}`} style={{ fontSize: 14, color: '#888' }} />}
        {label}
      </NavLink>
    </li>
  )
}

function DropdownDivider() {
  return <li style={{ height: 1, background: '#f0f0f0', margin: '4px 0' }} />
}

function Avatar({ prenom, nom }: { prenom?: string; nom?: string }) {
  const initials = `${prenom?.[0] ?? ''}${nom?.[0] ?? ''}`.toUpperCase()
  return (
    <div style={{
      width: 32, height: 32, borderRadius: '50%',
      background: 'rgba(255,255,255,0.25)',
      border: '2px solid rgba(255,255,255,0.4)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: '#fff', fontWeight: 700, fontSize: 13, flexShrink: 0,
      letterSpacing: 0.5,
    }}>
      {initials}
    </div>
  )
}

// Menu déroulant utilisateur
function UserMenu({ user, onLogout, onOpenSettings }: {
  user: { prenom?: string; nom?: string; role?: string; email?: string } | null
  onLogout: (e: React.MouseEvent) => void
  onOpenSettings: () => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const { accentColor } = useThemeStore()
  const accent = ACCENT_COLORS[accentColor]

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const avatarBig = `${user?.prenom?.[0] ?? ''}${user?.nom?.[0] ?? ''}`.toUpperCase()

  return (
    <div ref={ref} style={{ position: 'relative', flexShrink: 0 }}>
      {/* Trigger */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: 10,
          background: open ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.1)',
          border: 'none', borderRadius: 8, padding: '4px 12px 4px 8px',
          cursor: 'pointer', transition: 'background 0.15s',
        }}
        onMouseEnter={e => { if (!open) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.15)' }}
        onMouseLeave={e => { if (!open) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.1)' }}
      >
        <Avatar prenom={user?.prenom} nom={user?.nom} />
        <div style={{ lineHeight: 1.25, textAlign: 'left' }}>
          <div style={{ color: '#fff', fontSize: 13, fontWeight: 600 }}>
            {user?.prenom} {user?.nom}
          </div>
          <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: 11 }}>
            {user?.role === 'ADMIN' ? 'Administrateur' : 'Receveur'}
          </div>
        </div>
        <i className="fa fa-angle-down" style={{
          color: 'rgba(255,255,255,0.7)', fontSize: 11, marginLeft: 4,
          transition: 'transform 0.2s',
          transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
        }} />
      </button>

      {/* Dropdown */}
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', right: 0, zIndex: 9999,
          background: '#fff', borderRadius: 10, minWidth: 240,
          boxShadow: '0 10px 32px rgba(0,0,0,0.14)',
          border: '1px solid #f0f0f0', overflow: 'hidden',
        }}>
          {/* En-tête profil */}
          <div style={{
            padding: '16px', background: `linear-gradient(135deg, ${accent.primary}ee, ${accent.primary})`,
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: '50%',
              background: 'rgba(255,255,255,0.2)',
              border: '2px solid rgba(255,255,255,0.4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontWeight: 700, fontSize: 17, flexShrink: 0,
            }}>
              {avatarBig}
            </div>
            <div>
              <div style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>
                {user?.prenom} {user?.nom}
              </div>
              <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 2 }}>
                {user?.role === 'ADMIN' ? 'Administrateur' : 'Receveur'}
              </div>
            </div>
          </div>

          {/* Options */}
          <div style={{ padding: '6px 0' }}>
            <button
              onClick={() => { navigate('/profil'); setOpen(false) }}
              style={menuItemStyle}
              onMouseEnter={e => (e.currentTarget.style.background = '#f8f9fa')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <i className="dw dw-user1" style={menuIconStyle(accent.primary)} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 500, color: '#353535' }}>Mon profil</div>
                <div style={{ fontSize: 11, color: '#aaa', marginTop: 1 }}>Voir et modifier mes informations</div>
              </div>
            </button>

            <button
              onClick={() => { onOpenSettings(); setOpen(false) }}
              style={menuItemStyle}
              onMouseEnter={e => (e.currentTarget.style.background = '#f8f9fa')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <i className="dw dw-settings2" style={menuIconStyle('#7934f3')} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 500, color: '#353535' }}>Paramètres</div>
                <div style={{ fontSize: 11, color: '#aaa', marginTop: 1 }}>Thème et affichage</div>
              </div>
            </button>

            <div style={{ height: 1, background: '#f0f0f0', margin: '4px 0' }} />

            <button
              onClick={(e) => { setOpen(false); onLogout(e) }}
              style={menuItemStyle}
              onMouseEnter={e => {
                e.currentTarget.style.background = '#fff5f5'
                e.currentTarget.querySelector('i')!.style.color = '#e53e3e'
                e.currentTarget.querySelectorAll('div')[0].style.color = '#e53e3e'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'transparent'
                e.currentTarget.querySelector('i')!.style.color = '#f56565'
                e.currentTarget.querySelectorAll('div')[0].style.color = '#353535'
              }}
            >
              <i className="dw dw-logout" style={menuIconStyle('#f56565')} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 500, color: '#353535' }}>Déconnexion</div>
                <div style={{ fontSize: 11, color: '#aaa', marginTop: 1 }}>Quitter la session</div>
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

const menuItemStyle: React.CSSProperties = {
  width: '100%', display: 'flex', alignItems: 'center', gap: 12,
  padding: '10px 16px', background: 'transparent', border: 'none',
  cursor: 'pointer', textAlign: 'left', transition: 'background 0.1s',
}

const menuIconStyle = (color: string): React.CSSProperties => ({
  fontSize: 18, color, width: 32, height: 32, borderRadius: 8,
  background: `${color}18`, display: 'flex', alignItems: 'center',
  justifyContent: 'center', flexShrink: 0,
})

export default function Navbar() {
  const { user, logout } = useAuthStore();
  const { toggleRightSidebar } = useUIStore();
  const { accentColor } = useThemeStore();
  const accent = ACCENT_COLORS[accentColor];
  const navigate = useNavigate();
  const isAdmin = user?.role === "ADMIN";
  const [openMenu, setOpenMenu] = useState<MenuKey | null>(null);

  const toggle = (key: MenuKey | null) => setOpenMenu(key)
  const close = () => setOpenMenu(null)

  const handleLogout = (e: React.MouseEvent) => {
    e.preventDefault()
    logout()
    navigate("/")
  }

  return (
    <nav style={{
      background: `linear-gradient(135deg, ${accent.primary}ee 0%, ${accent.primary} 60%, ${accent.primary}cc 100%)`,
      boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
      position: 'sticky', top: 0, zIndex: 1000,
      width: '100%',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center',
        padding: '0 20px', height: 56, gap: 4,
      }}>

        {/* Logo */}
        <NavLink to="/dashboard" style={{
          display: 'flex', alignItems: 'center', gap: 10,
          textDecoration: 'none', marginRight: 16, flexShrink: 0,
        }}>
          <img src="/vendors/images/logo-tresor.png"
            style={{ width: 32, height: 32, objectFit: 'contain' }} alt="Logo" />
          <span style={{ color: '#fff', fontWeight: 700, fontSize: 15, letterSpacing: 0.3 }}>
            Trésor
          </span>
        </NavLink>

        {/* Séparateur */}
        <div style={{ width: 1, height: 28, background: 'rgba(255,255,255,0.2)', marginRight: 12 }} />

        {/* Menus déroulants */}
        <ul style={{ display: 'flex', alignItems: 'center', gap: 2, margin: 0, padding: 0, flex: 1 }}>

          <DropdownMenu menuKey="pv" label="Procès-verbal" icon="dw-edit2" openMenu={openMenu} onToggle={toggle}>
            <DropdownLink to="/pv/nouveau" label="Établir un PV" icon="dw-add" onClick={close} accentPrimary={accent.primary} accentLight={accent.light} />
            <DropdownLink to="/pv" label="Consulter la liste" icon="dw-eye" onClick={close} accentPrimary={accent.primary} accentLight={accent.light} />
          </DropdownMenu>

          <DropdownMenu menuKey="etat" label="État nominatif" icon="dw-library" openMenu={openMenu} onToggle={toggle}>
            <DropdownLink to="/etats-nominatifs/nouveau" label="Nouvel état" icon="dw-add" onClick={close} accentPrimary={accent.primary} accentLight={accent.light} />
            <DropdownDivider />
            <DropdownLink to="/etats-nominatifs?type=AMENDE" label="Amende" icon="dw-next" onClick={close} accentPrimary={accent.primary} accentLight={accent.light} />
            <DropdownLink to="/etats-nominatifs?type=RAR" label="RAR" icon="dw-next" onClick={close} accentPrimary={accent.primary} accentLight={accent.light} />
          </DropdownMenu>

          <DropdownMenu menuKey="rapprochement" label="Rapprochement" icon="dw-apartment" openMenu={openMenu} onToggle={toggle}>
            <DropdownLink to="/rapprochement/nouveau" label="Saisir un rapprochement" icon="dw-add" onClick={close} accentPrimary={accent.primary} accentLight={accent.light} />
            <DropdownLink to="/rapprochement" label="Consulter la liste" icon="dw-eye" onClick={close} accentPrimary={accent.primary} accentLight={accent.light} />
          </DropdownMenu>

          <DropdownMenu menuKey="encaissement" label="Encaissement" icon="dw-paint-brush" openMenu={openMenu} onToggle={toggle}>
            <DropdownLink to="/encaissements/saisie" label="Saisir un encaissement" icon="dw-add" onClick={close} accentPrimary={accent.primary} accentLight={accent.light} />
            <DropdownLink to="/encaissements" label="Liste des encaissements" icon="dw-eye" onClick={close} accentPrimary={accent.primary} accentLight={accent.light} />
          </DropdownMenu>

          <DropdownMenu menuKey="protocole" label="PROTOCOLE/CAC" icon="dw-analytics-21" openMenu={openMenu} onToggle={toggle}>
            <DropdownLink to="/rapports?type=PROTOCOLE" label="PROTOCOLE" icon="dw-next" onClick={close} accentPrimary={accent.primary} accentLight={accent.light} />
            <DropdownLink to="/rapports?type=CAC" label="CAC" icon="dw-next" onClick={close} accentPrimary={accent.primary} accentLight={accent.light} />
          </DropdownMenu>

          {isAdmin && (
            <DropdownMenu menuKey="admin" label="Administration" icon="dw-copy" openMenu={openMenu} onToggle={toggle}>
              <DropdownLink to="/admin/unites" label="Unités" icon="dw-next" onClick={close} accentPrimary={accent.primary} accentLight={accent.light} />
              <DropdownLink to="/admin/usagers" label="Usagers" icon="dw-next" onClick={close} accentPrimary={accent.primary} accentLight={accent.light} />
              <DropdownLink to="/admin/comptes" label="Comptes" icon="dw-next" onClick={close} accentPrimary={accent.primary} accentLight={accent.light} />
              <DropdownLink to="/admin/lignes-budgetaires" label="Lignes budgétaires" icon="dw-next" onClick={close} accentPrimary={accent.primary} accentLight={accent.light} />
              <DropdownLink to="/admin/utilisateurs" label="Utilisateurs" icon="dw-next" onClick={close} accentPrimary={accent.primary} accentLight={accent.light} />
              <DropdownLink to="/admin/affectations" label="Affectations" icon="dw-next" onClick={close} accentPrimary={accent.primary} accentLight={accent.light} />
              <DropdownLink to="/admin/audit-logs" label="Audit logs" icon="dw-next" onClick={close} accentPrimary={accent.primary} accentLight={accent.light} />
            </DropdownMenu>
          )}
        </ul>

        {/* Menu utilisateur */}
        <UserMenu
          user={user}
          onLogout={handleLogout}
          onOpenSettings={toggleRightSidebar}
        />

      </div>
    </nav>
  )
}