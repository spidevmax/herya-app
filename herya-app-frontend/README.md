# Herya App — Frontend

Frontend móvil de **Herya**, una aplicación de seguimiento de práctica de yoga. Construida con React 19, Vite y Tailwind CSS 4, con foco en una experiencia móvil fluida y animada.

---

## Tecnologías principales

| Tecnología | Versión | Uso |
|---|---|---|
| React | 19.2 | Framework UI |
| React Router | 7 | Enrutamiento cliente |
| Vite + SWC | 7 | Build tool |
| Tailwind CSS | 4 | Estilos |
| Framer Motion | 12 | Animaciones |
| Axios | 1.13 | Cliente HTTP |
| Lucide React | 0.575 | Iconografía |

---

## Estructura del proyecto

```
herya-app-frontend/
├── src/
│   ├── api/                  # Clientes Axios por dominio
│   │   ├── axios.js          # Instancia base con interceptores JWT
│   │   ├── auth.api.js
│   │   ├── sessions.api.js
│   │   ├── sequences.api.js
│   │   ├── journalEntries.api.js
│   │   └── users.api.js
│   ├── components/
│   │   ├── dashboard/        # HeroCard, CalendarStrip, QuickActions…
│   │   ├── garden/           # FlowerGarden
│   │   ├── layout/           # AppLayout, BottomNav
│   │   ├── library/          # SequenceCard
│   │   ├── session/          # PranayamaMetronome
│   │   └── ui/               # Button, Card, Badge, ProgressBar…
│   ├── context/
│   │   └── AuthContext.jsx   # Contexto de autenticación global
│   ├── pages/                # Dashboard, Library, Session, Garden, Profile…
│   ├── utils/                # Constantes y helpers
│   ├── App.jsx               # Rutas y ProtectedRoute
│   └── main.jsx              # Punto de entrada
├── public/
├── index.html
├── vite.config.js
└── .env
```

---

## Instalación y desarrollo

### Requisitos previos

- Node.js 18+
- Backend de Herya corriendo en `http://localhost:3000`

### Puesta en marcha

```bash
# Instalar dependencias
npm install

# Copiar variables de entorno
cp .env.example .env   # o editar .env directamente

# Iniciar servidor de desarrollo
npm run dev
```

La aplicación estará disponible en `http://localhost:5173`.

### Scripts disponibles

```bash
npm run dev       # Servidor de desarrollo con HMR
npm run build     # Build de producción en /dist
npm run preview   # Preview del build de producción
npm run lint      # Linting con ESLint
```

---

## Variables de entorno

Crea un archivo `.env` en la raíz del proyecto frontend:

```env
VITE_API_URL=http://localhost:3000/api/v1
```

> Todas las variables deben llevar el prefijo `VITE_` para ser accesibles en el cliente a través de `import.meta.env`.

---

## Autenticación

Se utiliza JWT almacenado en `localStorage` con las claves `herya_token` y `herya_user`. El `AuthContext` expone el hook `useAuth()` con los métodos `login`, `register`, `logout` y `refreshUser`.

El interceptor de Axios inyecta automáticamente el token en cada petición y redirige a `/login` ante respuestas `401`.

Las rutas se protegen con dos wrappers:
- `ProtectedRoute` — redirige a `/login` si no hay sesión.
- `PublicRoute` — redirige al dashboard si ya existe sesión.

---

## Páginas

| Ruta | Página | Descripción |
|---|---|---|
| `/` | Dashboard | Saludo, calendario de actividad, secuencia recomendada y sesiones recientes |
| `/library` | Library | Biblioteca de secuencias con filtros por familia y nivel |
| `/library/:id` | SequenceDetail | Detalle de una secuencia |
| `/session` | Session | Flujo de registro de práctica (4 pasos) |
| `/garden` | Garden | Visualización del diario como jardín de flores |
| `/profile` | Profile | Estadísticas, nivel/XP, rachas y cuenta |
| `/login` | Login | Inicio de sesión |
| `/register` | Register | Registro de nuevo usuario |

---

## Diseño y estilos

### Tema de color

| Token | Valor | Uso |
|---|---|---|
| `primary` | `#4A72FF` | Azul principal |
| `secondary` | `#FFB347` | Naranja |
| `accent` | `#5DB075` | Verde |
| `surface` | `#F8F7F4` | Fondo beige |
| `text-primary` | `#1A1A2E` | Texto principal |
| `text-muted` | `#9CA3AF` | Texto secundario |

### Tipografía

- **Headings:** Playfair Display (serif)
- **Body:** Inter (sans-serif)

### Responsive

La aplicación está optimizada para móvil con un ancho máximo de **430px** y navegación inferior con FAB central.

---

## Componentes UI reutilizables

Todos los primitivos viven en `src/components/ui/`:

- `Button` — variantes: `primary`, `secondary`, `accent`, `ghost`, `outline`
- `Card` — tarjeta animada con Framer Motion
- `Badge` — etiqueta de color
- `ProgressBar` / `CircleProgress` — barras de progreso lineal y circular
- `SkeletonCard` — placeholder de carga
- `LoadingSpinner` — spinner
- `EmptyState` — estado vacío

---

## Clientes API

Cada dominio tiene su propio módulo en `src/api/`:

- **auth.api.js** — login, register, getMe, logout
- **sessions.api.js** — CRUD de sesiones + stats
- **sequences.api.js** — listado, detalle, búsqueda y recomendación
- **journalEntries.api.js** — CRUD de entradas de diario + stats
- **users.api.js** — perfil, imagen de perfil, estadísticas de usuario
