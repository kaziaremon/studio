# Whiz Studio — Elite Digital Platform Management & High-Velocity Marketing Agency

![Whiz Studio Logo](public/assets/images/logo.png)

A world-class, ultra-modern web application engineered for **Whiz Studio** — a premier digital platform management and multi-channel marketing agency.

---

## 🌟 Key Architectural Highlights

1. **Global UI/UX & Theming**:
   - High-contrast bespoke dark-mode aesthetic utilizing deep slate, obsidian undertones, vibrant emerald green (`#00A86B`, `#00C853`), and sunset flame accents (`#FF5E1E`).
   - Dynamic HTML5 Canvas particle/neural node constellation with cursor repulsion and laser linking physics.
   - Glassmorphism frosted panels with 16px blur filters, neon glow borders, and fluid typography.

2. **Advanced 3D Tilt Services Grid**:
   - Interactive 3D perspective transforms with mouse-tracking Euler rotation and specular glare overlays.
   - High-end minimalist bespoke SVG icons for all 9 core services:
     1. **Facebook Marketing** (CAPI tracking, Lookalike models, Dynamic Creative Testing)
     2. **Instagram Marketing** (Reels viral scaling, Shoppable storefronts, Influencer syndication)
     3. **WhatsApp Marketing** (Official Cloud API, Automated CRM recovery funnels, 98% open rates)
     4. **YouTube Marketing** (Organic search ranking, high-retention scripts, CTR thumbnails)
     5. **Pinterest Marketing** (Visual discovery SEO, rich product pins, evergreen buyer traffic)
     6. **LinkedIn Marketing** (Enterprise B2B ABM targeting, C-Suite thought leadership)
     7. **Google Ads** (Performance Max, High-intent Search capture, Negative keyword fortress)
     8. **YouTube Ads** (Direct-response In-Stream hooks, Shorts video funnels)
     9. **Pinterest Ads** (Promoted Pins, high-AOV cart scaling, catalog shopping ads)

3. **Enterprise Platform Management & Live Command Center**:
   - Interactive command center featuring 4 live telemetry tabs:
     - *Cross-Platform Telemetry* (Real-time spend, ROAS, CPA, and live channel breakdown)
     - *CAPI & Health Security* (Server-side match quality and 24/7 policy shields)
     - *WhatsApp CRM Funnels* (Interactive sales bot simulation and checkout flows)
     - *Smart Budget Rebalancer* (Automated AI-assisted multi-channel budget matrix)

4. **Interactive Ad Spend & ROI Simulator**:
   - Live slider-based tool for prospective clients to calculate expected impressions, clicks, orders/leads, projected revenue, and estimated ROAS with celebratory confetti.

5. **Client Command Portal (Sign-In & Live Demo)**:
   - Interactive modal with guest demo mode and client authentication.
   - Creative approval board (1-click approval/revision of ad creatives) and dedicated strategist hotline.

6. **Modular Python FastAPI Backend**:
   - Full RESTful API with Pydantic v2 schemas, CORS middleware, background task notification dispatchers, Swagger docs (`/docs`), Docker configuration, and healthchecks (`/health`).

---

## 🚀 Quickstart & Local Development

### 1. Frontend Development (Vite + React)
```bash
# Navigate to the workspace root
cd "G:/Whiz Studio"

# Install dependencies (if not already installed)
npm install

# Launch the blazing-fast local development server
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) or [http://localhost:5173](http://localhost:5173) in your browser.

### 2. Python FastAPI Backend (Optional / Production)
```bash
# Navigate to the backend directory
cd "G:/Whiz Studio/backend"

# Create a virtual environment (optional)
python -m venv venv
source venv/bin/activate  # On Windows: .\venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run the FastAPI server with live reload
uvicorn main:app --reload --port 8000
```
API Documentation will be live at [http://localhost:8000/docs](http://localhost:8000/docs).

### 3. Docker Compose (1-Command Full-Stack Deployment)
```bash
docker-compose up --build
```

---

## 📁 Repository Structure

```
Whiz Studio/
├── backend/                  # Python FastAPI Backend
│   ├── routers/             # API Endpoints (contact, platform, calculator, auth)
│   ├── schemas/             # Pydantic validation schemas
│   ├── config.py            # Environment & CORS configuration
│   ├── main.py              # Application entrypoint & middleware
│   ├── requirements.txt     # Python dependencies
│   └── Dockerfile           # Backend container definition
├── public/                  # Static assets & transparent brand logos
│   ├── assets/images/       # High-res transparent logo.png
│   ├── logo.png
│   └── logo-placeholder.png
├── src/
│   ├── components/          # Modular React & UI components
│   │   ├── Navbar.jsx       # Frosted glass navbar & mobile drawer
│   │   ├── HeroCanvas.jsx   # Interactive canvas particle constellation
│   │   ├── Hero.jsx         # Hero section with live platform stream
│   │   ├── LivePlatformTicker.jsx # Trust metrics ticker
│   │   ├── ServiceIcons.jsx # Minimalist bespoke SVG platform icons
│   │   ├── ServiceCard.jsx  # 3D interactive tilt cards with glare
│   │   ├── ServiceDetailModal.jsx # Deep-dive service blueprint modal
│   │   ├── ServicesGrid.jsx # Filterable 9-service grid
│   │   ├── PlatformManagement.jsx # Command center & live telemetry
│   │   ├── RoiCalculator.jsx# Interactive ROI simulator
│   │   ├── ProcessSection.jsx # 4-Phase Scale Methodology
│   │   ├── CaseStudies.jsx  # Client proof of ROI
│   │   ├── FaqSection.jsx   # Accordion FAQ
│   │   ├── ContactSection.jsx # Growth audit booking form (FastAPI connected)
│   │   ├── ClientPortalModal.jsx # Client dashboard simulation & login
│   │   └── Footer.jsx       # Sophisticated footer & social routing
│   ├── data/
│   │   └── servicesData.js  # Rich data models & case studies
│   ├── App.jsx              # Master application layout
│   ├── index.css            # Tailwind directives & luxury design tokens
│   └── main.jsx             # React entrypoint
├── docker-compose.yml       # Production orchestration
├── Dockerfile.frontend      # Frontend production build
├── nginx.conf               # Web server & API reverse proxy configuration
├── package.json             # NPM dependencies & scripts
├── tailwind.config.js       # Custom Whiz Studio color palette & animations
└── vite.config.js           # Vite build & dev server config
```

---

## 🎨 Brand Identity

- **Primary Emerald Green**: `#00A86B` / `#00C853` (Derived from logo star/geometric mark)
- **Flame Accent Orange**: `#FF5E1E` / `#F97316` (Derived from logo streak element)
- **Dark Void Slate**: `#04070C` / `#070C14` / `#0B121E`

---

Built for **Whiz Studio** — Ready for custom domain connection and immediate deployment.
