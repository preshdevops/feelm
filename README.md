# 🎬 Feelm

> *A cinematic recommendation platform powered by Gemini AI and Cloudflare Workers, crafted with an A24 & Letterboxd editorial aesthetic.*

Feelm connects how you feel with what you watch. Instead of surface-level genre filters, Feelm analyzes your emotional state, social context, and intent using AI to deliver unexpected, deeply resonant film recommendations.

---

## ✨ Features

- 🎭 **Vibe & Mood-Based Recommendations**: Express how you're feeling in natural language or pick from curated mood tags (*Happy, Sad, Stressed, Romantic, Adventurous, Bored, Inspired, Scared*).
- 🌌 **Mood-Reactive Ambient UI**: Real-time CSS background illumination (`--mood-tint`, `--mood-accent`) that dynamically reacts as you type your vibe via debounced AI classification.
- 🤖 **Gemini AI Integration**: Multi-model fallback (`gemini-2.0-flash`, `gemini-1.5-flash`) providing non-generic, atmospheric recommendations and custom "vibe match" explanations.
- 📺 **Films & Series Filtering**: Seamlessly toggle between Movies, TV Series, or both.
- 🎯 **Contextual Filters**: Fine-tune recommendations based on your current energy level, who you're watching with, and what you need emotionally from the film.
- 🔐 **User Authentication**: Secure JWT-based registration and login system.
- 📌 **Personal Watchlist**: Save and manage your favorite picks, backed by PostgreSQL.
- ⚡ **Serverless Edge Performance**: Hono backend running on Cloudflare Workers with connection pooling via **Cloudflare Hyperdrive**.

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: [React 19](https://react.dev/) + [Vite](https://vitejs.dev/)
- **Routing**: [React Router 6](https://reactrouter.com/)
- **Styling**: [TailwindCSS](https://tailwindcss.com/) + Custom Design System
- **Icons & Polish**: Lucide React, Glassmorphism, Micro-animations

### Backend
- **Framework**: [Hono](https://hono.dev/)
- **Runtime**: [Cloudflare Workers](https://workers.cloudflare.com/)
- **Database & Pooling**: PostgreSQL + [Cloudflare Hyperdrive](https://developers.cloudflare.com/hyperdrive/) (`pg` driver)
- **AI Model**: Google Gemini API (`gemini-2.0-flash`, `gemini-1.5-flash`)
- **Metadata Provider**: [TMDB API](https://www.themoviedb.org/documentation/api)

---

## 📁 Project Structure

```text
feelm/
├── feelm-server/                 # Backend API (Hono for Cloudflare Workers)
│   ├── db/
│   │   └── pool.js               # Hyperdrive-cached PostgreSQL connection pool
│   ├── middleware/
│   │   └── authMiddleware.js     # JWT verification middleware
│   ├── routes/
│   │   ├── auth.js               # User registration and login routes
│   │   ├── movies.js             # AI recommendations, search, details, blurb, classification
│   │   └── watchlist.js          # Watchlist CRUD routes
│   ├── index.js                  # Main Hono app entry point
│   ├── wrangler.jsonc            # Cloudflare Worker & Hyperdrive configuration
│   └── package.json
│
├── src/                          # Frontend Application (Vite + React)
│   ├── components/               # UI components (MoodPicker, MoodBackground, MovieCard, etc.)
│   ├── context/                  # React Contexts (AuthContext, WatchlistContext)
│   ├── hooks/                    # Custom React hooks (useMoodBackground)
│   ├── lib/                      # API client configuration
│   ├── pages/                    # Views (Mood, Results, MovieDetail, Watchlist, Auth)
│   ├── utils/                    # Mood configurations & TMDB utilities
│   ├── App.jsx                   # Router setup & layout
│   └── index.css                 # Global CSS tokens & Tailwind directives
│
├── public/                       # Static assets
└── package.json                  # Frontend dependencies
```

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- [Cloudflare Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/) (`npm install -g wrangler`)
- A PostgreSQL database instance (Aiven, Supabase, Neon, or local)
- Google Gemini API Key ([Get one here](https://aistudio.google.com/))
- TMDB API Key ([Get one here](https://www.themoviedb.org/settings/api))

---

### Local Environment Setup

#### 1. Clone the Repository
```bash
git clone https://github.com/preshdevops/feelm.git
cd feelm
```

#### 2. Frontend Setup
Install dependencies and configure `.env`:
```bash
npm install
```

Create `.env` in the root directory:
```env
VITE_API_URL=http://localhost:5000/api
VITE_TMDB_API_KEY=your_tmdb_api_key_here
```

Start the Vite development server:
```bash
npm run dev
```

#### 3. Backend Setup
Navigate to `feelm-server`, install dependencies, and configure `.env`:
```bash
cd feelm-server
npm install
```

Create `feelm-server/.env`:
```env
PORT=5000
CORS_ORIGIN=http://localhost:5173
JWT_SECRET=your_super_secret_jwt_key
GEMINI_API_KEY=your_gemini_api_key
TMDB_API_KEY=your_tmdb_api_key

# PostgreSQL Connection Credentials (for local testing outside Hyperdrive)
DATABASE_URL=postgres://user:password@host:5432/database
```

Run the backend locally:
```bash
npm run dev
```

---

## 📡 API Reference

### Auth Routes
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Register a new user (`email`, `password`) |
| `POST` | `/api/auth/login` | Login user and receive JWT token |

### Movie & AI Routes
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/movies/recommendations` | Get 6 AI-curated movie titles based on mood/feeling |
| `POST` | `/api/movies/classify-mood` | Classify typed feeling text into a preset mood ID |
| `POST` | `/api/movies/search` | Search TMDB by movie title |
| `GET`  | `/api/movies/details/:id` | Fetch detailed movie info, trailer, director & cast |
| `POST` | `/api/movies/blurb` | Generate a 1-2 sentence AI vibe match description |

### Watchlist Routes *(Requires Authorization header)*
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET`    | `/api/watchlist` | Get all saved watchlist items for the authenticated user |
| `POST`   | `/api/watchlist` | Add a movie to watchlist |
| `DELETE` | `/api/watchlist/:movieId` | Remove a movie from watchlist by ID |

---

## ☁️ Deployment

### 1. Backend Deployment (Cloudflare Workers)

Deploy your backend using Wrangler:
```bash
cd feelm-server
npx wrangler deploy
```

#### Configuring Cloudflare Hyperdrive
1. Create a Hyperdrive configuration pointing to your PostgreSQL database:
   ```bash
   npx wrangler hyperdrive create feelm-db-hyperdrive --connection-string="postgres://user:password@host:5432/defaultdb"
   ```
2. Update `wrangler.jsonc` with your Hyperdrive ID:
   ```jsonc
   "hyperdrive": [
     {
       "binding": "HYPERDRIVE",
       "id": "<YOUR_HYPERDRIVE_ID>"
     }
   ]
   ```
3. Set production secrets in Cloudflare Workers:
   ```bash
   npx wrangler secret put JWT_SECRET
   npx wrangler secret put GEMINI_API_KEY
   npx wrangler secret put TMDB_API_KEY
   ```

### 2. Frontend Deployment (Vercel / Cloudflare Pages)

1. Connect your repository to [Vercel](https://vercel.com) or Cloudflare Pages.
2. Set Environment Variables:
   - `VITE_API_URL`: Your deployed Worker URL (e.g., `https://feelm-api.<your-subdomain>.workers.dev/api`)
   - `VITE_TMDB_API_KEY`: Your TMDB API Key
3. Build command: `npm run build`
4. Output directory: `dist`

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
