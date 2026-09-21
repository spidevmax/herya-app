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
>
> `/identity-proof` is not part of the product and nothing links to it. It
> renders the surya/chandra design system against real seeded content so the
> visual direction can be reviewed on one page.

---

## Internationalization and theming

- **Languages:** Spanish and English. Dictionaries in [src/i18n/translations.js](src/i18n/translations.js); the active language is managed by `LanguageContext` and persisted to `localStorage`.
- **Translating database content:** interface text goes through `t()`, but the
  content itself (pose names, benefits, warnings) lives in MongoDB and is
  translated a second way. Documents carry paired fields — `benefits` and
  `benefitsEs`, `warnings` and `warningsEs` — and the helpers in
  [src/utils/libraryHelpers.js](src/utils/libraryHelpers.js) pick the right one
  for the active language:

  | Helper | Use it for |
  |---|---|
  | `localized(item, field, lang)` | a single string, such as `warnings` |
  | `localizedArray(item, field, lang)` | a list, such as `benefits` |
  | `localizedName(item, lang)` | the display name of a pose or sequence |
  | `translateWithFallback(t, key, fallback)` | fixed values that are the same in every document, such as `energyEffect` or a chakra, which have their own key groups under `library.*` |

  Reading `item.field` directly is the usual cause of a stray English string on
  a Spanish screen, so prefer a helper even when the Spanish value looks
  optional. Every helper falls back to the English value when the translation is
  missing, so nothing ever renders a raw key.
- **Theme:** light / dark via `ThemeContext`, which toggles a `dark` class on `<html>` and remembers the choice in `localStorage`. Tokens live in two places: [src/index.css](src/index.css) holds the Tailwind v4 `@theme` layer, and [src/styles/identity.css](src/styles/identity.css) holds the identity system. Both redefine their tokens under `html.dark`.

Both contexts are mounted alongside `AuthContext` in [src/providers/Providers.jsx](src/providers/Providers.jsx).

---

## Design and styles

The interface follows a single identity system defined in `src/styles/identity.css`.
Its tokens live on `:root`, so any component can use them; applying the system's
typography and ground is opt-in per subtree via `data-identity="next"`.

### Colour — surya and chandra

Brand colour is not an arbitrary pair. Vinyasa Krama organises practice around two
breath channels, and the app's own data already splits along them: `cooling` and
`calming` patterns are lunar, `heating` and `energizing` are solar.

| Token | Value | Use |
|---|---|---|
| `--ink` | `#1b1e3c` | Outlines and text. Never pure black |
| `--ink-soft` | `#4a4f77` | Secondary text |
| `--paper` | `#e9ebe4` | Page ground |
| `--paper-raised` | `#f4f5f0` | Cards sitting on the ground |
| `--surya` | `#f2a03d` | Warming channel — inhalation, effort, primary action |
| `--chandra` | `#5b8def` | Cooling channel — exhalation, rest |
| `--alert` | `#c8322b` | The only state colour. Success and info are carried by copy |

Both channel hues stay light in either theme, so text placed **on** them uses
`--on-fill`, a dark ink that never flips with the theme.

> **Pair every fill with its foreground.** A fill map and a text-colour map must
> be defined together (`DIFF_COLORS`/`DIFF_FG`, `BLOCK_COLORS`/`BLOCK_FG`). Passing
> a fill where an outline or label colour is expected renders an invisible chip —
> this accounted for most of the visual bugs found during the redesign.

### Typography

- **Display:** Archivo Black — short headings only
- **Body:** Atkinson Hyperlegible, designed by the Braille Institute for low
  vision. Chosen because tutors read this interface while guiding children who
  may already find reading effortful

### Structure

Depth comes from an ink outline plus a hard offset (`--offset`), never from a
gradient or a soft drop shadow. The shared primitives are `.ink-block`,
`.ink-field` and `.section-card`.

The current section is always marked by an **ink fill** — sidebar, bottom nav,
tabs, role toggles and chips all use the same device, so "where am I" gets one
answer across the app.

### Quiet mode

Screens that deal with contraindications, known triggers or safety anchors drop
all colour: ink on paper, no character, no encouragement copy. Anticipation aids
such as `VisualSchedule` keep their colour, because there it distinguishes blocks
at a glance rather than decorating.

### Motion

Page transitions are a crossfade with no travel, and are removed entirely when
the operating system asks for reduced motion.

### Responsive

Mobile-first, with a content column capped at **430px** and a bottom navigation
with a centred FAB. The sidebar replaces it from `lg` up.

---

## Reusable UI components

Primitives live in [src/components/ui/index.jsx](src/components/ui/index.jsx) and are imported from a single barrel:

**Actions and inputs**

- `Button` — variants: `primary`, `secondary`, `accent`, `ghost`, `outline`
- `ChipButton` — small pill button with an `active` state
- `InlineLink` — link styled to sit inside a sentence
- `Input` / `SelectField` — labelled form fields
- `SearchBar` — search field with a clear button
- `FilterChips` — single-choice filter row
- `MoodSelector` — multi-choice mood picker, capped by `maxSelection`
- `TabBar` — tab strip with roving selection

**Containers and layout**

- `Card` — animated card powered by Framer Motion
- `SurfaceCard` — plain surface without the animation
- `PageHeader` — page title plus optional description
- `StickyHeader` — header that stays put, with a back button
- `ConfirmModal` — confirmation dialog, with a `danger` variant for deletions

**Feedback and data**

- `Badge` — colored label
- `StatCard` — icon, label and value for a single figure
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
