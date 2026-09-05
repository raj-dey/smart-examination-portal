# 🎓 University Quiz Pro — Smart Examination Portal

[![Live Demo](https://img.shields.io/badge/Live_Demo-raj--dey.github.io-544bfa?style=for-the-badge&logo=githubpages&logoColor=white)](https://raj-dey.github.io/smart-examination-portal/)
[![React](https://img.shields.io/badge/React-19.2-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-7.3-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vite.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.2-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Firebase](https://img.shields.io/badge/Firebase-v12-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)](https://firebase.google.com/)
[![Google Gemini](https://img.shields.io/badge/Google_Gemini-2.5_Flash-4285F4?style=for-the-badge&logo=google-gemini&logoColor=white)](https://ai.google.dev/)

An enterprise-grade, role-based smart examination portal engineered for universities, academic institutions, and educators. Featuring proctored assessment environments, automated grading, Gemini AI quiz generation, and granular administrative controls.

---

## 🌐 Live Deployment

Access the production deployment directly here:

### 🔗 **[https://raj-dey.github.io/smart-examination-portal/](https://raj-dey.github.io/smart-examination-portal/)**

---

## 📑 Table of Contents

- [Core Highlights](#-core-highlights)
- [Role-Based Architecture](#-role-based-architecture)
  - [Student Portal](#1-student-portal)
  - [Teacher / Invigilator Portal](#2-teacher--invigilator-portal)
  - [Super Administrator Control Center](#3-super-administrator-control-center)
- [Proctoring & Anti-Cheat System](#-proctoring--anti-cheat-system)
- [AI Quiz Generation Engine](#-ai-quiz-generation-engine)
- [Technology Stack](#-technology-stack)
- [Project Architecture](#-project-architecture)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation & Setup](#installation--setup)
  - [Environment Variables](#environment-variables)
  - [Running Locally](#running-locally)
- [Deployment Guide](#-deployment-guide)
- [Author & Acknowledgments](#-author--acknowledgments)

---

## ⚡ Core Highlights

- **Role-Based Workflows**: Independent, secured dashboards for **Students**, **Teachers**, and **Super Administrators**.
- **Proctored Assessments**: Strict anti-cheat monitoring with automated tab-switch detection, time penalties, and strike management.
- **PIN-Protected Exams**: Assessments require randomized 6-digit invigilator PINs for academic integrity.
- **Gemini AI Generator**: Generates 10-question structured assessments in real-time for any subject using Google Gemini 2.5 Flash.
- **Real-Time Data Ledger**: Instantaneous submission grading and recording backed by Cloud Firestore.
- **Multi-Faculty Architecture**: Out-of-the-box support for 10 university faculties with auto-filtering across departments, semesters, and sections.

---

## 👥 Role-Based Architecture

### 1. Student Portal
- **Academic Verification**: Students verify their full legal name and university enrollment ID prior to unlocking any paper.
- **Dynamic Assessment Finder**: Filter available quizzes by Faculty, Department, Semester (1–8), and Section (A–E).
- **Interactive Exam Room**:
  - Live synchronized countdown timer.
  - Question status indicators (Answered, Bookmarked for Review, Skipped).
  - Instant automatic submission upon timer expiration.
- **Personal Analytics Dashboard**: Tracks total assessments taken, average performance percentage, and competency mastery tier (Beginner, Intermediate, Expert).

### 2. Teacher / Invigilator Portal
- **Assessment Builder**: Create custom quizzes specifying title, subject, duration, targeted department, semester, and section.
- **Automated PIN Generator**: Generates an invigilator-controlled 6-digit security access PIN for each quiz.
- **Dynamic Question Composer**: Add unlimited questions with customizable multiple-choice options and designated answer keys.
- **Live Submission Ledger**: Review real-time student scores, enrollment IDs, and exact submission timestamps.
- **Assessment Lifecycle Management**: Inspect question sets, monitor ongoing assessments, and archive/delete completed tests.

### 3. Super Administrator Control Center
- **Master Database Control**: High-privilege management panel to inspect all registered university records.
- **Global Multi-Tier Filter**: Search and filter assessments and student submissions across all faculties, departments, semesters, and subjects simultaneously.
- **Registered Accounts Directory**: Complete directory of student, educator, and administrator accounts with role inspection.
- **Supreme Purge Safeguards**: Secure deletion triggers with confirmation dialogs to maintain database hygiene.

---

## 🛡️ Proctoring & Anti-Cheat System

The platform integrates client-side proctoring safeguards:

| Threat / Action | Protection Mechanism | Penalty / Action |
| :--- | :--- | :--- |
| **Tab / Window Switching** | `visibilitychange` & `document.hidden` tracking | **30-second deduction** per incident + violation strike counter |
| **Context Menu Access** | `contextmenu` event interception | Right-click blocked across entire assessment window |
| **Copy / Cut Text** | `copy` & `cut` event suppression | Prohibits copying examination questions to clipboard |
| **Clipboard Pasting** | `paste` event suppression | Prohibits external input injection into answer fields |
| **Timer Depletion** | Real-time interval state verification | Automatic evaluation and immediate submission |

---

## 🤖 AI Quiz Generation Engine

Integrated directly with **Google Gemini 2.5 Flash**, the AI engine enables students to create practice tests on-demand:
1. Provide any academic topic (e.g., *"Quantum Computing"*, *"React Reconciliation"*, *"Biochemistry"*).
2. The engine sends a structured prompt enforcing strict JSON-schema responses.
3. Instantly parses and populates a 10-question multiple-choice interactive quiz with zero manual data entry.

---

## 🛠️ Technology Stack

```text
Frontend Framework  │ React 19 (Hooks, Context, Modular Architecture)
Build Tooling       │ Vite 7 (Lightning-fast HMR & Optimized Bundling)
Styling Engine      │ Tailwind CSS v4 + Vanilla CSS animations
Iconography         │ Lucide React (feather-style clean SVG icons)
Database & Auth     │ Google Firebase v12 (Firestore Realtime DB + Auth)
Artificial Intel    │ Google Gemini 2.5 Flash API
Alerts / Feedback   │ React Hot Toast with tailored glassmorphic styling
Deployment Target   │ GitHub Pages (gh-pages)
```

---

## 📂 Project Architecture

```text
uni-quiz-pro-x/
├── .github/
│   └── workflows/
│       └── deploy.yml            # GitHub Actions Pages deployment config
├── public/                       # Static public assets (Vite logo, etc.)
├── scripts/
│   └── cleanup-orphans.js        # Maintenance script for orphaned user records
├── src/
│   ├── components/
│   │   ├── AntiCheat.jsx         # Proctoring event listeners & violation handler
│   │   ├── Footer.jsx            # University-branded application footer
│   │   ├── Layout.jsx            # Authenticated persistent navigation wrapper
│   │   └── Navbar.jsx            # Dynamic header with profile & role badges
│   ├── utils/
│   │   └── toast.js              # Centralized, human-readable Firebase error parser
│   ├── views/
│   │   ├── AIQuizView.jsx        # Gemini AI quiz prompt & generation screen
│   │   ├── CreateQuiz.jsx        # Instructor assessment composition interface
│   │   ├── LandingPage.jsx       # Student/Teacher Authentication & Registration
│   │   ├── QuizInterface.jsx     # Proctored active exam viewport & scoring
│   │   ├── StudentDashboard.jsx  # Student catalog, metrics, & verification
│   │   ├── SuperAdminDashboard.jsx # Central database & records control center
│   │   └── TeacherDashboard.jsx  # Instructor management suite & results ledger
│   ├── App.jsx                   # Role-based route orchestrator
│   ├── firebase.js               # Firebase app initializers & resilient fallbacks
│   ├── gemini.js                 # Gemini 2.5 Flash REST client
│   ├── index.css                 # Global styles & design system tokens
│   └── main.jsx                  # Application entry point & global Toaster
├── .env.example                  # Environment configuration template
├── package.json                  # Dependencies, metadata, and scripts
└── vite.config.js                # Vite build configuration (base path, plugins)
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: `v18.0.0` or higher
- **npm**: `v9.0.0` or higher
- A **Firebase Project** with Authentication (Email/Password + Google Provider) and Cloud Firestore enabled.
- A **Google Gemini API Key** from [Google AI Studio](https://aistudio.google.com/).

### Installation & Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/raj-dey/smart-examination-portal.git
   cd smart-examination-portal
   ```

2. **Install project dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env` file in the project root by copying the template:
   ```bash
   cp .env.example .env
   ```

### Environment Variables

Populate your `.env` file with your credentials:

| Variable | Description | Example / Note |
| :--- | :--- | :--- |
| `VITE_FIREBASE_API_KEY` | Firebase Web API Key | `AIzaSy...` |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase Authentication Domain | `your-app.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | Firebase Project ID | `your-app-id` |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase Storage Bucket | `your-app.firebasestorage.app` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase Cloud Messaging Sender ID | `1234567890` |
| `VITE_FIREBASE_APP_ID` | Firebase Web App Identifier | `1:123456:web:abcd` |
| `VITE_FIREBASE_MEASUREMENT_ID` | Firebase Analytics ID (optional) | `G-XXXXXXXX` |
| `VITE_APP_ID` | Namespace key for Firestore collections | `univ-quiz-pro-v1` |
| `VITE_GEMINI_API_KEY` | Google Gemini API Key | From Google AI Studio |

### Running Locally

Start the Vite development server:
```bash
npm run dev
```
Open your browser and navigate to `http://localhost:5173`.

---

## 🚢 Deployment Guide

This project is pre-configured for one-command deployment to **GitHub Pages**:

```bash
npm run deploy
```

This executes:
1. `npm run build` — Compiles production assets into `/dist` using your local environment configuration.
2. `gh-pages -d dist` — Publishes the compiled bundle directly to the `gh-pages` branch on GitHub.

> [!IMPORTANT]
> **Firebase Domain Authorization**:
> When hosting on GitHub Pages, remember to whitelist your domain:
> 1. Go to [Firebase Console](https://console.firebase.google.com/) → **Authentication** → **Settings**.
> 2. Under **Authorized domains**, click **Add domain**.
> 3. Enter: `raj-dey.github.io` and click **Save**.

---

## 👨‍💻 Author & Acknowledgments

- **Lead Developer**: **Raj Dey**
- **Repository**: [raj-dey/smart-examination-portal](https://github.com/raj-dey/smart-examination-portal)
- **Live Portal**: [https://raj-dey.github.io/smart-examination-portal/](https://raj-dey.github.io/smart-examination-portal/)

---

<p align="center">
  <sub>Built with ❤️ for universities, educators, and students.</sub>
</p>
