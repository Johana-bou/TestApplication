import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getPostes, type Poste } from '../../api/auth.api'
import { useAuthStore } from '../../store/authStore'
import { Spinner } from '../../components/ui/Spinner'

// ✅ Fallback avec noms complets identiques au seed
const POSTES_FALLBACK: Poste[] = [
  { id_poste: 1, code_poste: '488', nom_poste: 'Recette principale des Douanes de MAROUA', adresse: 'Maroua, Extrême-Nord, Cameroun' },
  { id_poste: 2, code_poste: '490', nom_poste: 'Recette principale des Douanes de LIMANI', adresse: 'Limani, Extrême-Nord, Cameroun' },
]

const FILIGRANE_POSITIONS = Array.from({ length: 24 }, (_, i) => ({
  top: `${Math.floor(i / 6) * 25}%`,
  left: `${(i % 6) * 17}%`,
}))

export default function PosteSelection() {
  const navigate = useNavigate()
  const { setPoste, isAuthenticated } = useAuthStore()

  if (isAuthenticated) { navigate('/dashboard'); return null }

  const { data: postes, isLoading, isError } = useQuery({
    queryKey: ['postes-public'],
    queryFn: getPostes,
    retry: 1,
  })

  const listePostes = (isError || !postes || postes.length === 0) ? POSTES_FALLBACK : postes

  const handleSelectPoste = (poste: Poste) => {
    setPoste(poste)
    navigate('/login')
  }

  return (
    <div style={{
      minHeight: '100vh',
      position: 'relative',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20, overflow: 'hidden',
    }}>

      {/* Logos en filigrane répétés en arrière-plan */}
      {FILIGRANE_POSITIONS.map((pos, i) => (
        <img
          key={i}
          src="/vendors/images/logo-tresor.png"
          alt=""
          style={{
            position: 'fixed',
            top: pos.top,
            left: pos.left,
            width: '130px',
            height: '130px',
            objectFit: 'contain',
            opacity: 0.35,
            zIndex: 0,
            pointerEvents: 'none',
            userSelect: 'none',
          }}
        />
      ))}

      {/* Contenu unique */}
      <div style={{
        position: 'relative', zIndex: 1,
        maxWidth: 700, width: '100%',
        background: 'rgba(153, 158, 158, 1)',
        backdropFilter: 'blur(6px)',
        borderRadius: 50,
        padding: '70px 40px',
        textAlign: 'center',
        overflow: 'hidden',
      }}>

        {/* Logo en filigrane centré DANS le grand div */}
        <img
          src="/vendors/images/logo-tresor.png"
          alt=""
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '600px',
            height: '600px',
            objectFit: 'contain',
            opacity: 0.35,
            zIndex: 0,
            pointerEvents: 'none',
            userSelect: 'none',
          }}
        />

        {/* Tout le contenu au-dessus du filigrane */}
        <div style={{ position: 'relative', zIndex: 1 }}>

          {/* Titre */}
          <div style={{ marginBottom: 28 }}>
            <h1 style={{ color: '#1a0b0bff', fontWeight: 800, fontSize: 20, margin: 0, lineHeight: 1.3 }}>
              RECETTE PRINCIPALE DES DOUANES
            </h1>
            <p style={{ color: 'rgba(26, 6, 6, 0.9)', fontWeight: 800, fontSize: 15, margin: '6px 0 0' }}>
              Secteur de l'Extrême-Nord — Cameroun
            </p>
            <p style={{ color: 'rgba(15, 3, 3, 1)', fontWeight: 800, fontSize: 12, margin: '4px 0 0' }}>
              REPUBLIQUE DU CAMEROUN — Direction Générale des Douanes
            </p>
          </div>

          {/* Séparateur */}
          <div style={{ borderTop: '1px solid rgba(26, 9, 9, 0.96)', marginBottom: 24 }} />

          {/* Sélection poste */}
          <h4 style={{ color: '#fff', fontWeight: 600, fontSize: 16, marginBottom: 20 }}>
            Sélectionnez votre poste douanier
          </h4>

          {isLoading ? (
            <div className="d-flex justify-content-center"><Spinner /></div>
          ) : (
            <div className="row justify-content-center">
              {listePostes.map(poste => (
                <div key={poste.id_poste} className="col-md-5 col-sm-6 mb-3">
                  <div
                    className="card"
                    style={{
                      borderRadius: 16, border: 'none', cursor: 'pointer',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                      transition: 'transform 0.2s, box-shadow 0.2s',
                      overflow: 'hidden',
                    }}
                    onMouseOver={e => {
                      (e.currentTarget as HTMLElement).style.transform = 'translateY(-5px)'
                      ;(e.currentTarget as HTMLElement).style.boxShadow = '0 12px 36px rgba(0,0,0,0.25)'
                    }}
                    onMouseOut={e => {
                      (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'
                      ;(e.currentTarget as HTMLElement).style.boxShadow = '0 4px 20px rgba(0,0,0,0.15)'
                    }}
                  >
                    <div className="card-body text-center py-4">
                      <div style={{ fontSize: 36, marginBottom: 10 }}></div>
                      <h5 style={{ fontWeight: 800, color: '#353535', fontSize: 20, marginBottom: 4 }}>
                        {poste.nom_poste}
                      </h5>
                      <p style={{ color: '#888', fontSize: 13, marginBottom: 6 }}>
                        Code : <span className="badge badge-secondary">{poste.code_poste}</span>
                      </p>
                      {poste.adresse && (
                        <p style={{ color: '#bbb', fontSize: 11, marginBottom: 12 }}>{poste.adresse}</p>
                      )}
                      <button className="btn btn-primary btn-block font-weight-600"
                        onClick={() => handleSelectPoste(poste)}>
                        Accéder
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {isError && (
            <div className="alert alert-warning mt-3" style={{ fontSize: 12, borderRadius: 10 }}>
              <i className="dw dw-warning mr-1" />
              Impossible de récupérer la liste depuis le serveur — affichage des postes par défaut.
            </div>
          )}

          {/* Séparateur footer */}
          <div style={{ borderTop: '1px solid rgba(12, 10, 10, 1)', marginTop: 24, paddingTop: 16 }}>
            <p style={{ color: 'rgba(17, 13, 13, 0.96)', fontWeight: 800, fontSize: 12, margin: 0 }}>
              © {new Date().getFullYear()} Direction Générale des Douanes du Cameroun
            </p>
          </div>

        </div>
      </div>
    </div>
  )
}