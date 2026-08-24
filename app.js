/* ==============================================
   NeuroSketch – Main Application Logic
   Uses Google Gemini 1.5 Flash API
   ================================================ */

"use strict";

// ─── State ───────────────────────────────────────────
const state = {
  apiKey: localStorage.getItem("neuro_api_key") || "",
  currentTopic: "",
  mindMapData: null,
  canvas: { scale: 1, offsetX: 0, offsetY: 0, dragging: false, lastX: 0, lastY: 0 },
  quizAnswers: {},
  quizScore: 0,
  quizTotal: 0,
};

// ─── Color Palettes ───────────────────────────────────
const NODE_COLORS = [
  { bg: "#a855f7", glow: "rgba(168,85,247,0.4)", text: "#fff" },
  { bg: "#06b6d4", glow: "rgba(6,182,212,0.4)", text: "#fff" },
  { bg: "#6366f1", glow: "rgba(99,102,241,0.4)", text: "#fff" },
  { bg: "#ec4899", glow: "rgba(236,72,153,0.4)", text: "#fff" },
  { bg: "#f59e0b", glow: "rgba(245,158,11,0.4)", text: "#000" },
  { bg: "#22c55e", glow: "rgba(34,197,94,0.4)", text: "#fff" },
  { bg: "#ef4444", glow: "rgba(239,68,68,0.4)", text: "#fff" },
  { bg: "#14b8a6", glow: "rgba(20,184,166,0.4)", text: "#fff" },
];

const CARD_GRADIENTS = [
  "linear-gradient(135deg, #a855f7, #8b5cf6)",
  "linear-gradient(135deg, #06b6d4, #0891b2)",
  "linear-gradient(135deg, #6366f1, #4f46e5)",
  "linear-gradient(135deg, #ec4899, #db2777)",
  "linear-gradient(135deg, #f59e0b, #d97706)",
  "linear-gradient(135deg, #22c55e, #16a34a)",
  "linear-gradient(135deg, #ef4444, #dc2626)",
  "linear-gradient(135deg, #14b8a6, #0d9488)",
];

const EMOJIS = ["🧠", "⚡", "🌊", "🔥", "🌟", "🎯", "🔬", "💡", "🌀", "🎭", "🔮", "🌍"];

// ─── Gemini API ────────────────────────────────────────
function setApiKey(key) {
  state.apiKey = key;
  localStorage.setItem("neuro_api_key", key);
}

async function callGemini(prompt) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${state.apiKey}`;
  const body = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.85, maxOutputTokens: 3000 },
    safetySettings: [
      { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_ONLY_HIGH" },
      { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_ONLY_HIGH" },
      { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_ONLY_HIGH" },
      { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_ONLY_HIGH" },
    ],
  };

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err?.error?.message || "Gemini API error");
  }

  const data = await response.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
}

// ─── Prompt Builder ─────────────────────────────────────
function buildMindMapPrompt(topic) {
  return `You are an expert knowledge architect. Generate a comprehensive mind map for the topic: "${topic}".

Return ONLY valid JSON (no markdown, no code fences, no explanation) in this exact structure:
{
  "topic": "${topic}",
  "tagline": "A catchy 8-10 word tagline about this topic",
  "centralEmoji": "one relevant emoji for the topic",
  "nodes": [
    {
      "id": "node_1",
      "name": "Concept Name",
      "emoji": "🔬",
      "type": "Foundation",
      "description": "A clear 2-3 sentence description of this concept in relation to ${topic}. Make it educational and engaging.",
      "connections": ["Related Concept A", "Related Concept B", "Related Concept C"],
      "funFact": "One surprising or lesser-known fact about this concept"
    }
  ],
  "story": "Write a compelling 3-paragraph narrative essay (250-300 words total) that weaves together all the concepts to explain ${topic} in a storytelling style. Each paragraph should be separated and educational.",
  "quiz": [
    {
      "question": "An interesting question about ${topic}?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct": 0,
      "explanation": "Why this answer is correct and what we learn from it."
    }
  ]
}

Rules:
- Generate exactly 7 nodes
- Generate exactly 4 quiz questions with correct index (0-3)
- Each node must have 3 connections
- Story must have exactly 3 paragraphs separated by newlines
- Make content accurate, educational, and engaging
- Vary the emoji for each node (use relevant ones)
- Do NOT wrap in markdown code blocks
- Return raw JSON only`;
}

// ─── Main Generation Flow ─────────────────────────────
async function generateMindMap(topic) {

  state.currentTopic = topic;

  // Show loading
  document.getElementById("loadingState").style.display = "block";
  document.getElementById("resultsArea").style.display = "none";
  document.getElementById("generateBtn").disabled = true;

  // Animate steps
  animateLoadingSteps();

  try {
    const rawText = await callGemini(buildMindMapPrompt(topic));
    if (!rawText) return;

    // Parse JSON — handle potential markdown wrapping
    let jsonText = rawText.trim();
    jsonText = jsonText.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```\s*$/i, "").trim();

    const data = JSON.parse(jsonText);
    state.mindMapData = data;

    // Assign colors
    data.nodes.forEach((node, i) => {
      node.color = NODE_COLORS[i % NODE_COLORS.length];
      node.gradient = CARD_GRADIENTS[i % CARD_GRADIENTS.length];
    });

    // Render results
    renderResults(data);

    document.getElementById("loadingState").style.display = "none";
    document.getElementById("resultsArea").style.display = "block";
    document.getElementById("mapTopicLabel").textContent = `Topic: ${data.topic}`;

    showToast("✨ Mind map generated successfully!", "success");
  } catch (err) {
    document.getElementById("loadingState").style.display = "none";
    console.error("Generation error:", err);
    showToast(`❌ Error: ${err.message}`, "error");
  } finally {
    document.getElementById("generateBtn").disabled = false;
    stopLoadingSteps();
  }
}

// ─── Loading Steps Animation ───────────────────────────
let loadingInterval = null;
let currentStep = 0;

function animateLoadingSteps() {
  currentStep = 0;
  ["step1", "step2", "step3", "step4"].forEach((id) => {
    const el = document.getElementById(id);
    el.classList.remove("active", "done");
  });
  document.getElementById("step1").classList.add("active");

  const msgs = [
    ["Analyzing topic…", "Gemini is understanding your concept"],
    ["Generating concepts…", "Creating rich node descriptions"],
    ["Building connections…", "Mapping relationships between ideas"],
    ["Crafting narrative…", "Writing your AI-generated story"],
  ];

  let step = 0;
  loadingInterval = setInterval(() => {
    const stepIds = ["step1", "step2", "step3", "step4"];
    if (step > 0) {
      document.getElementById(stepIds[step - 1]).classList.remove("active");
      document.getElementById(stepIds[step - 1]).classList.add("done");
    }
    if (step < stepIds.length) {
      document.getElementById(stepIds[step]).classList.add("active");
      document.getElementById("loadingTitle").textContent = msgs[step][0];
      document.getElementById("loadingSubtitle").textContent = msgs[step][1];
      step++;
    }
  }, 1400);
}

function stopLoadingSteps() {
  if (loadingInterval) clearInterval(loadingInterval);
}

// ─── Render Results ────────────────────────────────────
function renderResults(data) {
  renderMindMapCanvas(data);
  renderConceptCards(data);
  renderStory(data);
  renderQuiz(data);
}

// ═══════════════════════════════════════════════════════
//  MIND MAP CANVAS RENDERER
// ═══════════════════════════════════════════════════════
let animationFrameId = null;
let nodePositions = [];

function renderMindMapCanvas(data) {
  const container = document.getElementById("mindmapContainer");
  const canvas = document.getElementById("mindmapCanvas");
  const ctx = canvas.getContext("2d");

  // Set canvas resolution
  const dpr = window.devicePixelRatio || 1;
  canvas.width = container.clientWidth * dpr;
  canvas.height = container.clientHeight * dpr;
  canvas.style.width = container.clientWidth + "px";
  canvas.style.height = container.clientHeight + "px";
  ctx.scale(dpr, dpr);

  const W = container.clientWidth;
  const H = container.clientHeight;
  const cx = W / 2;
  const cy = H / 2;
  const radius = Math.min(W, H) * 0.34;

  // Compute node positions
  nodePositions = [];
  const n = data.nodes.length;
  for (let i = 0; i < n; i++) {
    const angle = (2 * Math.PI * i) / n - Math.PI / 2;
    nodePositions.push({
      x: cx + radius * Math.cos(angle),
      y: cy + radius * Math.sin(angle),
      node: data.nodes[i],
      animated: false,
      animProgress: 0,
    });
  }

  // Animation state
  let animStart = null;
  state.canvas.scale = 1;
  state.canvas.offsetX = 0;
  state.canvas.offsetY = 0;

  if (animationFrameId) cancelAnimationFrame(animationFrameId);

  function draw(timestamp) {
    if (!animStart) animStart = timestamp;
    const elapsed = timestamp - animStart;

    ctx.clearRect(0, 0, W, H);
    ctx.save();
    ctx.translate(state.canvas.offsetX, state.canvas.offsetY);
    ctx.scale(state.canvas.scale, state.canvas.scale);

    // Draw connections (lines from center to each node)
    nodePositions.forEach((np, i) => {
      const progress = Math.min(1, (elapsed - i * 80) / 600);
      if (progress <= 0) return;

      const endX = cx + (np.x - cx) * easeOutCubic(progress);
      const endY = cy + (np.y - cy) * easeOutCubic(progress);

      // Gradient line
      const lineGrad = ctx.createLinearGradient(cx, cy, endX, endY);
      lineGrad.addColorStop(0, np.node.color.glow);
      lineGrad.addColorStop(1, "rgba(255,255,255,0.05)");

      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(endX, endY);
      ctx.strokeStyle = lineGrad;
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.globalAlpha = 0.6;
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;
    });

    // Draw central node
    const centralProgress = Math.min(1, elapsed / 400);
    if (centralProgress > 0) {
      drawCentralNode(ctx, cx, cy, data, easeOutCubic(centralProgress));
    }

    // Draw outer nodes
    nodePositions.forEach((np, i) => {
      const delay = 200 + i * 80;
      const progress = Math.min(1, (elapsed - delay) / 500);
      if (progress <= 0) return;
      const p = easeOutCubic(progress);
      drawNode(ctx, np.x, np.y, np.node, p);
    });

    animationFrameId = requestAnimationFrame(draw);
  }

  animationFrameId = requestAnimationFrame(draw);

  // Canvas interactions
  setupCanvasInteractions(canvas, ctx, data, W, H, cx, cy);
}

function drawCentralNode(ctx, x, y, data, progress) {
  const r = 55 * progress;
  if (r <= 0) return;

  // Glow
  const glow = ctx.createRadialGradient(x, y, 0, x, y, r * 2.5);
  glow.addColorStop(0, "rgba(168,85,247,0.3)");
  glow.addColorStop(1, "transparent");
  ctx.beginPath();
  ctx.arc(x, y, r * 2.5, 0, Math.PI * 2);
  ctx.fillStyle = glow;
  ctx.fill();

  // Outer ring
  ctx.beginPath();
  ctx.arc(x, y, r + 6, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(168,85,247,0.4)";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Inner ring
  ctx.beginPath();
  ctx.arc(x, y, r + 2, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(168,85,247,0.6)";
  ctx.lineWidth = 1;
  ctx.stroke();

  // Circle background
  const grad = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, 0, x, y, r);
  grad.addColorStop(0, "#8b5cf6");
  grad.addColorStop(1, "#4c1d95");
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = grad;
  ctx.fill();

  // Emoji
  ctx.font = `${28 * progress}px serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(data.centralEmoji || "🧠", x, y - 10 * progress);

  // Text
  ctx.font = `bold ${11 * progress}px Outfit, sans-serif`;
  ctx.fillStyle = "rgba(255,255,255,0.9)";
  const words = data.topic.split(" ");
  let topicDisplay = words.slice(0, 2).join(" ");
  if (words.length > 2) topicDisplay += "…";
  ctx.fillText(topicDisplay, x, y + 20 * progress);
}

function drawNode(ctx, x, y, node, progress) {
  const r = 38 * progress;
  if (r <= 0) return;

  // Glow
  const glow = ctx.createRadialGradient(x, y, 0, x, y, r * 2.5);
  glow.addColorStop(0, node.color.glow);
  glow.addColorStop(1, "transparent");
  ctx.beginPath();
  ctx.arc(x, y, r * 2, 0, Math.PI * 2);
  ctx.fillStyle = glow;
  ctx.globalAlpha = progress * 0.7;
  ctx.fill();
  ctx.globalAlpha = 1;

  // Shadow
  ctx.shadowColor = node.color.glow;
  ctx.shadowBlur = 20 * progress;

  // Background circle
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  const grad = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, 0, x, y, r);
  grad.addColorStop(0, node.color.bg);
  grad.addColorStop(1, darkenColor(node.color.bg, 0.6));
  ctx.fillStyle = grad;
  ctx.fill();

  ctx.shadowBlur = 0;

  // Emoji
  ctx.font = `${18 * progress}px serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(node.emoji || "✦", x, y - 8 * progress);

  // Node name below
  ctx.font = `${9 * progress}px Outfit, sans-serif`;
  ctx.fillStyle = "rgba(255,255,255,0.9)";
  const maxChars = 12;
  let label = node.name.length > maxChars ? node.name.substring(0, maxChars) + "…" : node.name;
  ctx.fillText(label, x, y + 9 * progress);

  // Outer ring pulse
  ctx.beginPath();
  ctx.arc(x, y, r + 4, 0, Math.PI * 2);
  ctx.strokeStyle = `${node.color.bg}55`;
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

function darkenColor(hex, factor) {
  const num = parseInt(hex.slice(1), 16);
  const r = Math.round((num >> 16) * factor);
  const g = Math.round(((num >> 8) & 0xff) * factor);
  const b = Math.round((num & 0xff) * factor);
  return `rgb(${r},${g},${b})`;
}

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

// ─── Canvas Interactions ──────────────────────────────
function setupCanvasInteractions(canvas, ctx, data, W, H, cx, cy) {
  // Click to open node modal
  canvas.addEventListener("click", (e) => {
    const rect = canvas.getBoundingClientRect();
    const rawX = e.clientX - rect.left;
    const rawY = e.clientY - rect.top;

    // Transform to canvas space
    const canvasX = (rawX - state.canvas.offsetX) / state.canvas.scale;
    const canvasY = (rawY - state.canvas.offsetY) / state.canvas.scale;

    // Check central node
    const distCenter = Math.hypot(canvasX - cx, canvasY - cy);
    if (distCenter < 55) {
      openModal({
        name: data.topic,
        emoji: data.centralEmoji || "🧠",
        description: data.tagline || "Central concept of this mind map.",
        connections: data.nodes.map((n) => n.name),
        funFact: "This is your core topic. Click any surrounding node to explore!",
        isCenter: true,
      });
      return;
    }

    // Check outer nodes
    for (let np of nodePositions) {
      const dist = Math.hypot(canvasX - np.x, canvasY - np.y);
      if (dist < 38) {
        openModal(np.node);
        return;
      }
    }
  });

  // Drag to pan
  canvas.addEventListener("mousedown", (e) => {
    state.canvas.dragging = true;
    state.canvas.lastX = e.clientX;
    state.canvas.lastY = e.clientY;
    canvas.style.cursor = "grabbing";
  });

  canvas.addEventListener("mousemove", (e) => {
    if (!state.canvas.dragging) return;
    state.canvas.offsetX += e.clientX - state.canvas.lastX;
    state.canvas.offsetY += e.clientY - state.canvas.lastY;
    state.canvas.lastX = e.clientX;
    state.canvas.lastY = e.clientY;
  });

  canvas.addEventListener("mouseup", () => {
    state.canvas.dragging = false;
    canvas.style.cursor = "grab";
  });
  canvas.addEventListener("mouseleave", () => {
    state.canvas.dragging = false;
  });

  // Scroll to zoom
  canvas.addEventListener("wheel", (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    state.canvas.scale = Math.max(0.4, Math.min(3, state.canvas.scale * delta));
  }, { passive: false });

  // Touch support
  let lastTouchDist = 0;
  canvas.addEventListener("touchstart", (e) => {
    if (e.touches.length === 1) {
      state.canvas.dragging = true;
      state.canvas.lastX = e.touches[0].clientX;
      state.canvas.lastY = e.touches[0].clientY;
    } else if (e.touches.length === 2) {
      lastTouchDist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
    }
  }, { passive: true });

  canvas.addEventListener("touchmove", (e) => {
    if (e.touches.length === 1 && state.canvas.dragging) {
      state.canvas.offsetX += e.touches[0].clientX - state.canvas.lastX;
      state.canvas.offsetY += e.touches[0].clientY - state.canvas.lastY;
      state.canvas.lastX = e.touches[0].clientX;
      state.canvas.lastY = e.touches[0].clientY;
    } else if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      state.canvas.scale = Math.max(0.4, Math.min(3, state.canvas.scale * (dist / lastTouchDist)));
      lastTouchDist = dist;
    }
  }, { passive: true });

  canvas.addEventListener("touchend", () => { state.canvas.dragging = false; });
}

// ─── Modal ─────────────────────────────────────────────
function openModal(node) {
  document.getElementById("modalIcon").textContent = node.emoji || "✦";
  document.getElementById("modalTitle").textContent = node.name;
  document.getElementById("modalDesc").textContent =
    (node.description || "") + (node.funFact ? `\n\n💡 Fun Fact: ${node.funFact}` : "");

  const connsEl = document.getElementById("modalConnections");
  connsEl.innerHTML = "";
  (node.connections || []).forEach((c) => {
    const tag = document.createElement("span");
    tag.className = "modal-conn-tag";
    tag.textContent = c;
    connsEl.appendChild(tag);
  });

  document.getElementById("modalExplore").dataset.topic = node.name;
  document.getElementById("nodeModal").style.display = "flex";
}

// ─── Concepts Cards ────────────────────────────────────
function renderConceptCards(data) {
  const grid = document.getElementById("conceptsGrid");
  grid.innerHTML = "";

  data.nodes.forEach((node, i) => {
    const card = document.createElement("div");
    card.className = "concept-card";
    card.style.setProperty("--card-gradient", node.gradient);
    card.style.animationDelay = `${i * 0.08}s`;

    card.innerHTML = `
      <div class="concept-header">
        <span class="concept-emoji">${node.emoji || EMOJIS[i % EMOJIS.length]}</span>
        <span class="concept-name">${node.name}</span>
        <span class="concept-type">${node.type || "Concept"}</span>
      </div>
      <p class="concept-desc">${node.description}</p>
      ${node.funFact ? `<p class="concept-desc" style="margin-top:0.5rem; font-size:0.82rem; color: var(--text-muted);">💡 ${node.funFact}</p>` : ""}
      <div class="concept-connections">
        ${(node.connections || []).map((c) => `<span class="connection-tag">${c}</span>`).join("")}
      </div>
    `;
    grid.appendChild(card);
  });
}

// ─── Story Renderer ───────────────────────────────────
function renderStory(data) {
  const container = document.getElementById("storyContainer");
  const storyText = data.story || "No story generated.";
  const paragraphs = storyText.split(/\n+/).filter((p) => p.trim());

  container.innerHTML = `
    <div class="story-header">
      <span class="story-icon">📖</span>
      <div>
        <h3>The Story of ${data.topic}</h3>
        <span>AI-generated narrative • ${paragraphs.length} sections</span>
      </div>
    </div>
    <div class="story-text">
      ${paragraphs.map((p) => `<p>${p.trim()}</p>`).join("")}
    </div>
  `;
}

// ─── Quiz Renderer ────────────────────────────────────
function renderQuiz(data) {
  const container = document.getElementById("quizContainer");
  state.quizAnswers = {};
  state.quizScore = 0;
  state.quizTotal = data.quiz?.length || 0;

  let html = `
    <div class="quiz-header">
      <h3>🎓 Test Your Knowledge</h3>
      <p>AI-generated quiz on <strong>${data.topic}</strong> — ${state.quizTotal} questions</p>
      <div class="quiz-score-bar">
        <div class="score-item"><strong id="scoreDisplay">0</strong>Score</div>
        <div class="score-item"><strong>${state.quizTotal}</strong>Questions</div>
      </div>
    </div>
  `;

  (data.quiz || []).forEach((q, qi) => {
    html += `
      <div class="quiz-question" id="quiz_${qi}">
        <div class="question-num">Question ${qi + 1} of ${state.quizTotal}</div>
        <div class="question-text">${q.question}</div>
        <div class="quiz-options">
          ${q.options.map((opt, oi) => `
            <button class="quiz-option" data-qi="${qi}" data-oi="${oi}" data-correct="${q.correct}" id="qopt_${qi}_${oi}">
              <strong>${["A", "B", "C", "D"][oi]}.</strong> ${opt}
            </button>
          `).join("")}
        </div>
        <div class="quiz-explanation" id="quiz_exp_${qi}" style="display:none;">
          💬 ${q.explanation}
        </div>
      </div>
    `;
  });

  container.innerHTML = html;

  // Add click handlers
  container.querySelectorAll(".quiz-option").forEach((btn) => {
    btn.addEventListener("click", function () {
      const qi = parseInt(this.dataset.qi);
      const oi = parseInt(this.dataset.oi);
      const correct = parseInt(this.dataset.correct);

      if (state.quizAnswers[qi] !== undefined) return;
      state.quizAnswers[qi] = oi;

      // Disable all options for this question
      container.querySelectorAll(`[data-qi="${qi}"]`).forEach((b) => {
        b.disabled = true;
        const boi = parseInt(b.dataset.oi);
        if (boi === correct) b.classList.add("correct");
        else if (boi === oi && oi !== correct) b.classList.add("wrong");
      });

      // Show explanation
      document.getElementById(`quiz_exp_${qi}`).style.display = "block";

      // Update score
      if (oi === correct) {
        state.quizScore++;
        document.getElementById("scoreDisplay").textContent = state.quizScore;
        showToast("✅ Correct!", "success");
      } else {
        showToast("❌ Not quite right.", "error");
      }
    });
  });
}

// ═══════════════════════════════════════════════════════
//  DEMO MIND MAP (Hero Section)
// ═══════════════════════════════════════════════════════
function createDemoMindmap() {
  const container = document.getElementById("demoMindmap");
  const canvas = document.createElement("canvas");
  canvas.style.width = "100%";
  canvas.style.height = "100%";
  container.appendChild(canvas);

  function resize() {
    const dpr = window.devicePixelRatio || 1;
    const W = container.clientWidth;
    const H = container.clientHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = W + "px";
    canvas.style.height = H + "px";
    return { W, H, dpr };
  }

  const demoNodes = [
    { label: "Neural\nNetworks", emoji: "🧠", color: NODE_COLORS[0] },
    { label: "Deep\nLearning", emoji: "⚡", color: NODE_COLORS[1] },
    { label: "NLP", emoji: "💬", color: NODE_COLORS[2] },
    { label: "Computer\nVision", emoji: "👁️", color: NODE_COLORS[3] },
    { label: "Generative\nAI", emoji: "✨", color: NODE_COLORS[4] },
    { label: "Reinforcement\nLearning", emoji: "🎮", color: NODE_COLORS[5] },
  ];

  let tick = 0;
  let { W, H, dpr } = resize();

  function drawDemo() {
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, W * dpr, H * dpr);
    ctx.save();
    ctx.scale(dpr, dpr);

    const cx = W / 2;
    const cy = H / 2;
    const r = Math.min(W, H) * 0.33;
    tick += 0.008;

    // Draw connections
    demoNodes.forEach((n, i) => {
      const angle = (2 * Math.PI * i) / demoNodes.length + tick * 0.3;
      const nx = cx + r * Math.cos(angle);
      const ny = cy + r * Math.sin(angle);

      const lineGrad = ctx.createLinearGradient(cx, cy, nx, ny);
      lineGrad.addColorStop(0, "rgba(168,85,247,0.5)");
      lineGrad.addColorStop(1, "rgba(255,255,255,0.03)");
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(nx, ny);
      ctx.strokeStyle = lineGrad;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 6]);
      ctx.globalAlpha = 0.7;
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;
    });

    // Central node
    const pulse = 1 + 0.05 * Math.sin(tick * 3);
    const cGrad = ctx.createRadialGradient(cx - 15, cy - 15, 0, cx, cy, 40 * pulse);
    cGrad.addColorStop(0, "#8b5cf6");
    cGrad.addColorStop(1, "#4c1d95");
    ctx.beginPath();
    ctx.arc(cx, cy, 40 * pulse, 0, Math.PI * 2);
    ctx.fillStyle = cGrad;

    const glowGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 80 * pulse);
    glowGrad.addColorStop(0, "rgba(168,85,247,0.3)");
    glowGrad.addColorStop(1, "transparent");
    ctx.beginPath();
    ctx.arc(cx, cy, 80 * pulse, 0, Math.PI * 2);
    ctx.fillStyle = glowGrad;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(cx, cy, 40 * pulse, 0, Math.PI * 2);
    ctx.fillStyle = cGrad;
    ctx.fill();
    ctx.font = "22px serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("🤖", cx, cy - 6);
    ctx.font = "bold 9px Outfit, sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.fillText("AI", cx, cy + 14);

    // Outer nodes
    demoNodes.forEach((n, i) => {
      const angle = (2 * Math.PI * i) / demoNodes.length + tick * 0.3;
      const float = 3 * Math.sin(tick * 2 + i);
      const nx = cx + r * Math.cos(angle);
      const ny = cy + r * Math.sin(angle) + float;
      const nr = 28;

      const glowG = ctx.createRadialGradient(nx, ny, 0, nx, ny, nr * 2.2);
      glowG.addColorStop(0, n.color.glow);
      glowG.addColorStop(1, "transparent");
      ctx.beginPath();
      ctx.arc(nx, ny, nr * 2.2, 0, Math.PI * 2);
      ctx.fillStyle = glowG;
      ctx.globalAlpha = 0.5;
      ctx.fill();
      ctx.globalAlpha = 1;

      const ng = ctx.createRadialGradient(nx - nr * 0.3, ny - nr * 0.3, 0, nx, ny, nr);
      ng.addColorStop(0, n.color.bg);
      ng.addColorStop(1, darkenColor(n.color.bg, 0.6));
      ctx.beginPath();
      ctx.arc(nx, ny, nr, 0, Math.PI * 2);
      ctx.fillStyle = ng;
      ctx.fill();

      ctx.font = "14px serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(n.emoji, nx, ny - 5);
      ctx.font = "bold 7px Outfit, sans-serif";
      ctx.fillStyle = "rgba(255,255,255,0.9)";
      const lines = n.label.split("\n");
      ctx.fillText(lines[0], nx, ny + 6);
    });

    ctx.restore();
    requestAnimationFrame(drawDemo);
  }

  drawDemo();

  window.addEventListener("resize", () => {
    ({ W, H, dpr } = resize());
  });
}

// ═══════════════════════════════════════════════════════
//  PARTICLE SYSTEM
// ═══════════════════════════════════════════════════════
function initParticles() {
  const canvas = document.getElementById("particleCanvas");
  const ctx = canvas.getContext("2d");
  let W, H;

  const particles = Array.from({ length: 60 }, () => createParticle());

  function createParticle() {
    return {
      x: Math.random() * W,
      y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      size: Math.random() * 2 + 0.5,
      opacity: Math.random() * 0.5 + 0.1,
      color: ["#a855f7", "#06b6d4", "#6366f1", "#ec4899"][Math.floor(Math.random() * 4)],
    };
  }

  function resize() {
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = W;
    canvas.height = H;
    particles.forEach((p) => {
      p.x = Math.random() * W;
      p.y = Math.random() * H;
    });
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    particles.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0) p.x = W;
      if (p.x > W) p.x = 0;
      if (p.y < 0) p.y = H;
      if (p.y > H) p.y = 0;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.opacity;
      ctx.fill();
    });
    ctx.globalAlpha = 1;
    requestAnimationFrame(draw);
  }

  resize();
  window.addEventListener("resize", resize);
  draw();
}

// ─── Zoom / Pan Controls ──────────────────────────────
function setupCanvasControls() {
  document.getElementById("zoomInBtn").addEventListener("click", () => {
    state.canvas.scale = Math.min(3, state.canvas.scale * 1.2);
  });
  document.getElementById("zoomOutBtn").addEventListener("click", () => {
    state.canvas.scale = Math.max(0.4, state.canvas.scale / 1.2);
  });
  document.getElementById("resetViewBtn").addEventListener("click", () => {
    state.canvas.scale = 1;
    state.canvas.offsetX = 0;
    state.canvas.offsetY = 0;
  });
  document.getElementById("downloadBtn").addEventListener("click", downloadCanvas);
}

// ─── Download Canvas ──────────────────────────────────
function downloadCanvas() {
  if (animationFrameId) cancelAnimationFrame(animationFrameId);

  const container = document.getElementById("mindmapContainer");
  const canvas = document.getElementById("mindmapCanvas");
  const link = document.createElement("a");
  link.download = `neurosketch-${state.currentTopic.replace(/\s+/g, "-")}.png`;

  // Create a white-bg copy
  const exportCanvas = document.createElement("canvas");
  exportCanvas.width = canvas.width;
  exportCanvas.height = canvas.height;
  const ectx = exportCanvas.getContext("2d");
  ectx.fillStyle = "#050712";
  ectx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
  ectx.drawImage(canvas, 0, 0);

  link.href = exportCanvas.toDataURL("image/png");
  link.click();
  showToast("🖼️ Mind map downloaded!", "success");

  // Restart animation
  if (state.mindMapData) renderMindMapCanvas(state.mindMapData);
}

// ─── Tab Switching ────────────────────────────────────
function setupTabs() {
  const tabContents = {
    mindmap: "tabContentMindmap",
    concepts: "tabContentConcepts",
    story: "tabContentStory",
    quiz: "tabContentQuiz",
  };

  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.addEventListener("click", function () {
      const tab = this.dataset.tab;
      document.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("active"));
      this.classList.add("active");

      Object.values(tabContents).forEach((id) => {
        const el = document.getElementById(id);
        if (el) el.style.display = "none";
      });

      const targetEl = document.getElementById(tabContents[tab]);
      if (targetEl) {
        targetEl.style.display = "block";
        targetEl.style.animation = "fadeIn 0.3s ease";
      }
    });
  });
}

// ─── Toast ────────────────────────────────────────────
function showToast(msg, type = "default") {
  const toast = document.getElementById("toast");
  toast.textContent = msg;
  toast.className = `toast ${type} show`;
  setTimeout(() => {
    toast.className = "toast";
  }, 3000);
}

// ─── Scroll Header ────────────────────────────────────
function setupScrollHeader() {
  window.addEventListener("scroll", () => {
    const header = document.getElementById("header");
    if (window.scrollY > 20) header.classList.add("scrolled");
    else header.classList.remove("scrolled");
  });
}

// ─── Intersection Observer for Feature Cards ──────────
function setupCardAnimations() {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = "1";
          entry.target.style.transform = "translateY(0)";
        }
      });
    },
    { threshold: 0.1 }
  );

  document.querySelectorAll(".feature-card, .tech-item").forEach((card) => {
    card.style.opacity = "0";
    card.style.transform = "translateY(30px)";
    card.style.transition = `opacity 0.6s ease ${card.dataset.delay || 0}ms, transform 0.6s ease ${card.dataset.delay || 0}ms`;
    observer.observe(card);
  });
}



// ─── Main Input Setup ─────────────────────────────────
function setupInput() {
  const input = document.getElementById("topicInput");
  const btn = document.getElementById("generateBtn");

  btn.addEventListener("click", () => {
    const topic = input.value.trim();
    if (!topic) {
      showToast("✏️ Please enter a topic first!", "error");
      input.focus();
      return;
    }
    generateMindMap(topic);
  });

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") btn.click();
  });

  // Suggestion chips
  document.querySelectorAll(".suggestion-chip").forEach((chip) => {
    chip.addEventListener("click", function () {
      input.value = this.dataset.topic;
      btn.click();
    });
  });

  // Hero CTA
  document.getElementById("heroCtaBtn")?.addEventListener("click", () => {
    document.getElementById("generator").scrollIntoView({ behavior: "smooth" });
    setTimeout(() => input.focus(), 600);
  });
}

// ─── Action Buttons ───────────────────────────────────
function setupActionButtons() {
  document.getElementById("regenerateBtn")?.addEventListener("click", () => {
    if (state.currentTopic) generateMindMap(state.currentTopic);
  });

  document.getElementById("copyContentBtn")?.addEventListener("click", () => {
    if (!state.mindMapData) return;
    const text = [
      `Topic: ${state.mindMapData.topic}`,
      `Tagline: ${state.mindMapData.tagline}`,
      "",
      "Concepts:",
      ...state.mindMapData.nodes.map((n) => `- ${n.name}: ${n.description}`),
      "",
      "Story:",
      state.mindMapData.story,
    ].join("\n");
    navigator.clipboard.writeText(text).then(() => showToast("📋 Content copied!", "success"));
  });

  document.getElementById("newTopicBtn")?.addEventListener("click", () => {
    document.getElementById("resultsArea").style.display = "none";
    document.getElementById("topicInput").value = "";
    document.getElementById("topicInput").focus();
    document.getElementById("generator").scrollIntoView({ behavior: "smooth" });
  });
}

// ─── Modal Setup ──────────────────────────────────────
function setupModal() {
  document.getElementById("modalClose")?.addEventListener("click", () => {
    document.getElementById("nodeModal").style.display = "none";
  });

  document.getElementById("nodeModal")?.addEventListener("click", (e) => {
    if (e.target === document.getElementById("nodeModal")) {
      document.getElementById("nodeModal").style.display = "none";
    }
  });

  document.getElementById("modalExplore")?.addEventListener("click", function () {
    const topic = this.dataset.topic;
    document.getElementById("nodeModal").style.display = "none";
    document.getElementById("topicInput").value = topic;
    document.getElementById("generator").scrollIntoView({ behavior: "smooth" });
    setTimeout(() => generateMindMap(topic), 500);
  });

  // Keyboard close
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      document.getElementById("nodeModal").style.display = "none";
    }
  });
}

// ─── Logout ───────────────────────────────────────────
function logoutUser() {
  localStorage.removeItem("neuro_logged_in");
  window.location.href = "login.html";
}

// ─── Initialize Everything ────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  // Show logged-in user name in nav
  try {
    const user = JSON.parse(localStorage.getItem("neuro_logged_in") || "{}");
    if (user.name) {
      const nameEl = document.getElementById("navUserName");
      if (nameEl) nameEl.textContent = `Hi, ${user.name.split(" ")[0]}`;
    }
  } catch (e) { }
  initParticles();
  createDemoMindmap();
  setupScrollHeader();
  setupCardAnimations();
  setupInput();
  setupTabs();
  setupCanvasControls();
  setupActionButtons();
  setupModal();

  // ── Settings Modal (API Key — no validation) ──
  const openSettings = document.getElementById("openSettings");
  const settingsModal = document.getElementById("settingsModal");
  const settingsClose = document.getElementById("settingsClose");
  const settingsInput = document.getElementById("settingsApiInput");
  const settingsSave = document.getElementById("settingsSaveBtn");
  const settingsStatus = document.getElementById("settingsStatus");

  if (openSettings) {
    // Pre-fill with existing key
    if (state.apiKey && settingsInput) settingsInput.value = state.apiKey;

    openSettings.addEventListener("click", () => {
      settingsModal.style.display = "flex";
      if (settingsInput) settingsInput.focus();
    });
    settingsClose.addEventListener("click", () => { settingsModal.style.display = "none"; });
    settingsModal.addEventListener("click", (e) => { if (e.target === settingsModal) settingsModal.style.display = "none"; });

    settingsSave.addEventListener("click", () => {
      const key = settingsInput.value.trim();
      if (!key) { showToast("⚠️ Please paste your API key first", "error"); return; }
      setApiKey(key);
      settingsStatus.style.display = "block";
      showToast("🔑 API Key saved!", "success");
      setTimeout(() => { settingsModal.style.display = "none"; settingsStatus.style.display = "none"; }, 1200);
    });

    settingsInput.addEventListener("keydown", (e) => { if (e.key === "Enter") settingsSave.click(); });
  }

  console.log(
    "%c🧠 NeuroSketch%c\nAI-Powered Mind Map Generator\nPowered by Google Gemini 1.5 Flash",
    "font-size:20px; font-weight:bold; color:#a855f7;",
    "font-size:12px; color:#64748b;"
  );
});
