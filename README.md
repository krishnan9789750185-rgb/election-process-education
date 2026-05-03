# ElectIQ — Interactive Election Process Education Platform

> An AI-powered, interactive web application that helps users understand the democratic election process through guided timelines, role-based simulations, gamified quizzes, and conversational AI.

![Version](https://img.shields.io/badge/version-1.0.0-6C63FF)
![License](https://img.shields.io/badge/license-MIT-00D4AA)
![Google](https://img.shields.io/badge/Google_Services-Integrated-FFB347)

## 🌟 Features

### 🤖 AI Election Assistant
- Conversational chatbot powered by **Google Gemini API**
- Ask any question about elections, voting rights, or democratic processes
- Context-aware responses with conversation history
- Suggested questions for quick exploration

### 📋 Interactive Timeline
- 10-step visual guide through the complete election process
- Expandable details with key facts for each step
- Scroll-based animations and progress tracking
- Persistent progress saved to localStorage

### 🎭 Role-Based Simulator
- Three unique perspectives: **Voter**, **Candidate**, **Election Officer**
- Branching decision scenarios with scoring
- Detailed results breakdown with optimal choice analysis
- Replayable with different choices

### 🧠 Knowledge Quiz
- 15 curated questions across 6 categories
- Timed responses with countdown timer
- Streak tracking and difficulty indicators
- Detailed results with explanations

### 📊 Election Data Visualization
- **Google Charts** integration for real election data
- Voter turnout trends and electoral systems comparison
- Interactive, responsive charts

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | HTML5, CSS3, Vanilla JavaScript (ES Modules) |
| AI | Google Gemini API (gemini-2.0-flash) |
| Charts | Google Charts |
| Fonts | Google Fonts (Inter, Plus Jakarta Sans) |
| Storage | localStorage (client-side persistence) |

## 🚀 Getting Started

### Prerequisites
- Modern web browser (Chrome, Firefox, Edge, Safari)
- [Google Gemini API Key](https://aistudio.google.com/apikey) (free tier available)

### Quick Start

1. **Clone the repository:**
   ```bash
   git clone https://github.com/krishnan9841226883-design/election-process-education.git
   cd election-process-education
   ```

2. **Serve locally** (any static server):
   ```bash
   npx serve .
   ```

3. **Open** `http://localhost:3000` in your browser

4. **Enter your Gemini API key** in the AI Assistant section

### Project Structure
```
election-process-education/
├── index.html              # Main application page
├── css/
│   ├── index.css           # Design system & tokens
│   ├── components.css      # Component styles
│   └── animations.css      # Animation keyframes
├── js/
│   ├── app.js              # Main controller & bootstrap
│   ├── constants.js        # All static data & config
│   ├── security.js         # XSS prevention & CSP
│   ├── utils.js            # DOM helpers & utilities
│   ├── accessibility.js    # ARIA, focus, keyboard nav
│   ├── assistant.js        # Gemini AI chat module
│   ├── timeline.js         # Election timeline module
│   ├── simulator.js        # Role simulator module
│   ├── quiz.js             # Quiz engine module
│   ├── firebase-config.js  # Firebase Auth, Firestore, Analytics
│   ├── google-services.js  # Maps, Calendar, Translate
│   ├── env.js              # Environment config (gitignored)
│   └── env.example.js      # Environment config template
├── tests/
│   ├── test.html           # Test runner
│   └── tests.js            # Unit test suite (90+ tests)
├── firestore.rules         # Firestore security rules
├── nginx.conf              # Production server config
├── Dockerfile              # Container deployment
├── manifest.json           # PWA manifest
└── README.md
```

## 🔒 Security

- **XSS Prevention**: All user input is escaped and sanitized
- **Content Security Policy**: Enforced via meta tag and nginx headers (defense-in-depth)
- **Rate Limiting**: API calls are rate-limited to prevent abuse
- **Input Validation**: Length limits, type checking, pattern matching
- **No Inline Scripts**: All JS is in external ES modules
- **API Key Separation**: Keys isolated in `env.js` (gitignored), template provided as `env.example.js`
- **Firestore Rules**: Per-collection access control (see `firestore.rules`)
- **Security Headers**: X-Frame-Options, HSTS, Permissions-Policy, X-XSS-Protection

## ♿ Accessibility

- **WCAG 2.1 AA** compliant design
- Full keyboard navigation with arrow key support
- Skip-to-content link
- ARIA labels, roles, and live regions
- Screen reader announcements for dynamic content
- High contrast mode toggle (Alt+1)
- Font size adjustment (Alt++, Alt+-)
- Reduced motion support via `prefers-reduced-motion`
- Focus trap for modal interactions
- Semantic HTML5 structure

## 🧪 Testing

Open `tests/test.html` in a browser to run the test suite (90+ tests). Tests cover:

- **Security**: HTML escaping, sanitization (quoted/unquoted handlers), input validation, rate limiting, CSP constants
- **Utilities**: Score formatting, ID generation, DOM helpers, storage, toasts
- **Constants**: Data integrity for all 10+ constant objects, structure validation, frozen state
- **Google Services**: Calendar URL generation, Translate config, Maps config
- **Accessibility**: DOM structure, ARIA attributes

## 📦 Google Services Integration

| Service | Usage |
|---------|-------|
| **Google Gemini AI** | Conversational election education assistant with contextual chat |
| **Google Charts** | Voter turnout trends & electoral systems visualization |
| **Google Maps Platform** | Polling station finder with search via Maps Embed API |
| **Google Calendar** | Add election dates to Google Calendar with one click |
| **Google Translate** | Multi-language support (17+ languages) via Translate widget |
| **Firebase Auth** | Anonymous auth + Google Sign-In for persistent identity |
| **Firebase Firestore** | Quiz scores, leaderboard, user progress, simulator results, feedback |
| **Firebase Analytics** | Event tracking for user interactions and engagement |
| **Google Fonts** | Inter & Plus Jakarta Sans premium typography |
| **Google Cloud Run** | Production deployment via Docker container |

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.
