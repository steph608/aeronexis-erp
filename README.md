# AERONEXIS Dynamics — ERP Industriel

Plateforme ERP modulaire pour la gestion des opérations de fabrication aéronautique.

**Production :** [aeronexis-erp.vercel.app](https://aeronexis-erp.vercel.app)

---

## Stack technique

| Couche | Technologie |
|--------|-------------|
| Frontend | React 19 + TypeScript + Vite + Tailwind CSS |
| Backend | Node.js + Express 5 + TypeScript |
| ORM | Prisma 5 |
| Base de données | PostgreSQL (Neon Cloud) |
| Auth | JWT + bcryptjs |
| IA | Groq API — Llama 3.3 70B |
| Déploiement frontend | Vercel |
| Déploiement backend | Railway |

---

## Modules fonctionnels

- **Dashboard** — KPIs consolidés : commandes, production, incidents, stocks
- **Commandes** — Gestion complète des commandes clients avec lignes de commande
- **Fabrication (OF)** — Ordres de fabrication, suivi des lots, statuts
- **Stocks** — Matières premières, alertes de rupture, réservations
- **Incidents qualité** — Signalement, suivi, commentaires avec notifications
- **Expéditions** — Planification et suivi des livraisons
- **Clients** — Gestion du portefeuille clients et historique
- **Produits** — Catalogue avec certifications et temps de fabrication
- **Audit** — Historique complet de toutes les actions utilisateurs
- **Agent IA** — Analyse prédictive : retards, stocks, marges, qualité
- **Notifications** — Alertes temps réel (incidents, stocks, expéditions)
- **Utilisateurs** — Gestion des rôles et permissions

---

## Rôles et permissions

| Rôle | Accès |
|------|-------|
| `ADMIN` | Accès total + gestion des utilisateurs |
| `DIRECTOR` | Tableaux de bord, IA, rapports |
| `PRODUCTION_MANAGER` | OF, incidents, fabrication |
| `LOGISTICS_MANAGER` | Stocks, expéditions, matières |
| `SALES_MANAGER` | Commandes, clients, marges |
| `OPERATOR` | OF assignés, incidents |

---

## Comptes de démonstration

| Email | Mot de passe | Rôle |
|-------|-------------|------|
| admin@aeronexis.com | Admin2026! | ADMIN |
| alex@aeronexis.com | Alex2026! | LOGISTICS_MANAGER |
| niza@aeronexis.com | Niza2026! | LOGISTICS_MANAGER |

---

## Installation locale

### Prérequis
- Node.js 18+
- npm

### Backend

```bash
cd backend
npm install
cp .env.example .env
# Remplir les variables dans .env
npx prisma generate
npx prisma db push
npx ts-node src/seed.ts
npm run dev
```

### Frontend

```bash
cd frontend
npm install
# Créer .env.local avec :
# VITE_API_URL=http://localhost:3000/api
npm run dev
```

---

## Variables d'environnement

### Backend (`.env`)

```env
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://...
JWT_SECRET=votre_secret
JWT_EXPIRES_IN=8h
FRONTEND_URL=http://localhost:5173
GROQ_API_KEY=gsk_...
```

### Frontend (`.env.local`)

```env
VITE_API_URL=http://localhost:3000/api
```

---

## Architecture

```
aeronexis-erp/
├── frontend/          # React + Vite
│   ├── src/
│   │   ├── components/    # Composants UI réutilisables
│   │   ├── pages/         # Pages par module métier
│   │   ├── services/      # Appels API (axios)
│   │   ├── store/         # État global (Zustand)
│   │   └── types/         # Types TypeScript
│   └── vercel.json
│
└── backend/           # Express + Prisma
    ├── src/
    │   ├── controllers/   # Logique des routes
    │   ├── services/      # Logique métier
    │   ├── routes/        # Définition des endpoints
    │   ├── middleware/     # Auth, permissions
    │   └── config/        # Configuration
    ├── prisma/
    │   ├── schema.prisma  # Modèle de données
    │   └── migrations/
    └── Procfile
```

---

## API — Endpoints principaux

| Module | Endpoint |
|--------|----------|
| Auth | `POST /api/auth/login` |
| Dashboard | `GET /api/dashboard` |
| Commandes | `GET/POST/PATCH /api/orders` |
| Fabrication | `GET/POST/PATCH /api/manufacturing` |
| Stocks | `GET/POST/PATCH /api/materials` |
| Incidents | `GET/POST/PATCH /api/incidents` |
| Expéditions | `GET/POST/PATCH /api/shipments` |
| Clients | `GET/POST/PATCH /api/customers` |
| Produits | `GET/POST /api/products` |
| IA | `GET /api/ai/summary` |
| Notifications | `GET/PATCH /api/notifications` |
| Audit | `GET /api/audit` |
| Utilisateurs | `GET/POST/PATCH /api/users` |

---

## Projet académique

ERP développé dans le cadre du projet **AERONEXIS Dynamics** — Transformation numérique d'une entreprise de fabrication de composants aéronautiques de haute précision.
