# Herya App — Frontend

Mobile frontend for **Herya**, a yoga practice tracking app (Vinyasa Krama, pranayama, meditation, and reflective journaling). Built with React 19, Vite 7 (SWC), and Tailwind CSS 4, with a focus on a fluid, animated, and internationalized mobile experience.

---

## Main technologies

| Technology | Version | Use |
|---|---|---|
| React | 19.2 | UI framework |
| React Router | 7 | Client-side routing |
| Vite + SWC | 7 | Build tool and dev server |
| Tailwind CSS | 4 | Styling |
| Framer Motion | 12 | Animations |
| Axios | 1.13 | HTTP client |
| Lucide React | 0.575 | Icons |
| Vitest + Testing Library | 3 / 16 | Unit testing |
| Biome | 2 | Lint and format (via `lint` script) |

---

## Project structure

```
herya-app-frontend/
├── src/
│   ├── api/                  # Axios clients per domain
│   │   ├── axios.js          # Base instance with JWT interceptors
│   │   ├── admin.api.js
│   │   ├── auth.api.js
│   │   ├── breathing.api.js
│   │   ├── childProfiles.api.js
│   │   ├── journalEntries.api.js
│   │   ├── poses.api.js
│   │   ├── sequences.api.js
│   │   ├── sessions.api.js
│   │   └── users.api.js
│   ├── components/
│   │   ├── admin/            # Admin panel views and widgets
│   │   ├── auth/             # Login / register / reset forms
│   │   ├── dashboard/        # HeroCard, CalendarStrip, QuickActions…
│   │   ├── journal/          # Journal editor and cards
│   │   ├── layout/           # AppLayout, BottomNav, FAB
│   │   ├── library/          # SequenceCard, filters, pose cards
│   │   ├── profile/          # Stats, streak, preferences
│   │   ├── routing/          # ProtectedRoute, PublicRoute, legacy redirects
│   │   ├── session/          # PranayamaMetronome, guided controls
│   │   ├── tutor/            # Tutor-role views
│   │   └── ui/               # Primitives (index.jsx) and design tokens
│   ├── config/               # Static client configuration
│   ├── context/
│   │   ├── AuthContext.jsx       # User session and role
│   │   ├── LanguageContext.jsx   # Active language (es / en)
│   │   └── ThemeContext.jsx      # Light / dark theme
│   ├── hooks/                # useBreathingEngine, useSessionTimer…
│   ├── i18n/
│   │   └── translations.js   # es / en dictionaries
│   ├── pages/                # Dashboard, Library, Session, Journal, Admin…
│   ├── providers/
│   │   └── Providers.jsx     # Combines Auth, Language, and Theme
│   ├── test/                 # Vitest setup
│   ├── utils/                # Constants and helpers
│   ├── App.jsx               # Routes and guards
│   ├── index.css             # Tailwind v4 + tokens
│   └── main.jsx              # Entry point
├── public/
├── index.html
├── vite.config.js
└── .env
```

---

## Installation and development

### Prerequisites

- Node.js 22.x
- Herya backend running at `http://localhost:3000`

### Getting started

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Start the dev server
npm run dev
```

The app will be available at `http://localhost:5173`.

### Available scripts

```bash
npm run dev             # Dev server with HMR (Vite + SWC)
npm run build           # Production build to /dist
npm run preview         # Preview the production build
npm run lint            # Biome check on src/
npm test                # Run Vitest (run mode)
npm run test:watch      # Vitest in watch mode
npm run test:coverage   # Vitest with V8 coverage
```

---

## Environment variables

Create a `.env` file in the frontend root:

```env
VITE_API_URL=http://localhost:3000/api/v1
```

> All variables must be prefixed with `VITE_` to be exposed to the client via `import.meta.env`.

---

## Authentication

JWT is stored in `localStorage` under the keys `herya_token` and `herya_user`. `AuthContext` exposes the `useAuth()` hook with `login`, `register`, `logout`, and `refreshUser`, plus the user's role (`user`, `tutor`, `admin`).

The Axios interceptor automatically attaches the token to every request and redirects to `/login` on `401` responses.

Routes are protected by two wrappers in `src/components/routing/`:
- `ProtectedRoute` — redirects to `/login` when there is no session.
- `PublicRoute` — redirects to the dashboard when a session already exists.

---

## Routes

### Public

| Route | Page | Description |
|---|---|---|
| `/login` | Login | Sign in |
| `/register` | Register | Sign up |
| `/forgot-password` | ForgotPassword | Request a password reset email |
| `/reset-password` | ResetPassword | Reset password with token |
| `/auth/callback` | AuthCallback | Callback for external providers |

### Protected

| Route | Page | Description |
|---|---|---|
| `/` | Dashboard / Admin | User home; renders `Admin` if the role is admin |
| `/library` | Library | Library of sequences, poses, and breathing patterns |
| `/library/sequence/:id` | SequenceDetail | Sequence detail |
| `/library/pose/:id` | PoseDetail | Pose detail |
| `/library/breathing/:id` | BreathingDetail | Breathing pattern detail |
| `/poses` | Poses | Pose listing (non-admin) |
| `/start-practice` | StartPractice | Practice-type selector |
| `/session/:type` | Session | Guided practice flow (non-admin) |
| `/sessions` | SessionHistory | Session history |
| `/sessions/:id` | SessionDetail | Session detail |
| `/journal` | Journal | Reflective journal (non-admin) |
| `/journal/new` | JournalForm | Create entry |
| `/journal/:id/edit` | JournalForm | Edit entry |
| `/profile` | Profile | Stats, level/XP, streaks, and account |
| `/admin` | Admin | Admin panel |
| `*` | NotFound | 404 |

> `/garden` redirects to `/journal` for backward compatibility. `/poses/:id` and `/breathing/:id` redirect to their counterparts under `/library/*`.

---

## Internationalization and theming

- **Languages:** Spanish and English. Dictionaries in [src/i18n/translations.js](src/i18n/translations.js); the active language is managed by `LanguageContext` and persisted to `localStorage`.
- **Theme:** light / dark via `ThemeContext`, with tokens defined in [src/index.css](src/index.css) and [src/components/ui/tokens.js](src/components/ui/tokens.js).

Both contexts are mounted alongside `AuthContext` in [src/providers/Providers.jsx](src/providers/Providers.jsx).

---

## Design and styles

### Color theme

| Token | Value | Use |
|---|---|---|
| `primary` | `#4A72FF` | Main blue |
| `secondary` | `#FFB347` | Orange |
| `accent` | `#5DB075` | Green |
| `surface` | `#F8F7F4` | Beige background |
| `text-primary` | `#1A1A2E` | Primary text |
| `text-muted` | `#9CA3AF` | Secondary text |

### Typography

- **Headings:** Playfair Display (serif)
- **Body:** Inter (sans-serif)

### Responsive

The app is optimized for mobile with a max width of **430px** and a bottom navigation with a centered FAB.

---

## Reusable UI components

Primitives live in [src/components/ui/index.jsx](src/components/ui/index.jsx) and are imported from a single barrel:

- `Button` — variants: `primary`, `secondary`, `accent`, `ghost`, `outline`
- `Card` — animated card powered by Framer Motion
- `Badge` — colored label
- `ProgressBar` / `CircleProgress` — linear and circular progress bars
- `SkeletonCard` — loading placeholder
- `LoadingSpinner` — spinner
- `EmptyState` — empty state

---

## Custom hooks

Located in [src/hooks/](src/hooks/):

- `useBreathingEngine` — inhale / hold / exhale phase engine for pranayama
- `usePranayamaAudio` — audio cue playback during practice
- `useSessionTimer` — guided-session timer
- `useSessionPersistence` — saves and restores in-progress session state
- `useJournalEntries` / `useJournalFilters` — journal fetching and filtering

---

## API clients

Each domain has its own module in [src/api/](src/api/):

- **auth.api.js** — login, register, getMe, logout, forgot/reset password
- **users.api.js** — profile, profile image, password change, stats
- **sessions.api.js** — session CRUD, guided-practice control, stats, and analytics
- **sequences.api.js** — listing, detail, search, and recommendation for VK sequences
- **poses.api.js** — listing, search, and related poses
- **breathing.api.js** — breathing patterns, recommendations, and progression
- **journalEntries.api.js** — journal entry CRUD
- **childProfiles.api.js** — child-profile management
- **admin.api.js** — admin endpoints (users, content, analytics)

---

## Testing

The project uses **Vitest** + **@testing-library/react** with `jsdom`. The global setup lives in [src/test/](src/test/).

```bash
npm test                # Run the full suite
npm run test:watch      # Watch mode
npm run test:coverage   # V8 coverage report
```
