# 🧠 NeuroSketch — AI-Powered Mind Map Generator

<p align="center">
  <img src="https://img.shields.io/badge/Generative%20AI-Google%20Gemini-purple?style=for-the-badge&logo=google" />
  <img src="https://img.shields.io/badge/HTML5-Canvas-orange?style=for-the-badge&logo=html5" />
  <img src="https://img.shields.io/badge/CSS3-Glassmorphism-blue?style=for-the-badge&logo=css3" />
  <img src="https://img.shields.io/badge/JavaScript-ES2022-yellow?style=for-the-badge&logo=javascript" />
  <img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" />
</p>

> **College Project — Generative AI Course**  
> Transform any topic into an interactive, AI-generated mind map with concepts, connections, a narrative story, and a quiz — powered by Google Gemini 2.5 Flash.

---

## ✨ Live Demo

Simply open `index.html` in your browser — no server required!

---

## 🎯 Features

| Feature | Description |
|--------|-------------|
| 🧠 **AI Mind Map** | Gemini generates 7 concept nodes with descriptions, emoji, and connections |
| 🎨 **Interactive Canvas** | HTML5 Canvas animated mind map — drag to pan, scroll to zoom, click nodes |
| 📖 **AI Story** | AI-written 3-paragraph narrative weaving all concepts together |
| 🎓 **AI Quiz** | 4 multiple-choice questions with explanations, auto-scored |
| 📋 **Concept Cards** | Rich cards for each concept with fun facts and tags |
| 💾 **Export** | Download mind map as PNG image |
| 🔑 **Secure API Key** | Stored locally in browser, never sent to any server |

---

## 🚀 Getting Started

### Step 1 — Clone & Open

```bash
git clone https://github.com/YOUR_USERNAME/neurosketch.git
cd neurosketch
# Open index.html in your browser
```

### Step 2 — Get a Free Gemini API Key

1. Go to [**aistudio.google.com/app/apikey**](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account
3. Click **"Create API Key"**
4. Copy the key (starts with `AIza...`)

> **Free tier** — generous limits, no credit card required!

### Step 3 — Configure in App

1. Click **"Configure API Key"** at the top of the generator section
2. Paste your key and click **"Save Key"**
3. Your key is saved to `localStorage` — it stays on your device

### Step 4 — Generate!

Type any topic and hit **Generate**:
- `Artificial Intelligence`
- `Climate Change`
- `Quantum Mechanics`
- `The Renaissance`
- Literally anything! 🎯

---

## 🏗️ Architecture

```
neurosketch/
├── index.html      ← Single-page app structure (semantic HTML5)
├── styles.css      ← Full design system (glassmorphism, animations, responsive)
├── app.js          ← Application logic, API calls, Canvas renderer
└── README.md       ← This file
```

### How It Works

```
User Input (Topic)
      │
      ▼
Gemini API (REST POST)
   • Prompt engineering for structured JSON output
   • Temperature: 0.85 for creative but accurate output
      │
      ▼
JSON Response Parsing
   • 7 concept nodes
   • 4 quiz questions
   • 3-paragraph story
      │
      ┌──────┬──────┬──────┐
      ▼      ▼      ▼      ▼
  Canvas  Cards  Story  Quiz
  (HTML5) (DOM)  (DOM)  (DOM)
```

---

## 🎨 Tech Stack

| Technology | Usage |
|-----------|-------|
| **HTML5** | Semantic structure, Canvas API |
| **CSS3** | Glassmorphism, CSS variables, keyframe animations |
| **Vanilla JavaScript** | ES2022, Canvas 2D API, Fetch API |
| **Google Gemini 2.5 Flash** | JSON-structured concept generation, storytelling, quiz |
| **No frameworks** | Pure HTML/CSS/JS — zero dependencies |

---

## 🧪 Generative AI Integration

This project demonstrates several **Generative AI** techniques:

1. **Structured JSON Generation** — Prompt engineering forces Gemini to return valid JSON schema
2. **Multi-task generation** — Single API call produces mind map + story + quiz
3. **Creative Temperature** — `0.85` balances factual accuracy with creative output
4. **Prompt Engineering** — Role-based prompting ("You are an expert knowledge architect...")
5. **Output Parsing** — Robust JSON parsing with markdown code block stripping
6. **Chain of thought** — Concepts are interconnected, building coherent knowledge webs

---

## 📸 Screenshots

> The app features:
> - **Dark glassmorphism UI** with purple-cyan gradient palette
> - **Animated particle system** in the background
> - **Rotating demo mind map** on the hero section
> - **Interactive Canvas** with zoom/pan/click
> - **Tabbed results** (Mind Map / Concepts / Story / Quiz)

---

## 🔧 Customization

To change the AI behavior, edit `buildMindMapPrompt()` in `app.js`:

```javascript
// Change temperature for more/less creative output
generationConfig: { temperature: 0.85, maxOutputTokens: 3000 }

// Modify the prompt to generate more/fewer nodes
"Generate exactly 7 nodes"  // ← Change to 5 or 10
```

---

## 🛡️ Security & Privacy

- Your API key is stored **only in your browser's `localStorage`**
- No backend server — all API calls go directly from your browser to Google
- No data is logged or stored anywhere
- The key can be cleared with `localStorage.removeItem("neuro_api_key")`

---

## 📄 License

MIT License — free to use, modify, and distribute.

---

## 👤 Author

**[Your Name]** — Generative AI Course Project, 2026

---

<p align="center">
  Built with ❤️ using Google Gemini API · HTML5 Canvas · Vanilla JS
</p>
