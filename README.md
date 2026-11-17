<div align="center">

# MediGuard

### AI-Powered Medical Triage Companion

A full-stack health triage web application featuring a **liquid glass UI** with an animated WebGL background.
MediGuard helps users assess symptoms, measure vitals, scan skin conditions, analyze respiratory sounds, and generate doctor-ready reports — all powered by **Google Gemini AI**.

![License](https://img.shields.io/badge/license-MIT-blue)
![React](https://img.shields.io/badge/React-19-61dafb)
![Three.js](https://img.shields.io/badge/Three.js-WebGL-black)
![Vite](https://img.shields.io/badge/Vite-5-646cff)
![Express](https://img.shields.io/badge/Express-5-black)
![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-47a248)
![Gemini](https://img.shields.io/badge/Gemini-Flash_Lite-4285f4)

</div>

---

## Table of Contents

- [Features](#features)
- [How It Works](#how-it-works)
- [Design Philosophy](#design-philosophy)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [API Reference](#api-reference)
- [Configuration](#configuration)
- [Team Members](#team-members)
- [Disclaimer](#disclaimer)
- [License](#license)

---

## Features

### 🔐 Google OAuth Authentication

Users sign in securely with their Google account using the **Google Identity Services** library. On successful sign-in, the backend verifies the Google ID token, creates or retrieves the user record from MongoDB, and issues a **JWT** (valid for 30 days) that is stored in `localStorage`. All subsequent API calls are authenticated using this Bearer token via an `authMiddleware` guard on protected routes.

### 💬 AI Symptom Chat (Triage Engine)

An intelligent conversational interface that guides users through a structured medical interview before producing a triage recommendation.

**How it works:**
1. The user optionally sets a **patient profile** (age, sex, existing conditions, current medications) through a 4-step onboarding flow.
2. Messages are sent to the backend (`POST /api/triage/chat`), which forwards them to **Gemini Flash Lite** with a structured system prompt.
3. The AI asks focused follow-up questions about symptom **onset**, **severity (1–10 scale)**, **duration**, and **associated factors** — typically over 3–4 exchanges.
4. When sufficient information is gathered, the AI returns a **`<TRIAGE>` JSON block** embedded in its response. The frontend parses this automatically and stores the result.
5. The parsed triage data is persisted to MongoDB via `POST /api/triage/process`, creating a `Report` document linked to the authenticated user.

**Three-tier triage output:**

| Tier | Label | Meaning |
|------|-------|---------|
| 1 | **GO TO ER NOW** | Immediate emergency care required |
| 2 | **SEE DOCTOR (24–48 hrs)** | Non-emergency but needs professional evaluation |
| 3 | **MANAGE AT HOME** | Self-care with monitoring guidance |

Each result includes: confidence level (`high` / `moderate` / `low`), top contributing symptoms, plain-language explanation, and caveats about what the system cannot assess.

### 🔴 Emergency Red-Flag Detection

A real-time safety layer that **intercepts every chat message before it is sent to the AI**. The frontend scans user input against a list of life-threatening keyword groups. If a match is found, the message is blocked and a **full-screen emergency modal** appears immediately with:

- Clear identification of the emergency type
- A direct one-tap `tel:911` call button
- A dismiss option for false positives

Monitored keywords include: chest pain, difficulty breathing, stroke symptoms, unconsciousness, seizures, and severe bleeding. This check runs entirely on the **client side** so there is zero latency.

### 📸 Skin & Wound Scanner

A guided camera capture flow for dermatological assessment.

**How it works:**
1. The user opens the camera feed directly in the browser using `navigator.mediaDevices.getUserMedia`.
2. On-screen tips cycle through positioning, lighting, stability, and framing guidance while a **visual alignment overlay** with corner brackets helps frame the shot.
3. The user captures a frame; the frame is drawn to an off-screen `<canvas>`, converted to a JPEG `Blob`, and uploaded as `multipart/form-data` to `POST /api/scans/upload`.
4. The backend uses **Multer** to receive the file and passes it to **Gemini Flash Lite** (via `@google/generative-ai`) as a base64-encoded inline image with a dermatology-specific prompt.
5. Gemini returns a JSON object with `label`, `confidence`, `action`, and `explanation` fields.
6. The result is saved as a `Scan` document in MongoDB and returned to the frontend, which renders it with a **scanning laser-line animation** before revealing the analysis.

Supports: skin rashes, open wounds, swelling, and mole changes.

### 📊 Vital Signs Monitor

A camera-based vital signs measurement system using **photoplethysmography (PPG)** principles.

**How it works:**
1. The user places their fingertip over the camera lens.
2. The frontend accesses the rear camera and samples frames from the video stream, detecting subtle changes in pixel brightness caused by blood flow pulsing through capillaries.
3. The system processes these light-intensity variations over time to extract pulse frequency (**Heart Rate in BPM**) and estimates **Respiratory Rate** from breathing-linked amplitude modulation.
4. Results are shown with animated **progress rings** during the measurement window and **visual waveform displays** after completion with normal/low/elevated classification.
5. Vital readings are submitted to `POST /api/vitals` and stored as `Vital` documents (with `heartRate` and `respiratoryRate`) in MongoDB.

### 🎙️ Cough & Breath Sound Analysis

A 10-second microphone recording feature that classifies respiratory sounds using AI.

**How it works:**
1. The frontend requests microphone access via `navigator.mediaDevices.getUserMedia({ audio: true })` and creates a `MediaRecorder` instance.
2. Audio chunks are collected over a 10-second window (with a live progress bar) then assembled into a single `audio/webm` Blob.
3. The Blob is uploaded via `multipart/form-data` to `POST /api/vitals` alongside any HR/RR readings already measured.
4. The backend sends the audio file to **Gemini Flash Lite** as a base64-encoded inline audio part with a respiratory analysis prompt.
5. Gemini returns a JSON classification with `type`, `severity`, and `detail` fields.
6. The analysis is saved with the `Vital` document and returned to the frontend.

Recognized classifications: **Dry Cough**, **Wet Cough**, **Wheezing** — each with severity rating and actionable advice.

### 📄 Doctor Report Generator

A one-tap shareable medical summary compiled from all data collected in the current session.

**What the report includes:**
- Patient demographics (age, sex, known conditions, medications)
- Triage assessment: tier, confidence level, explanation, and caveats
- Vital signs readings with normal range comparison
- Skin scan results (condition label, confidence, recommended action)
- Respiratory sound analysis findings
- Full conversation history with the AI
- Timestamp and medical disclaimer

The report is designed to be printed or shared with a healthcare provider before or during a consultation. Users can share it directly using the native `navigator.share` API (falls back to clipboard copy).

### 📅 Follow-Up Reminders

An automated symptom check-in system with three scheduled touchpoints:

| When | Label | Prompt |
|------|-------|--------|
| **6 hours** | Early Check | "How are you feeling compared to earlier? Better, same, or worse?" |
| **24 hours** | Next Day Check | "Did your symptoms improve overnight? Any new symptoms?" |
| **48 hours** | 48hr Follow-Up | "Has your condition resolved or are you still experiencing symptoms?" |

Users can respond to each reminder and add free-text notes, creating a **symptom progression timeline** that can be included in the doctor report.

### 🕒 Medical History

A persistent history screen that fetches the user's past records from the backend on login:
- **Triage Reports** — previous AI triage assessments with dates and explanations
- **Skin Scans** — past scan results with condition labels, confidence scores, and recommended actions

Data is fetched in parallel via `Promise.all` on two authenticated API calls and displayed in a responsive two-column grid.

---

## How It Works

```
User → Google Sign-In → JWT issued → App unlocked
  │
  ├─ Chat → Backend (Gemini Flash Lite) → Triage JSON → MongoDB Report
  ├─ Camera → Capture Frame → Backend (Gemini Vision) → Scan Result → MongoDB Scan
  ├─ Vitals → Camera PPG → Backend → MongoDB Vital
  ├─ Audio → MediaRecorder → Backend (Gemini Audio) → Classification → MongoDB Vital
  └─ Report → Compile all session data → Share / Print
```

---

## Design Philosophy

### Liquid Glass Theme

The interface uses a **dark glassmorphism** aesthetic where every panel, card, and button is a frosted glass surface. Semi-transparent backgrounds with `backdrop-filter: blur()` create depth and layering, while subtle white border highlights and inset shadows simulate light refraction on glass edges.

### Animated WebGL Background

Behind the glass UI sits a full-screen **Three.js canvas** rendering animated floating wave lines through custom GLSL fragment shaders. The lines respond to mouse movement with bend and parallax effects, creating a living, breathing backdrop that reinforces the health-tech aesthetic.

### Responsive Layout

- **Desktop (1024px+)** — Fixed sidebar navigation with scrollable content area
- **Mobile** — Bottom tab navigation with compact card layouts

### Typography and Motion

- **DM Sans** for UI text — clean, geometric, highly readable
- **Playfair Display** for headings — elegant serif for a premium feel
- Micro-animations throughout: fade-ups, heart pulse, scan lines, wave bars, and smooth hover state transitions

---

## Tech Stack

### Frontend

| Technology | Version | Purpose |
|---|---|---|
| **React** | 19 | Component-based UI architecture |
| **Vite** | 5 | Lightning-fast dev server and production bundler |
| **Three.js** | 0.183 | WebGL-powered animated background with custom GLSL shaders |
| **@react-oauth/google** | 0.13 | Google Identity Services integration for OAuth login |
| **jwt-decode** | 4 | Decoding JWT tokens on the client |
| **react-router-dom** | 7 | Client-side routing |
| **Tailwind CSS** | 4 | Utility-first CSS (via Vite plugin) |
| **Vanilla CSS** | — | Glassmorphism effects, keyframe animations, utility classes |
| **Google Fonts** | — | DM Sans and Playfair Display typography |

### Backend

| Technology | Version | Purpose |
|---|---|---|
| **Node.js** | ≥ 18 | Runtime environment |
| **Express** | 5 | HTTP server and REST API framework |
| **MongoDB + Mongoose** | 9.6 | NoSQL database and ODM for persistent storage |
| **@google/generative-ai** | 0.24 | Gemini Flash Lite SDK for AI features |
| **google-auth-library** | 10 | Verifying Google ID tokens (OAuth) |
| **jsonwebtoken** | 9 | Issuing and verifying JWTs |
| **Multer** | 2 | Multipart file uploads (images and audio) |
| **dotenv** | 17 | Environment variable management |
| **cors** | 2.8 | Cross-origin request handling |
| **nodemon** | 3 | Dev server auto-reload |

### AI Model

| Model | Usage |
|---|---|
| **Gemini Flash Lite** (`gemini-flash-lite-latest`) | Symptom triage chat, skin scan analysis (vision), cough/audio classification |

---

## Architecture

```
MediGuard/
├── MEDIGUARD-main/          # Frontend (React + Vite)
│   └── src/
│       ├── App.jsx          # All screens, state, and business logic
│       ├── App.css          # Global styles, glassmorphism, animations
│       ├── FloatingLines.jsx  # Three.js WebGL animated background
│       ├── FloatingLines.css  # Canvas positioning
│       ├── index.css        # Base resets
│       ├── main.jsx         # React root + GoogleOAuthProvider
│       └── assets/          # Static assets (landing_bg.jpg, icons)
│
└── backend/                 # Backend (Express + MongoDB)
    ├── server.js            # App entry — Express setup, route mounting
    ├── config/
    │   ├── db.js            # MongoDB connection (Mongoose)
    │   └── multer.js        # File upload configuration
    ├── middleware/
    │   └── authMiddleware.js  # JWT verification guard
    ├── models/
    │   ├── User.js          # User schema (googleId, email, name, picture)
    │   ├── Report.js        # Triage report schema (triageData, messages)
    │   ├── Scan.js          # Skin scan schema (imagePath, analysis)
    │   └── Vital.js         # Vitals schema (heartRate, respiratoryRate, audioPath)
    ├── controllers/
    │   ├── authController.js    # Google token verification + JWT issuance
    │   ├── triageController.js  # AI chat relay + report persistence
    │   ├── scanController.js    # Image upload + Gemini vision analysis
    │   └── vitalController.js   # Vital saving + audio upload + AI analysis
    ├── routes/
    │   ├── authRoutes.js        # POST /api/auth/google
    │   ├── triageRoutes.js      # POST /api/triage/chat, /process; GET /api/triage
    │   ├── scanRoutes.js        # POST /api/scans/upload; GET /api/scans
    │   └── vitalRoutes.js       # POST /api/vitals; GET /api/vitals
    └── services/
        └── aiService.js         # Gemini SDK wrappers (analyzeSkinScan, generateTriage, analyzeCoughAudio)
```

---

## Getting Started

### Prerequisites

- **Node.js** >= 18
- **npm** >= 9
- **MongoDB** (local instance or MongoDB Atlas connection string)
- **Google Cloud Project** with OAuth 2.0 Client ID enabled
- **Gemini API Key** (free tier works with Flash Lite)

### Installation

```bash
# Clone the repository
git clone https://github.com/VEER1205/MediGuard.git
cd MediGuard
```

#### Backend

```bash
cd backend

# Install dependencies
npm install

# Create .env file (see Configuration section)
# Start development server
npm run dev
```

The API will be available at **http://localhost:5000**

#### Frontend

```bash
cd MEDIGUARD-main

# Install dependencies
npm install --legacy-peer-deps

# Start development server
npm run dev
```

The app will be available at **http://localhost:5173**

### Build for Production

```bash
# Frontend
cd MEDIGUARD-main
npm run build
npm run preview

# Backend
cd backend
npm start
```

---

## API Reference

All routes under `/api/scans`, `/api/vitals`, and `/api/triage` require a valid `Authorization: Bearer <token>` header.

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| `POST` | `/api/auth/google` | ❌ | Verify Google credential, return JWT + user |
| `POST` | `/api/triage/chat` | ✅ | Relay messages to Gemini, return AI response |
| `POST` | `/api/triage/process` | ✅ | Persist final triage result as a Report |
| `GET` | `/api/triage` | ✅ | Fetch all triage reports for the current user |
| `POST` | `/api/scans/upload` | ✅ | Upload skin image, run Gemini vision analysis |
| `GET` | `/api/scans` | ✅ | Fetch all skin scan results for the current user |
| `POST` | `/api/vitals` | ✅ | Save vitals + optional audio for AI analysis |
| `GET` | `/api/vitals` | ✅ | Fetch all vital readings for the current user |

---

## Configuration

### Backend `.env`

```env
PORT=5000
FRONTEND_URL=http://localhost:5173

# MongoDB
MONGO_URI=mongodb://localhost:27017/mediguard

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id_here

# JWT
JWT_SECRET=your_jwt_secret_here

# Gemini AI
GEMINI_API_KEY=your_gemini_api_key_here
```

### FloatingLines Background Props

The `FloatingLines` component (Three.js WebGL canvas) accepts the following props:

| Prop | Type | Default | Description |
|---|---|---|---|
| `linesGradient` | `string[]` | — | Array of hex color codes for the line gradient |
| `enabledWaves` | `string[]` | `['top', 'middle', 'bottom']` | Which wave layer groups to render |
| `lineCount` | `number \| number[]` | `[6]` | Number of lines per wave group |
| `lineDistance` | `number \| number[]` | `[5]` | Spacing between lines in each group |
| `animationSpeed` | `number` | `1` | Global speed multiplier for wave animation |
| `interactive` | `boolean` | `true` | Enable cursor-based line bending |
| `bendRadius` | `number` | `5.0` | Radius of the mouse influence area |
| `bendStrength` | `number` | `-0.5` | Intensity of the line bend near cursor |
| `parallax` | `boolean` | `true` | Enable parallax offset on mouse move |
| `parallaxStrength` | `number` | `0.2` | Intensity of the parallax effect |
| `mouseDamping` | `number` | `0.05` | Smoothing factor for mouse tracking (lower = smoother) |

---


## Disclaimer

MediGuard is a **prototype application** built for educational and demonstration purposes. It does **not** provide real medical diagnoses, and its recommendations should **never** replace professional medical advice. Always consult a qualified healthcare provider for any health concerns.

---

## License

This project is licensed under the **MIT License**. See the [LICENSE](LICENSE) file for details.
