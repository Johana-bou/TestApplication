# Douanes Extrême-Nord — Application de gestion douanière

Application React TypeScript pour la **Recette Principale des Douanes du Secteur de l'Extrême-Nord du Cameroun**.

## Stack technique
- **React 18 + TypeScript** (Vite)
- **React Router v6** (navigation + routes protégées)
- **Zustand** (auth + notifications)
- **TanStack Query v5** (cache API)
- **React Hook Form + Zod** (formulaires validés)
- **Recharts** (graphiques dashboard)
- **React Hot Toast** (notifications)
- **Bootstrap 4 + DeskApp2** (design fidèle au template)

## Prérequis
- Node.js ≥ 18
- Backend FastAPI tournant sur `http://localhost:8000`

## Installation

```bash
npm install
npm run dev
```

L'application sera accessible sur `http://localhost:5173`

## Structure

```
src/
├── api/           → Appels HTTP (axios + intercepteurs JWT)
├── components/    → Layout, UI, Shared
├── hooks/         → useAuth, useImprimer, useDebounce, usePeriode
├── pages/         → Dashboard, PV, Encaissements, Rapports, Admin...
├── store/         → Zustand (auth + notifs)
├── types/         → TypeScript interfaces
└── utils/         → formatMontant, formatDate, periodes
```

## Modules implémentés

| Module | Statut |
|--------|--------|
| Sélection poste | ✅ Complet |
| Connexion JWT | ✅ Complet |
| Dashboard (KPI + graphiques) | ✅ Complet |
| Procès-Verbaux (CRUD + impression) | ✅ Complet |
| Encaissements (saisie + liste) | ✅ Complet |
| Rapports (tableau + PDF) | ✅ Complet |
| États nominatifs | 🔧 Stub (à développer) |
| Rapprochement | 🔧 Stub (à développer) |
| Admin — Unités | ✅ Complet |
| Admin — Lignes budgétaires | ✅ Complet |
| Admin — Utilisateurs | ✅ Complet |
| Admin — Affectations | ✅ Complet |
| Admin — Audit logs | ✅ Complet |

## Rôles
- **ADMIN** → Accès complet à tous les postes et à la section Administration
- **RECEVEUR** → Accès uniquement à son poste affecté

## Règles métier importantes
- La saisie d'encaissement ne demande jamais le code_taxe — il est résolu automatiquement via `/api/lignes-budgetaires/recherche/{num_ligne}`
- Toute impression ouvre directement le dialogue natif du navigateur (pas de téléchargement)
- Les dates sont toujours affichées en DD/MM/YYYY et envoyées à l'API en YYYY-MM-DD
- La `date_fin` est toujours calculée automatiquement = dernier jour du mois sélectionné
